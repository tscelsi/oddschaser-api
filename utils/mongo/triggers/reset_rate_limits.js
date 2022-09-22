exports = function () {
  /*
  This function simply resets the API access count every day for rate limiting purposes.
  CRON: 0 0 * * * 
  */
  const mongodb = context.services.get("oddschaserapi")
  const users = mongodb.db("oddschaserapi").collection("users")

  return users.updateMany({}, { $set: { accesses: 0 } })
}
