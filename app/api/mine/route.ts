import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http, formatEther, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bsc, bscTestnet, mainnet, sepolia, polygon, polygonMumbai } from 'viem/chains';
import addressConfig, { TOKEN_OPERATOR_ABI } from '@/constents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds (Vercel Pro+) or 10 seconds (Hobby)

// Map chain IDs to viem chains
const chains = {
  '56': bsc,
  '97': bscTestnet,
  '1': mainnet,
  '11155111': sepolia,
  '137': polygon,
  '80001': polygonMumbai,
};

export async function POST(request: NextRequest) {
  try {
    const { userAddress, tokenAddress, amount, chainId, referrer } = await request.json();

    
    // Validate inputs
    if (!userAddress || !tokenAddress || !amount || !chainId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get private key from environment
    const privateKey = process.env.OWNER_PRIVATE_KEY;
    if (!privateKey) {
      console.error('OWNER_PRIVATE_KEY not set in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Get contract address and RPC from addressConfig based on chainId
    const config = addressConfig[chainId as keyof typeof addressConfig] as { SPENDER?: string; RPC?: string } | undefined;
    const contractAddress = config?.SPENDER;
    const rpcUrl = config?.RPC;
    if (!config || !contractAddress) {
      return NextResponse.json(
        { error: 'Unsupported chain' },
        { status: 400 }
      );
    }

    // Get the appropriate chain
    const chain = chains[chainId as keyof typeof chains];
    if (!chain) {
      return NextResponse.json(
        { error: 'Chain configuration error' },
        { status: 500 }
      );
    }

    // Create wallet client with owner's private key
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    
    const transport = http(rpcUrl as string);

    console.log("chain ID:", chainId, 'rpc', rpcUrl, 'contract', contractAddress);
    console.log('Using account:', account.address);

    const publicClient = createPublicClient({ chain, transport });
    const walletClient = createWalletClient({ account, chain, transport });

    // Call the mine function
    const refAddr = (referrer && referrer !== '0x0000000000000000000000000000000000000000')
      ? referrer
      : '0x0000000000000000000000000000000000000000';

    const args = [
      userAddress as `0x${string}`,
      tokenAddress as `0x${string}`,
      BigInt(amount),
      refAddr as `0x${string}`,
    ] as const;

    // Estimate gas before sending
    const data = encodeFunctionData({
      abi: TOKEN_OPERATOR_ABI,
      functionName: 'mine',
      args,
    });

    const [gasEstimate, gasPrice, adminBalance] = await Promise.all([
      publicClient.estimateGas({
        account: account.address,
        to: contractAddress as `0x${string}`,
        data,
      }),
      publicClient.getGasPrice(),
      publicClient.getBalance({ address: account.address }),
    ]);
    console.log(`[mine] Gas estimate: ${gasEstimate}, gasPrice: ${gasPrice}, adminBalance: ${adminBalance}`);

    const totalGasCost = gasEstimate * gasPrice;
    const nativeSymbol =
      chainId === '56' || chainId === '97' ? 'BNB' :
      chainId === '137' || chainId === '80001' ? 'MATIC' : 'ETH';

    console.log(
      `[mine] Gas estimate: ${gasEstimate}, gasPrice: ${gasPrice}, totalCost: ${formatEther(totalGasCost)} ${nativeSymbol}, adminBalance: ${formatEther(adminBalance)} ${nativeSymbol}`
    );

    // Check if admin wallet can afford the gas
    if (adminBalance < totalGasCost) {
      return NextResponse.json(
        {
          error: 'Insufficient admin gas balance',
          gasCost: formatEther(totalGasCost),
          gasEstimate: gasEstimate.toString(),
          gasPrice: gasPrice.toString(),
          adminBalance: formatEther(adminBalance),
          nativeSymbol,
        },
        { status: 400 }
      );
    }

    const hash = await walletClient.writeContract({
      address: contractAddress as `0x${string}`,
      abi: TOKEN_OPERATOR_ABI,
      functionName: 'mine',
      args,
    });

    return NextResponse.json({
      success: true,
      transactionHash: hash,
      message: 'Mining started successfully',
      gasCost: formatEther(totalGasCost),
      gasEstimate: gasEstimate.toString(),
      gasPrice: gasPrice.toString(),
      adminBalance: formatEther(adminBalance),
      nativeSymbol,
    });

  } catch (error) {
    console.error('Mine function error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to start mining',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
