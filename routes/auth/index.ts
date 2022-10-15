import express from 'express'
import { generateApiKey } from 'generate-api-key'
import { StatusCodes } from 'http-status-codes'
import createError from 'http-errors'
import { MongoClient, Db, ObjectId } from "mongodb"
import clientPromise from "../../utils/mongo/mongodb"

let router = express.Router()

const COLLECTION = 'users'
const DEFAULT_LIMIT = 20
const DEFAULT_USER_TYPE = 'user'
const DEFAULT_ACCESSES = 0

// create an api-key and metadata fields for a new user
router.post('/create/:userId', async (req, res, next) => {
    const client: MongoClient = await clientPromise
    const db: Db = client.db(process.env.MONGODB_DB)
    const { userId } = req.params
    const key = generateApiKey()
    let modifyResult
    try {
        modifyResult = await db.collection(COLLECTION).findOneAndUpdate({ _id: new ObjectId(userId) }, {
            _key: key,
            _type: DEFAULT_USER_TYPE,
            limit: DEFAULT_LIMIT,
            accesses: DEFAULT_ACCESSES
        }, { returnDocument: 'after' })
        if (modifyResult.ok) {
            res.status(StatusCodes.OK).json(modifyResult.value)
        } else {
            next(createError(StatusCodes.INTERNAL_SERVER_ERROR, 'Error updating user'))
        }
    } catch (exception: any) {
        console.error(exception)
        switch (exception.code) {
            case 11000:
                return next(createError(StatusCodes.BAD_REQUEST, "api key already exists"))
            default:
                return next(createError(StatusCodes.BAD_REQUEST, "cannot create user"))
        }
    }
})

export default router