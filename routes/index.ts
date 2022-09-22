import express from 'express'
let router = express.Router()

/* GET home page. */
router.get('/', function (req, res, next) {
  res.json({ version: "0.0.1" })
})

export default router
