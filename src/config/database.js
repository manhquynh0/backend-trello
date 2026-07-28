require('dotenv').config()

const {
  MongoClient
} = require('mongodb')
// or as an es module:
// import { MongoClient } from 'mongodb'
let db = null
// Connection URL
const url = process.env.MONGODB_URI
const client = new MongoClient(url)

// Database Name
const dbName = process.env.DATABASE_NAME

export const Connect_DB = async () => {
  await client.connect()
  db = client.db(dbName)
}
export const GET_DB = () => {
  if (!db) throw new Error('Must connect to Database first!!!')
  return db
}