'use client';

import { Gift, TrendingUp, Users, Star, Clock, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import Tooltip from '@/components/ui/Tooltip';
import AnimatedNumber from '@/components/ui/AnimatedNumber';

export default function RewardCenterPage() {

  const [stats, setStats] = useState({
    platformRewards: 0,
    totalOutput: 0,
    activeUsers: 0,
    totalUsers: 0,
    usdtRewards: 0,
    miningRewards: 0,
    referralBonuses: 0,
    totalUserRewards: 0,
    dailyBonuses: 0,
  });

  useEffect(() => {
    let cancelled = false;

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/mining-stats');
        if (res.ok && !cancelled) {
          const data = await res.json();
          setStats({
            platformRewards: data.platformRewards ?? 0,
            totalOutput: data.totalOutput ?? 0,
            activeUsers: data.activeUsers ?? 0,
            totalUsers: data.totalUsers ?? 0,
            usdtRewards: data.usdtRewards ?? 0,
            miningRewards: data.miningRewards ?? 0,
            referralBonuses: data.referralBonuses ?? 0,
            totalUserRewards: data.totalUserRewards ?? 0,
            dailyBonuses: data.dailyBonuses ?? 0,
          });
        }
      } catch (err) {
        console.error('Failed to fetch reward stats:', err);
      }
    };

    fetchStats();

    const interval = setInterval(async () => {
      try {
        await fetch('/api/mining-stats', { method: 'POST' });
        await fetchStats();
      } catch (err) {
        console.error('Failed to update reward stats:', err);
      }
    }, 4500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const countriesCovered = 168;
  const outputTarget = 1000000;
  const userTarget = 100000;
  const outputProgress = Math.min((stats.totalOutput / outputTarget) * 100, 100);
  const userProgress = Math.min((stats.totalUsers / userTarget) * 100, 100);

  // Format numbers
  const formatNumber = (num: number) => {
    if (!Number.isFinite(num)) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  const history = [
    { type: 'Mining Rewards', amount: stats.miningRewards },
    { type: 'Referral Bonuses', amount: stats.referralBonuses },
    { type: 'Total User Rewards', amount: stats.totalUserRewards },
    { type: 'Daily Bonuses', amount: stats.dailyBonuses },
  ];

  return (
    <div className="p-3 space-y-3 pb-6">
      {/* Platform Total Rewards */}
      <div className="bg-linear-to-br from-purple-500 to-indigo-600 rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10">
          <Gift size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Gift size={24} />
            <span className="text-sm font-medium">Platform Rewards Distributed</span>
            <Tooltip text="Total cumulative rewards distributed to all users in USDT and USDC across all chains">
              <Info size={14} className="text-white opacity-80 cursor-help" />
            </Tooltip>
          </div>
          <h2 className="text-3xl font-bold mb-1"><AnimatedNumber value={stats.platformRewards} prefix="$" formatter={(v) => v.toLocaleString('en-US', { maximumFractionDigits: 0 })} /></h2>
          <p className="text-sm text-purple-100">Total rewards paid to all users</p>
        </div>
      </div>

      {/* Platform Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
              <TrendingUp size={16} className="text-teal-600" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600 font-medium">Total Output</span>
              <Tooltip text="Cumulative value of all tokens mined by users on the platform">
                <Info size={12} className="text-gray-400 cursor-help" />
              </Tooltip>
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900"><AnimatedNumber value={stats.totalOutput} prefix="$" formatter={(v) => v.toLocaleString('en-US', { maximumFractionDigits: 0 })} /></p>
          <p className="text-xs text-gray-500 mt-1">Cumulative mined</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <Star size={16} className="text-orange-600" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600 font-medium">Active Users</span>
              <Tooltip text="Users who have mined tokens within the last 30 days">
                <Info size={12} className="text-gray-400 cursor-help" />
              </Tooltip>
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900"><AnimatedNumber value={stats.activeUsers} formatter={formatNumber} /></p>
          <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Users size={16} className="text-blue-600" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600 font-medium">Total Users</span>
              <Tooltip text="All unique users who have ever mined tokens since platform launch">
                <Info size={12} className="text-gray-400 cursor-help" />
              </Tooltip>
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900"><AnimatedNumber value={stats.totalUsers} formatter={formatNumber} /></p>
          <p className="text-xs text-gray-500 mt-1">All time</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
              <Clock size={16} className="text-rose-600" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600 font-medium">USDT Rewards</span>
              <Tooltip text="Total USDT rewards distributed to users. Users earn 1% daily on their mined amount">
                <Info size={12} className="text-gray-400 cursor-help" />
              </Tooltip>
            </div>
          </div>
          <p className="text-base font-bold text-gray-900"><AnimatedNumber value={stats.usdtRewards} prefix="$" formatter={(v) => v.toLocaleString('en-US', { maximumFractionDigits: 0 })} /></p>
          <p className="text-xs text-gray-500 mt-1">Total distributed</p>
        </div>
      </div>

      {/* Platform Milestones */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-base font-bold text-gray-900">Platform Milestones</h3>
          <Tooltip text="Progress towards major platform goals and achievements">
            <Info size={14} className="text-gray-400 cursor-help" />
          </Tooltip>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Total Output to $1M</p>
              <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-linear-to-r from-teal-400 to-blue-500" 
                  style={{ width: `${Math.min(outputProgress, 100)}%` }}
                ></div>
              </div>
            </div>
            <span className="ml-3 text-sm font-bold text-gray-900">{outputProgress.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Reach 100K Users</p>
              <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-linear-to-r from-purple-400 to-pink-500" 
                  style={{ width: `${Math.min(userProgress, 100)}%` }}
                ></div>
              </div>
            </div>
            <span className="ml-3 text-sm font-bold text-gray-900"><AnimatedNumber value={stats.totalUsers} formatter={formatNumber} /></span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{countriesCovered} Countries Coverage</p>
              <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-linear-to-r from-orange-400 to-red-500" style={{ width: '100%' }}></div>
              </div>
            </div>
            <span className="ml-3 text-sm font-bold text-gray-900">✓</span>
          </div>
        </div>
      </div>

      {/* Platform Distribution History */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-3">Platform Distribution History</h3>
        <div className="space-y-3">
          {history.map((record, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{record.type}</p>
                <p className="text-xs text-gray-500">Live</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-green-600"><AnimatedNumber value={record.amount} prefix="$" formatter={formatNumber} /></p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
