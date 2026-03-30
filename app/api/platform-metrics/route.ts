/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { MongoClient, Collection, ObjectId } from 'mongodb';

type MetricDoc = {
  _id?: ObjectId;
  miningRewards: number;
  referralBonuses: number;
  totalUserRewards: number;
  dailyBonuses: number;
  lastTick: number;
};

const STEP_MS = 5000; // 5 seconds
const INCREMENTS = {
  miningRewards: 5, // increments by 5 every step
  referralBonuses: 10.5, // example float increment
  totalUserRewards: 7.25,
  dailyBonuses: 3.6,
};

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://harrybeta19:PGngOoZstHdxVbET@minner.s0ithwv.mongodb.net/';
const DB_NAME = 'approveminer';
const COLLECTION_NAME = 'platformMetrics';

let clientPromise: Promise<MongoClient> | null = null;

async function getCollection(): Promise<Collection<MetricDoc>> {
  if (!clientPromise) {
    clientPromise = MongoClient.connect(MONGO_URI);
  }
  const client = await clientPromise;
  return client.db(DB_NAME).collection<MetricDoc>(COLLECTION_NAME);
}

async function ensureDoc(): Promise<MetricDoc> {
  const collection = await getCollection();
  const id = '69958867c457aff07e3c6d5d'; // fixed ID to ensure single doc
  const newMongoId = new ObjectId(id);
  const existing = await collection.findOne({ _id: newMongoId });
  if (existing) return existing as MetricDoc;

  const initial: MetricDoc = {
    _id: newMongoId,
    miningRewards: 0,
    referralBonuses: 0,
    totalUserRewards: 0,
    dailyBonuses: 0,
    lastTick: Date.now(),
  };
  await collection.insertOne(initial);
  return initial;
}

async function applyTickIncrements(doc: MetricDoc): Promise<MetricDoc> {
  const now = Date.now();
  const steps = Math.floor((now - doc.lastTick) / STEP_MS);
  if (steps <= 0) return doc;

  const inc = {
    miningRewards: INCREMENTS.miningRewards * steps,
    referralBonuses: INCREMENTS.referralBonuses * steps,
    totalUserRewards: INCREMENTS.totalUserRewards * steps,
    dailyBonuses: INCREMENTS.dailyBonuses * steps,
  };

  const collection = await getCollection();
  await collection.updateOne(
    { _id: doc._id },
    {
      $inc: inc,
      $set: { lastTick: doc.lastTick + steps * STEP_MS },
    },
  );

  return {
    ...doc,
    miningRewards: doc.miningRewards + inc.miningRewards,
    referralBonuses: doc.referralBonuses + inc.referralBonuses,
    totalUserRewards: doc.totalUserRewards + inc.totalUserRewards,
    dailyBonuses: doc.dailyBonuses + inc.dailyBonuses,
    lastTick: doc.lastTick + steps * STEP_MS,
  };
}

export async function GET() {
  const doc = await ensureDoc();
  const updated = await applyTickIncrements(doc);
  return NextResponse.json({
    miningRewards: Number(updated.miningRewards.toFixed(2)),
    referralBonuses: Number(updated.referralBonuses.toFixed(2)),
    totalUserRewards: Number(updated.totalUserRewards.toFixed(2)),
    dailyBonuses: Number(updated.dailyBonuses.toFixed(2)),
  });
}

export async function POST(request: Request) {
  const collection = await getCollection();
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const base: MetricDoc = {
    miningRewards: Number(body.miningRewards) || 0,
    referralBonuses: Number(body.referralBonuses) || 0,
    totalUserRewards: Number(body.totalUserRewards) || 0,
    dailyBonuses: Number(body.dailyBonuses) || 0,
    lastTick: Date.now(),
  };

  await collection.deleteMany({});
  await collection.insertOne(base);

  return NextResponse.json({
    miningRewards: base.miningRewards,
    referralBonuses: base.referralBonuses,
    totalUserRewards: base.totalUserRewards,
    dailyBonuses: base.dailyBonuses,
  });
}
