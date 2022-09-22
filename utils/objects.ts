import { Db, ObjectId } from "mongodb"
import { CreateMarketType, CreateMarketSchema } from "./schemas/markets"
import { arrangeMarketUpdate } from './mongo/arrangeUpdate'

const MARKET_COLLECTION = 'markets'

export const updateMarket = async (db: Db, market: CreateMarketType, upsert = false, validate = false) => {
    let body: CreateMarketType
    if (validate) {
        const result = CreateMarketSchema.safeParse(market)
        if (!result.success) {
            console.log(result.error)
            throw result.error
        }
        body = result.data
    } else {
        body = market
    }
    // does the market already exist in db?
    const alreadyExists = await db.collection(MARKET_COLLECTION).findOne({
        sport_ref: body.sport_ref,
        league_ref: body.league_ref,
        event_ref: body.event_ref,
        market_ref: body.market_ref
    })
    if (alreadyExists) {
        // generate mongo update query
        const updateQuery = arrangeMarketUpdate(body.odds)
        const updateResult = await db.collection(MARKET_COLLECTION).findOneAndUpdate({ _id: new ObjectId(alreadyExists._id) }, updateQuery, { returnDocument: "after" })
        return updateResult.value
    } else if (!alreadyExists && !upsert) {
        console.log("market not found")
        throw Error("market not found")
    }
    // insert if market doesn't already exist and upsert is true
    let insertResult
    try {
        insertResult = await db.collection(MARKET_COLLECTION).insertOne({ ...body })
    } catch (exception: any) {
        switch (exception.code) {
            case 11000:
                console.log("market already exists")
                throw Error("market already exists")
            default:
                console.log("cannot insert market")
                throw Error("cannot insert market")
        }
    }
    if (insertResult.acknowledged) {
        const new_market = await db.collection(MARKET_COLLECTION).findOne({ _id: new ObjectId(insertResult.insertedId) })
        return new_market
    }
}
