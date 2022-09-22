import express from 'express';
import { StatusCodes } from 'http-status-codes';
import createError from 'http-errors';
import { MongoClient, Db, ObjectId } from "mongodb";
import clientPromise from "../../utils/mongo/mongodb";
import { GETMarketSchema, CreateMarketSchema, UpdateMarketSchema, EventMarketType } from "../../utils/schemas/markets";
import { calculateSkip } from '../../utils/pagination';
import { arrangeMarketUpdate } from '../../utils/mongo/arrangeUpdate';
import { validateAdminKey } from '../../middleware/auth';

let router = express.Router();

const MAX_MARKETS_RETURNED = 25
const DEFAULT_PAGE = 1
const COLLECTION = "markets";


router.get('/', async (req, res, next) => {
    const client: MongoClient = await clientPromise;
    const db: Db = client.db(process.env.MONGODB_DB)
    const result = GETMarketSchema(MAX_MARKETS_RETURNED).safeParse(req.query);
    if (!result.success) {
        return next(result.error)
    } else {
        const { limit, page, site, query, ...rest } = result.data
        let find_query
        let siteArray = site ? site.split(",") : []
        if (siteArray.length) { find_query = { ...rest, sites: { $elemMatch: { $in: siteArray } } } }
        else { find_query = { ...rest } }

        let doc_count = await db.collection(COLLECTION).countDocuments(find_query);
        let skip = calculateSkip(limit ? limit : MAX_MARKETS_RETURNED, page ? page : DEFAULT_PAGE);
        let event_cursor = await db.collection(COLLECTION).find(find_query, { limit: limit ? limit : MAX_MARKETS_RETURNED, skip, sort: [["last_updated", -1]] })
        let data = await event_cursor.toArray()

        res.status(StatusCodes.OK).json({
            data, _meta: {
                page: page ? page : DEFAULT_PAGE,
                limit: limit ? limit : MAX_MARKETS_RETURNED,
                total_records: doc_count,
                count: data.length
            }
        });
    }
})

// router.post('/', validateAdminKey, async (req, res, next) => {
//     const client: MongoClient = await clientPromise;
//     const db: Db = client.db(process.env.MONGODB_DB)
//     // check if body formatted correctly
//     const result = CreateMarketSchema.safeParse(req.body);
//     if (!result.success) {
//         return next(result.error)
//     } else {
//         let parsed_body = result.data;
//         // check if market exists
//         const exists = await db.collection(COLLECTION).findOne({
//             sport_ref: parsed_body.sport_ref,
//             league_ref: parsed_body.league_ref,
//             event_ref: parsed_body.event_ref,
//             market_ref: parsed_body.market_ref
//         })
//         if (exists) {
//             // we don't update, we return a bad request
//             return next(createError(StatusCodes.BAD_REQUEST, "market already exists, try updating it instead"));
//         } else {
//             // if event doesn't exist, then we insert
//             let insert_result;
//             try {
//                 insert_result = await db.collection(COLLECTION).insertOne({ ...parsed_body, last_updated: new Date(Date.now()) })
//             } catch (exception: any) {
//                 switch (exception.code) {
//                     case 11000:
//                         return next(createError(StatusCodes.BAD_REQUEST, "event already exists"));
//                     default:
//                         return next(createError(StatusCodes.BAD_REQUEST, "cannot insert event"));
//                 }
//             }
//             if (insert_result.acknowledged) {
//                 const new_event = await db.collection(COLLECTION).findOne({ _id: new ObjectId(insert_result.insertedId) })
//                 res.status(StatusCodes.CREATED).json(new_event);
//             }
//         }
//     }
// })

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

// router.post('/:market_id', validateAdminKey, async (req, res, next) => {
//     const { market_id } = req.params;
//     const client: MongoClient = await clientPromise
//     const db: Db = client.db(process.env.MONGODB_DB)
//     const result = UpdateMarketSchema.safeParse(req.body)
//     if (!result.success) {
//         return next(result.error)
//     } else {
//         const body = result.data;
//         const updateQuery = arrangeMarketUpdate(body);
//         // update
//         try {
//             const updateResult = await db.collection(COLLECTION).findOneAndUpdate({ _id: new ObjectId(market_id as string) }, updateQuery, { returnDocument: "after" });
//             if (!updateResult.value) {
//                 return next(createError(StatusCodes.NOT_FOUND, "market not found"));
//             }
//             res.status(StatusCodes.ACCEPTED).json({ data: updateResult.value });
//         } catch (exception) {
//             if (isHttpError(exception)) throw exception;
//             return next(createError(StatusCodes.INTERNAL_SERVER_ERROR, "error updating market in database. Try again later"));
//         }
//     }
// })

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