import express, { Express } from 'express'
import request from 'supertest'
import router from '.'

var app: Express = express()
app.use('/', router)

describe('Home Routes', () => {
    test('/version', async () => {
        const res = await request(app).get('/')
        console.log(res)
        expect(res.status).toBe(200)
        expect(res.body).toEqual({ version: "0.0.1" })
    })
})