'use client';

import { useMemo, useState } from 'react';
import { Bell, BellOff, ChevronDown, Coins, Gift, Clock, TrendingUp, Pickaxe } from 'lucide-react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import addressConfig, { TOKEN_OPERATOR_ABI } from '@/constents';

export default function NotificationPage() {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const [expanded, setExpanded] = useState(false);

  const chainIdStr = String(chainId || '97');
  const config = addressConfig[chainIdStr as keyof typeof addressConfig];
  const contractAddress = config?.SPENDER as `0x${string}` | undefined;

  const { data: miningData, isLoading } = useReadContract({
    address: contractAddress,
    abi: TOKEN_OPERATOR_ABI,
    functionName: 'getAllUserMiningData',
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: Boolean(address && contractAddress),
    },
  });

  const tokenNames: Record<string, string> = useMemo(() => {
    if (!config) return {};
    return {
      [(config.USDT ?? '').toLowerCase()]: 'USDT',
      [(config.USDC ?? '').toLowerCase()]: 'USDC',
    };
  }, [config]);

  const miningEntries = useMemo(() => {
    if (!miningData) return [];
    const [tokens, amounts, pendingRewards, decimalsArray, activeStatus] = miningData as [
      readonly string[],
      readonly bigint[],
      readonly bigint[],
      readonly number[],
      readonly boolean[]
    ];

    return tokens
      .map((token, i) => {
        const decimals = typeof decimalsArray[i] === 'number' ? decimalsArray[i] : 18;
        const mined = Number(formatUnits(amounts[i] ?? BigInt(0), decimals));
        const reward = Number(formatUnits(pendingRewards[i] ?? BigInt(0), decimals));
        const symbol = tokenNames[token?.toLowerCase()] || `${token?.slice(0, 6)}...`;
        return { token, symbol, mined, reward, active: activeStatus[i] ?? false };
      })
      .filter((e) => e.mined > 0);
  }, [miningData, tokenNames]);

  const hasMined = miningEntries.length > 0;
  const totalMined = miningEntries.reduce((s, e) => s + e.mined, 0);
  const totalRewards = miningEntries.reduce((s, e) => s + e.reward, 0);
  const isAnyActive = miningEntries.some((e) => e.active);

  if (!isConnected) {
    return (
      <div className="p-4">
        <div className="bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 shadow-lg text-center text-white">
          <Bell className="w-14 h-14 mx-auto mb-3" />
          <h2 className="text-2xl font-bold mb-1">Connect Wallet</h2>
          <p className="opacity-90">Connect your wallet to view mining notifications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Page header */}
      <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 border border-gray-100">
        <div className="relative w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
          <Bell className="text-purple-600" size={22} />
          {hasMined && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
              {miningEntries.length}
            </span>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-500">Notifications</p>
          <p className="text-base font-bold text-gray-900">Mining Activity</p>
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex justify-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* No notifications */}
      {!isLoading && !hasMined && (
        <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <BellOff className="w-14 h-14 mb-4 text-gray-200" />
          <p className="text-gray-600 font-semibold text-base">No Notifications</p>
          <p className="text-sm text-gray-400 mt-1 max-w-xs">
            You haven&apos;t started mining yet. Once you mine, your reward notifications will appear here.
          </p>
        </div>
      )}

      {/* Mining notification card */}
      {!isLoading && hasMined && (
        <div className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden">
          {/* Notification row — clickable header */}
          <button
            type="button"
            className="w-full text-left px-4 py-4 flex items-center gap-3 hover:bg-purple-50/60 transition-colors"
            onClick={() => setExpanded((v) => !v)}
          >
            <div className="w-11 h-11 rounded-full bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
              <Pickaxe className="text-white" size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900 text-sm">New Mining Reward</p>
                {isAnyActive && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                You have mined{' '}
                <span className="font-semibold text-purple-700">{totalMined.toFixed(2)}</span> tokens
                {totalRewards > 0 && (
                  <>
                    {' '}·{' '}
                    <span className="font-semibold text-teal-600">{totalRewards.toFixed(4)}</span> pending
                  </>
                )}
                {' '}· Tap for details
              </p>
            </div>
            <ChevronDown
              size={18}
              className={`text-gray-400 shrink-0 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Expandable detail panel — accordion from bottom */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              expanded ? 'max-h-200 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="border-t border-purple-100 bg-linear-to-b from-purple-50/60 to-white px-4 py-4 space-y-4">
              {/* Summary totals */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3 border border-purple-100 flex items-center gap-3 shadow-sm">
                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                    <Coins className="text-purple-600" size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Total Mined</p>
                    <p className="text-base font-bold text-gray-900">{totalMined.toFixed(4)}</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-teal-100 flex items-center gap-3 shadow-sm">
                  <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                    <Gift className="text-teal-600" size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Pending Reward</p>
                    <p className="text-base font-bold text-teal-700">{totalRewards.toFixed(4)}</p>
                  </div>
                </div>
              </div>

              {/* Per-token breakdown */}
              {miningEntries.map((entry, i) => (
                <div
                  key={entry.token || i}
                  className="bg-white rounded-xl border border-gray-100 p-3.5 space-y-3 shadow-sm"
                >
                  {/* Token header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <TrendingUp className="text-indigo-600" size={14} />
                      </div>
                      <span className="font-bold text-gray-900">{entry.symbol}</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        entry.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {entry.active ? '● Active' : 'Completed'}
                    </span>
                  </div>

                  {/* Amounts */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-purple-50 rounded-lg p-2.5">
                      <p className="text-[10px] text-purple-500 font-semibold uppercase tracking-wide">Amount Mined</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">
                        {entry.mined.toFixed(4)} {entry.symbol}
                      </p>
                    </div>
                    <div className="bg-teal-50 rounded-lg p-2.5">
                      <p className="text-[10px] text-teal-500 font-semibold uppercase tracking-wide">Pending Reward</p>
                      <p className="text-sm font-bold text-teal-700 mt-0.5">
                        {entry.reward.toFixed(4)} {entry.symbol}
                      </p>
                    </div>
                  </div>

                  {/* Yield info */}
                  {entry.mined > 0 && (
                    <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-500">
                      Yield rate:{' '}
                      <span className="font-semibold text-indigo-700">
                        {((entry.reward / entry.mined) * 100).toFixed(2)}%
                      </span>{' '}
                      of mined amount currently pending
                    </div>
                  )}
                </div>
              ))}

              {/* Upcoming rewards info */}
              <div className="bg-indigo-50 rounded-xl p-3.5 border border-indigo-100 flex items-start gap-2.5">
                <Clock className="text-indigo-500 mt-0.5 shrink-0" size={16} />
                <div>
                  <p className="text-sm font-semibold text-indigo-900">Upcoming Rewards</p>
                  <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
                    Your rewards accrue continuously while mining is active. Pending rewards above can
                    be claimed from the <span className="font-semibold">Reward Center</span>. Rewards
                    are distributed based on your mining share and the platform hashrate — the more you
                    mine, the higher your share.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
