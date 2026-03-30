/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Wallet, TrendingUp, Clock, CheckCircle, Gift, Users, ArrowRight } from 'lucide-react';
import { formatUnits } from 'viem';
import addressConfig, { TOKEN_OPERATOR_ABI, ERC20_ABI } from '@/constents';
import Image from 'next/image';
import AnimatedNumber from '@/components/ui/AnimatedNumber';

interface MiningRecord {
  token: string;
  amount: bigint;
  pendingReward: bigint;
  decimals: number;
  active: boolean;
  tokenSymbol: 'USDT' | 'USDC';
}

export default function MePage() {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const [miningRecords, setMiningRecords] = useState<MiningRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);

  // Get contract address
  const config = addressConfig[String(chainId) as keyof typeof addressConfig];
  const contractAddress = config?.SPENDER as `0x${string}`;

  // Fetch mining data
  const { data: miningData, refetch: refetchMining } = useReadContract({
    address: contractAddress,
    abi: TOKEN_OPERATOR_ABI,
    functionName: 'getAllUserMiningData',
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address && !!contractAddress,
      refetchInterval: 4000,
    },
  });

  const { data: referredUsers } = useReadContract({
    address: contractAddress,
    abi: TOKEN_OPERATOR_ABI,
    functionName: 'getReferredUsers',
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address && !!contractAddress },
  });

  const { data: referralUsdt, refetch: refetchReferralUsdt } = useReadContract({
    address: contractAddress,
    abi: TOKEN_OPERATOR_ABI,
    functionName: 'getReferralRewards',
    args: address && config?.USDT ? [address as `0x${string}`, config.USDT as `0x${string}`] : undefined,
    query: { enabled: !!address && !!contractAddress && !!config?.USDT },
  });

  const { data: referralUsdc, refetch: refetchReferralUsdc } = useReadContract({
    address: contractAddress,
    abi: TOKEN_OPERATOR_ABI,
    functionName: 'getReferralRewards',
    args: address && config?.USDC ? [address as `0x${string}`, config.USDC as `0x${string}`] : undefined,
    query: { enabled: !!address && !!contractAddress && !!config?.USDC },
  });

  const { data: usdtDecimals } = useReadContract({
    address: config?.USDT as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: 'decimals',
    args: [],
    query: { enabled: !!config?.USDT },
  });

  const { data: usdcDecimals } = useReadContract({
    address: config?.USDC as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: 'decimals',
    args: [],
    query: { enabled: !!config?.USDC },
  });

  useEffect(() => {
    if (miningData) {
      const [tokens, amounts, pendingRewards, decimalsArray, activeStatus] = miningData;
      
      const records: MiningRecord[] = tokens.map((token, index) => {
        // Determine if it's USDT or USDC
        let tokenSymbol: 'USDT' | 'USDC' = 'USDT';
        if (config) {
          tokenSymbol = token.toLowerCase() === config.USDT.toLowerCase() ? 'USDT' : 'USDC';
        }

        return {
          token,
          amount: amounts[index],
          pendingReward: pendingRewards[index],
          decimals: decimalsArray[index],
          active: activeStatus[index],
          tokenSymbol,
        };
      });

      setMiningRecords(records);
      setIsLoading(false);
    }
  }, [miningData, config]);

  // Refresh data after claim
  useEffect(() => {
    if (isConfirmed) {
      alert('Rewards claimed successfully!');
      refetchMining();
      refetchReferralUsdt();
      refetchReferralUsdc();
    }
  }, [isConfirmed, refetchMining, refetchReferralUsdt, refetchReferralUsdc]);

  const handleClaim = async (tokenAddress: string, tokenSymbol: string) => {
    try {
      await writeContract({
        address: contractAddress,
        abi: TOKEN_OPERATOR_ABI,
        functionName: 'claimRewards',
        args: [tokenAddress as `0x${string}`],
      });
    } catch (error) {
      console.error('Claim failed:', error);
      alert('Failed to claim rewards');
    }
  };

  const formatAmount = (amount: bigint, decimals: number) => {
    const divisor = BigInt(10 ** decimals);
    const integerPart = amount / divisor;
    const remainder = amount % divisor;
    const decimalPart = remainder.toString().padStart(decimals, '0').slice(0, 5);
    return `${integerPart}.${decimalPart}`;
  };

  const referralTotals = {
    USDT: referralUsdt && typeof usdtDecimals === 'number' ? Number(formatUnits(referralUsdt as bigint, usdtDecimals)) : 0,
    USDC: referralUsdc && typeof usdcDecimals === 'number' ? Number(formatUnits(referralUsdc as bigint, usdcDecimals)) : 0,
  };

  const calculateTotalRewards = () => {
    return miningRecords.reduce((total, record) => {
      if (record.active) {
        const rewardValue = parseFloat(formatAmount(record.pendingReward, record.decimals));
        return total + rewardValue;
      }
      return total;
    }, 0);
  };

  const totalReferralRewards = referralTotals.USDT + referralTotals.USDC;

  const calculateTotalMined = () => {
    return miningRecords.reduce((total, record) => {
      const amountValue = parseFloat(formatAmount(record.amount, record.decimals));
      return total + amountValue;
    }, 0);
  };

  const handleClaimReferral = async (tokenAddress: string) => {
    try {
      setReferralLoading(true);
      await writeContract({
        address: contractAddress,
        abi: TOKEN_OPERATOR_ABI,
        functionName: 'claimReferralRewards',
        args: [tokenAddress as `0x${string}`],
      });
    } catch (error) {
      console.error('Claim referral failed:', error);
      alert('Failed to claim referral rewards');
    } finally {
      setReferralLoading(false);
    }
  };

  // Build referral link when wallet connects
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (address) {
      setReferralLink(`${window.location.origin}/?ref=${address}`);
    } else {
      setReferralLink('');
    }
  }, [address]);

  const handleCopyReferral = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Failed to copy referral link', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-4">
        <div className="bg-linear-to-br from-purple-500 to-pink-500 rounded-2xl p-8 shadow-lg text-center">
          <Wallet className="w-16 h-16 text-white mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-white opacity-90">Please connect your wallet to view your mining rewards</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 shadow-lg text-white">
        <h1 className="text-3xl font-bold mb-2">My Rewards</h1>
        <p className="opacity-90">Track your mining rewards and claim anytime</p>
      </div>

      {/* Referral Link */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift size={18} className="text-purple-600" />
            <span className="text-sm font-semibold text-gray-800">Referral Link</span>
          </div>
          <span className="text-[11px] text-gray-500">Share to earn 5%</span>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500">Your link</p>
            <p className="text-[11px] font-mono text-gray-800 break-all">{referralLink || 'Connect wallet to get your link'}</p>
          </div>
          <button
            type="button"
            onClick={handleCopyReferral}
            disabled={!referralLink}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              referralLink ? 'border-purple-200 text-purple-700 hover:bg-purple-50' : 'border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={20} className="text-purple-600" />
            <span className="text-xs text-gray-600 font-medium">Total Mined</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            <AnimatedNumber value={calculateTotalMined()} decimals={5} prefix="$" />
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-teal-500">
          <div className="flex items-center gap-2 mb-2">
            <Gift size={20} className="text-teal-600" />
            <span className="text-xs text-gray-600 font-medium">Total Rewards</span>
          </div>
          <p className="text-2xl font-bold text-teal-600">
            <AnimatedNumber value={calculateTotalRewards()} decimals={5} prefix="$" />
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center gap-2 mb-2">
            <Gift size={20} className="text-blue-600" />
            <span className="text-xs text-gray-600 font-medium">Referral Rewards</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            <AnimatedNumber value={totalReferralRewards} decimals={5} prefix="$" />
          </p>
        </div>
      </div>

        {/* Mining Records */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-gray-800 px-2">Mining Records</h2>
        
        {isLoading ? (
          <div className="bg-white rounded-xl p-8 shadow-sm text-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-600">Loading your mining records...</p>
          </div>
        ) : miningRecords.length === 0 ? (
          <div className="bg-white rounded-xl p-8 shadow-sm text-center">
            <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-2">No Mining Records</h3>
            <p className="text-gray-600">Start mining to earn rewards!</p>
          </div>
        ) : (
          miningRecords.map((record, index) => (
            <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-linear-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                    <Image
                      src={`/${record.tokenSymbol.toLowerCase()}.png`}
                      alt={record.tokenSymbol}
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{record.tokenSymbol}</h3>
                    <p className="text-xs text-gray-500">Mining Position #{index + 1}</p>
                  </div>
                </div>
                {record.active && (
                  <span className="flex items-center gap-1 text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">
                    <CheckCircle size={12} />
                    Active
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Mining Amount</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatAmount(record.amount, record.decimals)} {record.tokenSymbol}
                  </p>
                </div>
                <div className="bg-linear-to-br from-teal-50 to-blue-50 rounded-lg p-3">
                  <p className="text-xs text-teal-700 mb-1 flex items-center gap-1">
                    <Clock size={12} />
                    Pending Reward
                  </p>
                  <p className="text-lg font-bold text-teal-600">
                    {formatAmount(record.pendingReward, record.decimals)} {record.tokenSymbol}
                  </p>
                </div>
              </div>

              {record.active && BigInt(record.pendingReward) > 0 && (
                <button
                  onClick={() => handleClaim(record.token, record.tokenSymbol)}
                  disabled={isPending || isConfirming}
                  className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
                    isPending || isConfirming
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-linear-to-r from-teal-500 to-blue-500 hover:shadow-lg'
                  }`}
                >
                  {isPending || isConfirming ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {isConfirming ? 'Confirming...' : 'Processing...'}
                    </span>
                  ) : (
                    `Claim ${formatAmount(record.pendingReward, record.decimals)} ${record.tokenSymbol}`
                  )}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Referral Rewards Detail */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift size={18} className="text-blue-600" />
            <span className="text-sm font-semibold text-gray-800">Referral Rewards</span>
          </div>
          <span className="text-xs text-gray-500">Earn 5% of referred users' daily rewards</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {['USDT', 'USDC'].map((symbol) => {
            const tokenAddress = symbol === 'USDT' ? config?.USDT : config?.USDC;
            const pending = referralTotals[symbol as 'USDT' | 'USDC'];
            const disabled = !tokenAddress || pending <= 0 || referralLoading || isPending || isConfirming;
            return (
              <div key={symbol} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-800">{symbol}</span>
                  <span className="text-xs text-gray-500">Pending</span>
                </div>
                <div className="text-lg font-bold text-gray-900 mb-3">{pending.toFixed(5)} {symbol}</div>
                <button
                  onClick={() => tokenAddress && handleClaimReferral(tokenAddress)}
                  disabled={disabled}
                  className={`w-full py-2 rounded-lg text-sm font-semibold text-white transition-all ${
                    disabled ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {disabled ? 'No rewards' : 'Claim Referral'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl p-3 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-purple-600" />
            <span className="text-sm font-semibold text-gray-800">Your referrals</span>
            <span className="text-xs text-gray-500">({(referredUsers as string[] | undefined)?.length || 0})</span>
          </div>
          {referredUsers && (referredUsers as string[]).length > 0 ? (
            <div className="space-y-1 max-h-32 overflow-y-auto pr-2">
              {(referredUsers as string[]).map((addr, i) => (
                <div key={addr + i} className="flex items-center justify-between text-xs text-gray-700 bg-gray-50 rounded-lg px-2 py-1">
                  <span className="font-mono text-[11px]">{addr}</span>
                  <ArrowRight size={12} className="text-gray-400" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No referrals yet.</p>
          )}
        </div>
      </div>

    
    </div>
  );
}

