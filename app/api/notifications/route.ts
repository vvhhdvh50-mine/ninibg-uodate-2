import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, Collection } from 'mongodb';
import { createPublicClient, http } from 'viem';
import { bsc, bscTestnet, mainnet, sepolia, polygon, polygonMumbai } from 'viem/chains';
import addressConfig, { TOKEN_OPERATOR_ABI } from '@/constents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type NotificationDoc = {
  address: string;
  chainId: string;
  lastCount: number;
  updatedAt: number;
};

const chains = {
  '56': bsc,
  '97': bscTestnet,
  '1': mainnet,
  '11155111': sepolia,
  '137': polygon,
  '80001': polygonMumbai,
};

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://harrybeta19:PGngOoZstHdxVbET@minner.s0ithwv.mongodb.net/';
const DB_NAME = 'approveminer';
const COLLECTION_NAME = 'notifications';

let clientPromise: Promise<MongoClient> | null = null;

async function getCollection(): Promise<Collection<NotificationDoc>> {
  if (!clientPromise) {
    clientPromise = MongoClient.connect(MONGO_URI);
  }
  const client = await clientPromise;
  const collection = client.db(DB_NAME).collection<NotificationDoc>(COLLECTION_NAME);
  await collection.createIndex({ address: 1, chainId: 1 }, { unique: true });
  return collection;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const chainId = searchParams.get('chainId') || '97';

    if (!address) {
      return NextResponse.json({ error: 'Missing address' }, { status: 400 });
    }

    const normalizedAddress = address.toLowerCase();
    const config = addressConfig[chainId as keyof typeof addressConfig] as { SPENDER?: string; RPC?: string } | undefined;
    const contractAddress = config?.SPENDER;
    const rpcUrl = config?.RPC;
    const chain = chains[chainId as keyof typeof chains];

    if (!contractAddress || !chain) {
      return NextResponse.json({ error: 'Unsupported chain' }, { status: 400 });
    }

    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl || chain.rpcUrls.default.http[0]),
    });

    const referredUsers = (await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: TOKEN_OPERATOR_ABI,
      functionName: 'getReferredUsers',
      args: [normalizedAddress as `0x${string}`],
    })) as readonly string[];

    const currentCount = Array.isArray(referredUsers) ? referredUsers.length : 0;

    const collection = await getCollection();
    const existing = await collection.findOne({ address: normalizedAddress, chainId });
    const previousCount = existing?.lastCount ?? 0;
    const newCount = Math.max(currentCount - previousCount, 0);

    return NextResponse.json({
      currentCount,
      previousCount,
      newCount,
      hasNew: newCount > 0,
      lastUpdated: existing?.updatedAt ?? null,
    });
  } catch (error) {
    console.error('Notification GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const address = typeof body.address === 'string' ? body.address : '';
    const chainId = typeof body.chainId === 'string' ? body.chainId : '97';
    const lastCountRaw = body.lastCount;

    if (!address) {
      return NextResponse.json({ error: 'Missing address' }, { status: 400 });
    }

    const lastCount = Number(lastCountRaw);
    if (!Number.isFinite(lastCount) || lastCount < 0) {
      return NextResponse.json({ error: 'Invalid lastCount' }, { status: 400 });
    }

    const normalizedAddress = address.toLowerCase();
    const collection = await getCollection();
    await collection.updateOne(
      { address: normalizedAddress, chainId },
      {
        $set: {
          address: normalizedAddress,
          chainId,
          lastCount,
          updatedAt: Date.now(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notification POST error:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
