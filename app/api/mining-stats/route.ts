import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

const COLLECTION = 'miningStats';

async function ensureDoc() {
  const db = await getDb();
  const col = db.collection(COLLECTION);
  const doc = await col.findOne({ platform: 'miner' });
  if (doc) return doc;

  const initial = {
    platform: 'miner',
    totalOutput: 100000,
    totalRewards: 1000,
    participants: 50,
    hashRate: 0.45,
    platformRewards: 100000,
    activeUsers: 80,
    totalUsers: 120,
    usdtRewards: 2000,
    miningRewards: 500,
    referralBonuses: 300,
    totalUserRewards: 800,
    dailyBonuses: 150,
  };
  await col.insertOne(initial);
  return initial;
}

// GET — fetch current stats
export async function GET() {
  try {
    const doc = await ensureDoc();
    return NextResponse.json({
      totalOutput: doc.totalOutput,
      totalRewards: doc.totalRewards,
      participants: doc.participants,
      hashRate: doc.hashRate,
      platformRewards: doc.platformRewards ?? 100000,
      activeUsers: doc.activeUsers ?? 80,
      totalUsers: doc.totalUsers ?? 120,
      usdtRewards: doc.usdtRewards ?? 2000,
      miningRewards: doc.miningRewards ?? 500,
      referralBonuses: doc.referralBonuses ?? 300,
      totalUserRewards: doc.totalUserRewards ?? 800,
      dailyBonuses: doc.dailyBonuses ?? 150,
    });
  } catch (err) {
    console.error('mining-stats GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

// POST — increment stats by random amounts
export async function POST() {
  try {
    const db = await getDb();
    const col = db.collection(COLLECTION);

    const randomInt = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    // random hash rate wiggle
    const currentDoc = await ensureDoc();
    const delta = Math.random() * 0.4 - 0.2;
    const newHashRate = Math.min(0.9, Math.max(0.1, (currentDoc.hashRate as number) + delta));

    const result = await col.findOneAndUpdate(
      { platform: 'miner' },
      {
        $inc: {
          totalOutput: randomInt(30, 550),
          totalRewards: randomInt(5, 10),
          participants: randomInt(1, 3),
          platformRewards: randomInt(80, 250),
          activeUsers: randomInt(1, 2),
          totalUsers: randomInt(1, 3),
          usdtRewards: randomInt(5, 15),
          miningRewards: randomInt(10, 60),
          referralBonuses: randomInt(10, 60),
          totalUserRewards: randomInt(10, 60),
          dailyBonuses: randomInt(10, 60),
        },
        $set: {
          hashRate: Number(newHashRate.toFixed(2)),
        },
      },
      { returnDocument: 'after', upsert: true },
    );

    const updated = result;
    return NextResponse.json({
      totalOutput: updated?.totalOutput,
      totalRewards: updated?.totalRewards,
      participants: updated?.participants,
      hashRate: updated?.hashRate,
      platformRewards: updated?.platformRewards,
      activeUsers: updated?.activeUsers,
      totalUsers: updated?.totalUsers,
      usdtRewards: updated?.usdtRewards,
      miningRewards: updated?.miningRewards,
      referralBonuses: updated?.referralBonuses,
      totalUserRewards: updated?.totalUserRewards,
      dailyBonuses: updated?.dailyBonuses,
    });
  } catch (err) {
    console.error('mining-stats POST error:', err);
    return NextResponse.json({ error: 'Failed to update stats' }, { status: 500 });
  }
}
