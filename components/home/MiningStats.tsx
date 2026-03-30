'use client';

import { TrendingUp, Users, Globe, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import Tooltip from '@/components/ui/Tooltip';
import AnimatedNumber from '@/components/ui/AnimatedNumber';

export default function MiningStats() {

  const [stats, setStats] = useState({
    totalOutput: 0,
    totalRewards: 0,
    participants: 0,
    hashRate: 0,
  });

  useEffect(() => {
    let cancelled = false;

    // Initial fetch + recurring update loop
    const run = async () => {
      // Fetch on mount
      try {
        const res = await fetch('/api/mining-stats');
        if (res.ok && !cancelled) {
          setStats(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch mining stats:', err);
      }
    };
    run();

    // Every 3.5 seconds: POST to increment, then GET to fetch latest
    const interval = setInterval(async () => {
      try {
        await fetch('/api/mining-stats', { method: 'POST' });
        const res = await fetch('/api/mining-stats');
        if (res.ok && !cancelled) {
          setStats(await res.json());
        }
      } catch (err) {
        console.error('Failed to update mining stats:', err);
      }
    }, 3500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Format numbers with commas
  const formatNumber = (num: number) => {
    if (!Number.isFinite(num)) return '0';
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  const formatCurrency = (num: number) => {
    if (!Number.isFinite(num)) return '$0';
    return `$${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  // Format large numbers with K/M/B/T/P suffixes
  const formatHashRate = (num: number) => {
    if (!Number.isFinite(num) || num === 0) return '0';
    return num.toFixed(2);
  };

  return (
    <div className="mt-3 mb-6">
      {/* Total Output Card */}
      <div className="bg-linear-to-br from-teal-400 to-teal-500 rounded-2xl p-6 mb-4 relative overflow-hidden">
        <div className="absolute top-4 right-4 opacity-20">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
            <span className="text-3xl">💎</span>
          </div>
        </div>
        <div className="text-center relative z-10">
          <h2 className="text-3xl font-bold text-white mb-1"><AnimatedNumber value={stats.totalOutput} prefix="$" formatter={(v) => v.toLocaleString('en-US', { maximumFractionDigits: 0 })} /></h2>
          <div className="flex items-center justify-center gap-1">
            <p className="text-white text-sm font-medium">Total Output (USD)</p>
            <Tooltip text="Total USD value of all tokens mined by all users across the platform">
              <Info size={14} className="text-white opacity-80 cursor-help" />
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          {/* Total Rewards Distributed */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <TrendingUp size={16} className="text-orange-500" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-600 font-medium">Total Rewards</span>
                <Tooltip text="Total rewards earned and claimed by all users. Users earn 1% daily on their mined amount">
                  <Info size={12} className="text-gray-400 cursor-help" />
                </Tooltip>
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900"><AnimatedNumber value={stats.totalRewards} prefix="$" formatter={(v) => v.toLocaleString('en-US', { maximumFractionDigits: 0 })} /></p>
          </div>

          {/* Participants */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <Users size={16} className="text-red-500" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-600 font-medium">Participants</span>
                <Tooltip text="Total number of unique users who have mined tokens on the platform">
                  <Info size={12} className="text-gray-400 cursor-help" />
                </Tooltip>
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900"><AnimatedNumber value={stats.participants} formatter={(v) => v.toLocaleString('en-US', { maximumFractionDigits: 0 })} /></p>
          </div>

          {/* Current Hash Rate */}
          <div>
            <div className="flex items-center gap-1 mb-2">
              <span className="text-xs text-gray-600 font-medium">Current Hash rate</span>
              <Tooltip text="Platform activity metric calculated from total mined value and active users. Higher hash rate = more platform engagement">
                <Info size={12} className="text-gray-400 cursor-help" />
              </Tooltip>
            </div>
            <p className="text-xl font-bold text-gray-900">
              <AnimatedNumber value={stats.hashRate} decimals={2} />
              <span className="text-sm text-gray-500"> (PH/s)</span>
            </p>
          </div>

          {/* Countries Covered */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Globe size={16} className="text-blue-500" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-600 font-medium">Countries Covered</span>
                <Tooltip text="Number of countries where platform users are located">
                  <Info size={12} className="text-gray-400 cursor-help" />
                </Tooltip>
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">168+</p>
          </div>
        </div>
      </div>
    </div>
  );
}
