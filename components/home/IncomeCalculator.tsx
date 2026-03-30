'use client';

import { useMemo, useState } from 'react';

const tiers = [
  { min: 16, max: 99, level: 'Mine-1', rate: 1 },
  { min: 100, max: 499, level: 'Mine-2', rate: 1.5 },
  { min: 500, max: 999, level: 'Mine-3', rate: 3 },
  { min: 1000, max: 4999, level: 'Mine-4', rate: 5 },
  { min: 5000, max: 9999, level: 'Mine-5', rate: 7 },
  { min: 10000, max: 29999, level: 'Mine-6', rate: 9 },
  { min: 30000, max: 79999, level: 'Mine-7', rate: 11 },
  { min: 80000, max: 159999, level: 'Mine-8', rate: 13 },
];

export default function IncomeCalculator() {
  const [usdBalance, setUsdBalance] = useState('100');
  const balance = parseFloat(usdBalance) || 0;

  const currentTier = useMemo(() => {
    if (balance < tiers[0].min) return null;
    return tiers.find((t) => balance >= t.min && balance <= t.max) || tiers[tiers.length - 1];
  }, [balance]);

  const dailyIncome = currentTier ? (balance * (currentTier.rate / 100)) : 0;
  const hourlyIncome = dailyIncome / 24;

  return (
    <div className="mt-3 mb-6">
      <h3 className="text-lg font-bold text-gray-400 mb-3">Income Calculator</h3>
      
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        {/* Input */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1.5">Enter amount (USDT/USDC)</label>
          <input
            type="number"
            value={usdBalance}
            onChange={(e) => setUsdBalance(e.target.value)}
            className="w-full bg-gray-50 rounded-xl px-4 py-3 text-base font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter amount"
          />
        </div>

        {/* Results */}
        <div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Level</span>
            <span className="text-base font-bold text-gray-900">
              {currentTier ? currentTier.level : 'Not eligible (min 16)'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Hourly income(USD)</span>
            <span className="text-base font-bold text-gray-900">{hourlyIncome.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-500">Daily income(USD)</span>
            <span className="text-base font-bold text-gray-900">{dailyIncome.toFixed(2)}</span>
          </div>
          {currentTier && (
            <p className="text-xs text-gray-500 mt-1">Rate: {currentTier.rate}% daily</p>
          )}
        </div>
      </div>
    </div>
  );
}
