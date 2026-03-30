import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://harrybeta19:PGngOoZstHdxVbET@minner.s0ithwv.mongodb.net/';
const DB_NAME = 'approveminer';

let clientPromise: Promise<MongoClient> | null = null;

export function getClient(): Promise<MongoClient> {
  if (!clientPromise) {
    clientPromise = MongoClient.connect(MONGO_URI, {
      tls: true,
      tlsAllowInvalidCertificates: false,
    });
  }
  return clientPromise;
}

export async function getDb() {
  const client = await getClient();
  return client.db(DB_NAME);
}
