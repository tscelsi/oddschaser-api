import express from 'express';
import { StatusCodes } from 'http-status-codes';
import createError, { isHttpError } from 'http-errors';
import { MongoClient, Db, ObjectId } from "mongodb";
import clientPromise from "../../utils/mongo/mongodb";
import { GETMarketSchema, CreateMarketSchema, UpdateMarketSchema } from "../../utils/schemas/markets";
import { calculateSkip } from '../../utils/pagination';
import { arrangeMarketUpdate } from '../../utils/mongo/arrangeUpdate';
import { validateAdminKey } from '../../middleware/auth';

/**
 * @swagger
 * /markets:
 *   get:
 *     summary: Lists a subset of available markets
 *     parameters:
 *       - in: query
 *         name: limit
 *       - in: query
 *         name: skip
 *   post:
 *     summary: Creates or Updates an event
 */

let router = express.Router();

const MAX_MARKETS_RETURNED = 25
const DEFAULT_PAGE = 1
const COLLECTION = "markets";

router.get('/', async (req, res, next) => {
    const client: MongoClient = await clientPromise;
    const db: Db = client.db(process.env.MONGODB_DB)
    const { limit, page, ...rest } = GETMarketSchema(MAX_MARKETS_RETURNED).parse(req.query);
    let event_cursor;
    let find_query;
    find_query = { ...rest };
    let skip = calculateSkip(limit ? limit : MAX_MARKETS_RETURNED, page ? page : DEFAULT_PAGE);
    let doc_count = await db.collection(COLLECTION).countDocuments(find_query);
    event_cursor = await db.collection(COLLECTION).find(find_query, { limit: limit ? limit : MAX_MARKETS_RETURNED, skip, sort: [["last_updated", -1]] })
    let data = await event_cursor.toArray()
    res.status(StatusCodes.OK).json({
        data, _meta: {
            page: page ? page : DEFAULT_PAGE,
            limit: limit ? limit : MAX_MARKETS_RETURNED,
            total_records: doc_count,
            count: data.length
        }
    });
})

// TODO: make admin route
router.post('/', validateAdminKey, async (req, res, next) => {
    const client: MongoClient = await clientPromise;
    const db: Db = client.db(process.env.MONGODB_DB)
    // create or update event event
    // check if body formatted correctly
    const result = CreateMarketSchema.safeParse(req.body);
    if (!result.success) {
        return next(result.error)
    } else {
        let parsed_body = result.data;
        // check if market exists
        const exists = await db.collection(COLLECTION).findOne({
            sport_ref: parsed_body.sport_ref,
            league_ref: parsed_body.league_ref,
            event_ref: parsed_body.event_ref,
            market_ref: parsed_body.market_ref
        })
        if (exists) {
            // we don't update, we return a bad request
            return next(createError(StatusCodes.BAD_REQUEST, "market already exists, try updating it instead"));
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
            if (insert_result.acknowledged) {
                const new_event = await db.collection(COLLECTION).findOne({ _id: new ObjectId(insert_result.insertedId) })
                res.status(StatusCodes.CREATED).json(new_event);
            }
        }
    }
})

router.get('/:market_id', async (req, res, next) => {
    const { market_id } = req.params;
    const client: MongoClient = await clientPromise;
    const db: Db = client.db(process.env.MONGODB_DB)
    const market = await db.collection(COLLECTION).findOne({ _id: new ObjectId(market_id as string) })
    if (!market) {
        return next(createError(StatusCodes.NOT_FOUND, "market not found"));
    } else {
        res.status(StatusCodes.OK).json({ data: market });
    }
})

// TODO: make admin route
router.post('/:market_id', validateAdminKey, async (req, res, next) => {
    const { market_id } = req.params;
    const client: MongoClient = await clientPromise;
    const db: Db = client.db(process.env.MONGODB_DB)
    const result = UpdateMarketSchema.safeParse(req.body);
    if (!result.success) {
        return next(result.error)
    } else {
        const body = result.data;
        const updateQuery = arrangeMarketUpdate(body);
        // update
        try {
            const updateResult = await db.collection(COLLECTION).findOneAndUpdate({ _id: new ObjectId(market_id as string) }, updateQuery, { returnDocument: "after" });
            if (!updateResult.value) {
                return next(createError(StatusCodes.NOT_FOUND, "market not found"));
            }
            res.status(StatusCodes.ACCEPTED).json({ data: updateResult.value });
        } catch (exception) {
            if (isHttpError(exception)) throw exception;
            return next(createError(StatusCodes.INTERNAL_SERVER_ERROR, "error updating market in database. Try again later"));
        }
    }
})

// TODO: make admin route
router.delete('/:market_id', validateAdminKey, async (req, res, next) => {
    const { market_id } = req.params;
    const client: MongoClient = await clientPromise;
    const db: Db = client.db(process.env.MONGODB_DB)
    const deleteResult = await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(market_id as string) })
    if (deleteResult.deletedCount === 0) {
        return next(createError(StatusCodes.NOT_FOUND, "market not found"));
    } else {
        res.status(StatusCodes.ACCEPTED).json(null)
    }
})

export default router;