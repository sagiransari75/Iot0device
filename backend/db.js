// ─── Native MongoDB Connection ────────────────────────────────────────────────
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const { MongoClient, ObjectId } = require('mongodb');

const URI = process.env.DATABASE_URL;
if (!URI) throw new Error('DATABASE_URL is not set in .env');

const client = new MongoClient(URI, {
  tls: true,
  tlsAllowInvalidCertificates: true,   // handles clock-skew cert errors
  serverSelectionTimeoutMS: 10000,
});
let db = null;

async function connect() {
  if (db) return db;
  await client.connect();
  db = client.db(); // uses the db name from the URI
  console.log('✅ MongoDB connected:', db.databaseName);
  return db;
}

// Helper: convert string → ObjectId safely
function toObjectId(id) {
  try { return new ObjectId(id); }
  catch { return null; }
}

module.exports = { connect, toObjectId, ObjectId };
