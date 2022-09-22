import express from 'express'
import { generateApiKey } from 'generate-api-key'
import { StatusCodes } from 'http-status-codes'
import createError from 'http-errors'
import { MongoClient, Db, ObjectId } from "mongodb"
import clientPromise from "../../utils/mongo/mongodb"

let router = express.Router()

const COLLECTION = 'users'
const DEFAULT_LIMIT = 1000
const DEFAULT_USER_TYPE = 'user'
const DEFAULT_ACCESSES = 0

// create a new user
router.post('/create', async (req, res, next) => {
    const client: MongoClient = await clientPromise
    const db: Db = client.db(process.env.MONGODB_DB)
    const key = generateApiKey()
    let insert_result
    try {
        insert_result = await db.collection(COLLECTION).insertOne({
            _key: key,
            _type: DEFAULT_USER_TYPE,
            limit: DEFAULT_LIMIT,
            accesses: DEFAULT_ACCESSES
        })
    } catch (exception: any) {
        console.error(exception)
        switch (exception.code) {
            case 11000:
                return next(createError(StatusCodes.BAD_REQUEST, "api key already exists"))
            default:
                return next(createError(StatusCodes.BAD_REQUEST, "cannot create user"))
        }
    }
    if (insert_result.acknowledged) {
        const new_user = await db.collection(COLLECTION).findOne({ _id: new ObjectId(insert_result.insertedId) })
        res.status(StatusCodes.CREATED).json(new_user)
    }
})

export default router