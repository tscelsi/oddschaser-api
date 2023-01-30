import { Request, Response, NextFunction } from "express"
import { StatusCodes } from "http-status-codes"
import createError from 'http-errors'
import { MongoClient, Db } from "mongodb"
import clientPromise from "../utils/mongo/mongodb"
import { MongoUser } from "types"
import { UniqueTokenStrategy } from 'passport-unique-token'
import passport from 'passport'
import sha256 from 'crypto-js/sha256';

// api-key support
passport.use(
    new UniqueTokenStrategy(async (token, done) => {
        const client: MongoClient = await clientPromise
        const db: Db = await client.db(process.env.MONGODB_DB)
        const tokenHash = sha256(token)
        try {
            const user = await db.collection('users').findOne<MongoUser>({ _key: tokenHash })
            if (!user) return done(null, false)
            return done(null, user)
        } catch (err: any) {
            return done(err)
        }
    })
)

export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('token', (err, user, info) => {
        if (err) {
            return next(createError(StatusCodes.INTERNAL_SERVER_ERROR, 'server error when validating API key'))
        }
        if (!user) {
            return next(createError(StatusCodes.UNAUTHORIZED, 'invalid API key'))
        }
        req.user = user
        return next()
    })(req, res, next)
}

export const validateAdminKey = (req: Request, res: Response, next: NextFunction) => {
    if (req.user) {
        const user = req.user
        // @ts-ignore
        if (user._type !== 'admin') {
            return next(createError(StatusCodes.FORBIDDEN, 'forbidden'))
        }
        return next()
    } else {
        return next(createError(StatusCodes.INTERNAL_SERVER_ERROR, 'user not found'))
    }
}