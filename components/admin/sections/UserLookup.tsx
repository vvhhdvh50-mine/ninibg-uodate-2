import { useState } from 'react';
import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { Search, Wallet, Pickaxe, UserCheck } from 'lucide-react';
import { TOKEN_OPERATOR_ABI, ERC20_ABI } from '@/constents';
import { fmtUnits, shortAddr, type AdminTokenConfig } from '@/components/admin/helpers';
import { Section } from '@/components/admin/shared';

export default function UserLookup({
  contractAddress,
  config,
}: {
  contractAddress: `0x${string}` | undefined;
  config: AdminTokenConfig | undefined;
}) {
  const [queryAddr, setQueryAddr] = useState('');
  const [activeAddr, setActiveAddr] = useState<`0x${string}` | undefined>();

  const { data: miningData } = useReadContract({
    address: contractAddress,
    abi: TOKEN_OPERATOR_ABI,
    functionName: 'getAllUserMiningData',
    args: activeAddr ? [activeAddr] : undefined,
    query: { enabled: !!activeAddr && !!contractAddress },
  });

  const { data: referredUsers } = useReadContract({
    address: contractAddress,
    abi: TOKEN_OPERATOR_ABI,
    functionName: 'getReferredUsers',
    args: activeAddr ? [activeAddr] : undefined,
    query: { enabled: !!activeAddr && !!contractAddress },
  });

  const { data: recordsCount } = useReadContract({
    address: contractAddress,
    abi: TOKEN_OPERATOR_ABI,
    functionName: 'getUserMiningRecordsCount',
    args: activeAddr ? [activeAddr] : undefined,
    query: { enabled: !!activeAddr && !!contractAddress },
  });

  const { data: rewardsUsdt } = useReadContract({
    address: contractAddress,
    abi: TOKEN_OPERATOR_ABI,
    functionName: 'getReferralRewards',
    args: activeAddr && config?.USDT ? [activeAddr, config.USDT as `0x${string}`] : undefined,
    query: { enabled: !!activeAddr && !!contractAddress && !!config?.USDT },
  });

  const { data: rewardsUsdc } = useReadContract({
    address: contractAddress,
    abi: TOKEN_OPERATOR_ABI,
    functionName: 'getReferralRewards',
    args: activeAddr && config?.USDC ? [activeAddr, config.USDC as `0x${string}`] : undefined,
    query: { enabled: !!activeAddr && !!contractAddress && !!config?.USDC },
  });

  const { data: usdtBal } = useReadContract({
    address: config?.USDT as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: activeAddr ? [activeAddr] : undefined,
    query: { enabled: !!activeAddr && !!config?.USDT },
  });
  const { data: usdtDec } = useReadContract({
    address: config?.USDT as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: 'decimals',
    args: [],
    query: { enabled: !!config?.USDT },
  });
  const { data: usdcBal } = useReadContract({
    address: config?.USDC as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: activeAddr ? [activeAddr] : undefined,
    query: { enabled: !!activeAddr && !!config?.USDC },
  });
  const { data: usdcDec } = useReadContract({
    address: config?.USDC as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: 'decimals',
    args: [],
    query: { enabled: !!config?.USDC },
  });

  const handleSearch = () => {
    const v = queryAddr.trim();
    if (v.startsWith('0x') && v.length === 42) setActiveAddr(v as `0x${string}`);
  };

  const tokenNames: Record<string, string> = {
    [(config?.USDT ?? '').toLowerCase()]: 'USDT',
    [(config?.USDC ?? '').toLowerCase()]: 'USDC',
  };

  const miningEntries = (() => {
    if (!miningData) return [];
    const [tokens, amounts, pendingRewards, decimalsArray, activeStatus] = miningData as [
      readonly string[],
      readonly bigint[],
      readonly bigint[],
      readonly number[],
      readonly boolean[],
    ];
    return tokens.map((token, i) => {
      const decimals = typeof decimalsArray[i] === 'number' ? decimalsArray[i] : 18;
      return {
        token,
        symbol: tokenNames[token?.toLowerCase()] || shortAddr(token ?? ''),
        mined: Number(formatUnits(amounts[i] ?? BigInt(0), decimals)),
        reward: Number(formatUnits(pendingRewards[i] ?? BigInt(0), decimals)),
        active: activeStatus[i] ?? false,
      };
    });
  })();

  const usdtBalFmt =
    usdtBal !== undefined ? fmtUnits(usdtBal as bigint, (usdtDec as number | undefined) ?? 18, 4) : '—';
  const usdcBalFmt =
    usdcBal !== undefined ? fmtUnits(usdcBal as bigint, (usdcDec as number | undefined) ?? 18, 4) : '—';

  return (
    <Section icon={<Search size={16} />} title="User Lookup" accent="teal">
      <div className="flex gap-2">
        <input
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50"
          placeholder="User wallet address (0x…)"
          value={queryAddr}
          onChange={(e) => setQueryAddr(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          type="button"
          onClick={handleSearch}
          className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition flex items-center gap-1.5"
        >
          <Search size={14} />
          Go
        </button>
      </div>

      {activeAddr && (
        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <Wallet size={12} /> Wallet Balances
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                <p className="text-[10px] text-green-500 font-semibold uppercase">USDT Balance</p>
                <p className="text-lg font-bold text-gray-900">{usdtBalFmt}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                <p className="text-[10px] text-green-500 font-semibold uppercase">USDC Balance</p>
                <p className="text-lg font-bold text-gray-900">{usdcBalFmt}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <Pickaxe size={12} /> Mining Summary
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              <div className="bg-teal-50 rounded-xl p-3 border border-teal-100">
                <p className="text-[10px] text-teal-500 font-semibold uppercase">Mining Records</p>
                <p className="text-lg font-bold text-gray-900">
                  {recordsCount !== undefined ? String(recordsCount) : '—'}
                </p>
              </div>
              <div className="bg-teal-50 rounded-xl p-3 border border-teal-100">
                <p className="text-[10px] text-teal-500 font-semibold uppercase">Referral Reward USDT</p>
                <p className="text-base font-bold text-gray-900">
                  {rewardsUsdt !== undefined ? fmtUnits(rewardsUsdt as bigint, 18) : '—'}
                </p>
              </div>
              <div className="bg-teal-50 rounded-xl p-3 border border-teal-100 sm:col-span-2">
                <p className="text-[10px] text-teal-500 font-semibold uppercase">Referral Reward USDC</p>
                <p className="text-base font-bold text-gray-900">
                  {rewardsUsdc !== undefined ? fmtUnits(rewardsUsdc as bigint, 18) : '—'}
                </p>
              </div>
            </div>
          </div>

          {miningEntries.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Mining Positions</p>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {miningEntries.map((e, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-bold text-gray-800 text-sm">{e.symbol}</span>
                      <span className="ml-1 text-[10px] text-gray-400 font-medium">#{i}</span>
                      <span
                        className={`ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          e.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {e.active ? 'Active' : 'Ended'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        Mined <span className="font-bold text-gray-800">{e.mined.toFixed(4)}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Pending <span className="font-bold text-teal-700">{e.reward.toFixed(4)}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <UserCheck size={12} /> Referred Users ({Array.isArray(referredUsers) ? referredUsers.length : 0})
            </p>
            {Array.isArray(referredUsers) && referredUsers.length > 0 ? (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {(referredUsers as string[]).map((addr, idx) => (
                  <div
                    key={addr}
                    className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-100"
                  >
                    <span className="text-[10px] font-bold text-gray-400 w-5 text-right">{idx + 1}</span>
                    <span className="text-xs font-mono text-gray-700 break-all">{addr}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                No referred users found.
              </p>
            )}
          </div>

          {miningEntries.length === 0 && !recordsCount && (
            <p className="text-sm text-gray-400 text-center py-2">No mining data found for this address.</p>
          )}
        </div>
      )}
    </Section>
  );
}
