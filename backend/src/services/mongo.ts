import { MongoClient, Db, GridFSBucket } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.DB_NAME || 'image_upload_db';

let client: MongoClient;
let db: Db;

export async function connectDb() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    console.log(`Connected to MongoDB: ${dbName}`);
    db = client.db(dbName);
  }
  return db;
}

export function getDb(): Db {
  if (!db) throw new Error('Database not connected yet. Call connectDb() first.');
  return db;
}

export function getBucket(): GridFSBucket {
  if (!db) throw new Error('Database not connected yet. Call connectDb() first.');
  return new GridFSBucket(db, { bucketName: 'images' }); 
}
