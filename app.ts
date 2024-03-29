import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
if (process.env.NODE_ENV !== "production") {
  dotenv.config()
}
import 'module-alias/register'
import serverless from 'serverless-http'
import createError, { HttpError } from 'http-errors'
import express, { Express, Request, Response, NextFunction } from 'express'
import path from 'path'
import cookieParser from 'cookie-parser'
import logger from 'morgan'
import { z } from 'zod'
import { validateApiKey, validateAdminKey } from './middleware/auth'
import { rateLimit } from './middleware/rateLimit'

import indexRouter from "./routes"
import eventsRouter from './routes/events'
import marketsRouter from './routes/markets'
import authRouter from './routes/auth'
import usersRouter from './routes/users'

var app: Express = express()


app.use(logger('combined'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', indexRouter)
app.use('/markets', validateApiKey, rateLimit, marketsRouter)
app.use('/events', validateApiKey, rateLimit, eventsRouter)
app.use('/auth', validateApiKey, validateAdminKey, authRouter)
app.use('/users', usersRouter)

// catch 404 and forward to error handler
app.use(function (req: Request, res: Response, next: NextFunction) {
  next(createError(404))
})

// error handler
app.use(function (err: Error, req: Request, res: Response, next: NextFunction) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}
  if (err instanceof HttpError) {
    // render the error page
    res.status(err.status || 500)
    res.json({ statusCode: err.status || 500, message: err.message, details: err.details })
  } else if (err instanceof z.ZodError) {
  res.status(400)
  res.json({ statusCode: 400, message: err.issues })
} else {
  res.status(500)
  res.json({ statusCode: 500, message: "internal server error" })
}
})

// const port = 3001
// app.listen(port, () => {
//   console.log(`application is running on port ${port}.`)
// })
export const handler = serverless(app)
