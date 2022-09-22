import { Request, Response, NextFunction } from "express"
import { StatusCodes } from "http-status-codes"
import createError from 'http-errors'
import { MongoClient, Db } from "mongodb"
import clientPromise from "../utils/mongo/mongodb"

// must be called after validateApiKey middleware
export const rateLimit = async (req: Request, res: Response, next: NextFunction) => {
    const client: MongoClient = await clientPromise
    const db: Db = client.db(process.env.MONGODB_DB)
    const user = req.user
    // req.user always defined at this point when called after validateApiKey
    // @ts-ignore
    if (user._type === 'admin') {
        return next()
    }
    // @ts-ignore
    if (user.accesses >= user.limit) {
        return next(createError(StatusCodes.TOO_MANY_REQUESTS, 'limit has been reached'))
    }
    // @ts-ignore
    await db.collection('users').updateOne({ _key: user._key }, { $inc: { accesses: 1 } })
    next()
}