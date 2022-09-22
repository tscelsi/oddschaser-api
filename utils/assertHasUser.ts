import { Request } from "express"

function assertHasUser(req: Request) {
    if (!req.user) {
        throw new Error("Request object without user found unexpectedly")
    }
}

export { assertHasUser }