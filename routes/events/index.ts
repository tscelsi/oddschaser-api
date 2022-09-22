import express from 'express';
import { StatusCodes } from 'http-status-codes';
import createError, { HttpError } from 'http-errors';
import { MongoClient, Db, ObjectId } from "mongodb";
import clientPromise from "../../utils/mongo/mongodb";
import { GETEventSchema, CreateEventSchema, UpdateEventSchema, EventIdentifierSchema } from "../../utils/schemas/events";
import { calculateSkip } from '../../utils/pagination';
import { arrangeEventUpdate } from '../../utils/mongo/arrangeUpdate';
import { validateAdminKey } from '../../middleware/auth';
import { updateMarket } from '../../utils/objects';

let router = express.Router();

const MAX_EVENTS_RETURNED = 25
const DEFAULT_PAGE = 1
const COLLECTION = "events";


router.get('/', async (req, res, next) => {
    const client: MongoClient = await clientPromise;
    const db: Db = client.db(process.env.MONGODB_DB)
    const result = GETEventSchema(MAX_EVENTS_RETURNED).safeParse(req.query);
    if (!result.success) {
        return next(result.error)
    } else {
        const { limit, page, site, query, ...rest } = result.data;

        let find_query;
        let siteArray = site ? site.split(",") : [];
        if (siteArray.length) { find_query = { ...rest, sites: { $elemMatch: { $in: siteArray } } } }
        else { find_query = { ...rest } }

        let doc_count = await db.collection(COLLECTION).countDocuments(find_query);
        let skip = calculateSkip(limit ? limit : MAX_EVENTS_RETURNED, page ? page : DEFAULT_PAGE);
        let event_cursor = await db.collection(COLLECTION).find(find_query, { limit: limit ? limit : MAX_EVENTS_RETURNED, skip, sort: [["last_updated", -1]] })
        let data = await event_cursor.toArray()

        res.status(StatusCodes.OK).json({
            data, _meta: {
                page: page ? page : DEFAULT_PAGE,
                limit: limit ? limit : MAX_EVENTS_RETURNED,
                total_records: doc_count,
                count: data.length
            }
        });
    }
})

router.post('/', validateAdminKey, async (req, res, next) => {
    const client: MongoClient = await clientPromise;
    const db: Db = client.db(process.env.MONGODB_DB)
    // check if body formatted correctly
    const result = CreateEventSchema.safeParse(req.body);
    if (!result.success) {
        return next(result.error)
    } else {
        const parsed_body = result.data
        // check if event exists, if yes, then it is a bad request
        const exists = await db.collection(COLLECTION).findOne({
            sport_ref: parsed_body.sport_ref,
            league_ref: parsed_body.league_ref,
            event_ref: parsed_body.event_ref
        })
        if (exists) {
            return next(createError(StatusCodes.BAD_REQUEST, "event already exists, try updating it instead", { details: { _id: exists._id } }));
        } else {
            // if event doesn't exist, then we insert
            let insert_result;
            try {
                insert_result = await db.collection(COLLECTION).insertOne({ ...parsed_body, last_updated: new Date(Date.now()) })
            } catch (exception: any) {
                switch (exception.code) {
                    case 11000:
                        return next(createError(StatusCodes.BAD_REQUEST, "event already exists"));
                    default:
                        return next(createError(StatusCodes.BAD_REQUEST, "cannot insert event"));
                }
            }
            // update or insert markets from event
            Object.values(parsed_body.markets).forEach(market => {
                try {
                    // upsert true, validation false as we have already validated in the CreateEventSchema
                    updateMarket(db, market, true, false)
                } catch (exception: any) {
                    // we should log any exceptions but fail without error
                    console.log(exception)
                }
            })
            if (insert_result.acknowledged) {
                const new_event = await db.collection(COLLECTION).findOne({ _id: new ObjectId(insert_result.insertedId) })
                res.status(StatusCodes.CREATED).json(new_event);
            }
        }
    }
})

router.post('/exists', async (req, res, next) => {
    const client: MongoClient = await clientPromise;
    const db: Db = client.db(process.env.MONGODB_DB)
    // check if body formatted correctly
    const result = EventIdentifierSchema.safeParse(req.body);
    if (!result.success) {
        return next(result.error)
    } else {
        const parsed_body = result.data
        // check if event exists, if yes, then return true
        const exists = await db.collection(COLLECTION).findOne({
            sport_ref: parsed_body.sport_ref,
            league_ref: parsed_body.league_ref,
            event_ref: parsed_body.event_ref
        })
        if (exists) {
            res.status(StatusCodes.OK).json({ exists: true, id: exists._id });
        } else {
            res.status(StatusCodes.OK).json({ exists: false });
        }
    }
})

router.get('/:event_id', async (req, res, next) => {
    const client: MongoClient = await clientPromise;
    const db: Db = client.db(process.env.MONGODB_DB)
    const { event_id } = req.params;
    const event = await db.collection(COLLECTION).findOne({ _id: new ObjectId(event_id as string) })
    if (!event) {
        return next(createError(StatusCodes.NOT_FOUND, "event not found"));
    } else {
        res.status(StatusCodes.OK).json(event);
    }
})

router.post('/:event_id', validateAdminKey, async (req, res, next) => {
    const { event_id } = req.params
    const client: MongoClient = await clientPromise
    const db: Db = client.db(process.env.MONGODB_DB)
    const result = UpdateEventSchema.safeParse(req.body)
    if (!result.success) {
        return next(result.error)
    } else {
        const body = result.data
        const updateQuery = arrangeEventUpdate(body)
        // update
        try {
            const updateResult = await db.collection(COLLECTION).findOneAndUpdate({ _id: new ObjectId(event_id as string) }, updateQuery, { returnDocument: "after" })
            // kick off async-update or async-insert of markets from updated event
            Object.values(body.markets).forEach(async market => {
                // upsert true, validation false as we have already validated in the UpdateEventSchema
                updateMarket(db, market, true, false)
            })
            if (!updateResult.value) {
                return next(createError(StatusCodes.NOT_FOUND, "event not found"))
            }
            res.status(StatusCodes.ACCEPTED).json({ data: updateResult.value })
        } catch (exception) {
            console.log(exception)
            if (exception instanceof HttpError) throw exception
            return next(createError(StatusCodes.INTERNAL_SERVER_ERROR, "error updating event in database. Try again later"))
        }
    }
})

router.delete('/:event_id', validateAdminKey, async (req, res, next) => {
    const { event_id } = req.params;
    const client: MongoClient = await clientPromise;
    const db: Db = client.db(process.env.MONGODB_DB)
    const deleteResult = await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(event_id as string) })
    if (deleteResult.deletedCount === 0) {
        return next(createError(StatusCodes.NOT_FOUND, "event not found"));
    } else {
        res.status(StatusCodes.ACCEPTED).json(null)
    }
})

export default router;