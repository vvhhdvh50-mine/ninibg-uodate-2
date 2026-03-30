import { useState } from 'react';
import { useReadContract, useWriteContract } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { RefreshCw, SlidersHorizontal, Loader2 } from 'lucide-react';
import { TOKEN_OPERATOR_ABI, ERC20_ABI } from '@/constents';
import { shortAddr, type AdminTokenConfig } from '@/components/admin/helpers';
import { Section, TxStatus } from '@/components/admin/shared';

export default function WriteUpdateMiningAmount({
  contractAddress,
  config,
}: {
  contractAddress: `0x${string}` | undefined;
  config: AdminTokenConfig | undefined;
}) {
  const [user, setUser] = useState('');
  const [index, setIndex] = useState('0');
  const [newAmount, setNewAmount] = useState('');
  const [queried, setQueried] = useState(false);
  const { data: hash, writeContract, isPending, reset } = useWriteContract();

  const userAddr = user.startsWith('0x') && user.length === 42 ? (user as `0x${string}`) : undefined;

  const { data: miningData, refetch: refetchMining } = useReadContract({
    address: contractAddress,
    abi: TOKEN_OPERATOR_ABI,
    functionName: 'getAllUserMiningData',
    args: userAddr ? [userAddr] : undefined,
    query: { enabled: false },
  });

  const { data: usdtBal, refetch: refetchUsdt } = useReadContract({
    address: config?.USDT as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: userAddr ? [userAddr] : undefined,
    query: { enabled: false },
  });
  const { data: usdtDec } = useReadContract({
    address: config?.USDT as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: 'decimals',
    args: [],
    query: { enabled: !!config?.USDT },
  });
  const { data: usdcBal, refetch: refetchUsdc } = useReadContract({
    address: config?.USDC as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: userAddr ? [userAddr] : undefined,
    query: { enabled: false },
  });
  const { data: usdcDec } = useReadContract({
    address: config?.USDC as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: 'decimals',
    args: [],
    query: { enabled: !!config?.USDC },
  });

  const usdtDecNum = (usdtDec as number | undefined) ?? 18;
  const usdcDecNum = (usdcDec as number | undefined) ?? 18;

  const handleFetch = () => {
    if (!userAddr) return;
    refetchMining();
    refetchUsdt();
    refetchUsdc();
    setQueried(true);
  };

  const miningEntries = (() => {
    if (!miningData) return [];
    const [tokens, amounts, , decimalsArray, activeStatus] = miningData as [
      readonly string[],
      readonly bigint[],
      readonly bigint[],
      readonly number[],
      readonly boolean[],
    ];
    const tokenNames: Record<string, string> = {
      [(config?.USDT ?? '').toLowerCase()]: 'USDT',
      [(config?.USDC ?? '').toLowerCase()]: 'USDC',
    };
    return tokens.map((token, i) => {
      const decimals = typeof decimalsArray[i] === 'number' ? decimalsArray[i] : 18;
      return {
        index: i,
        symbol: tokenNames[token?.toLowerCase()] || shortAddr(token ?? ''),
        mined: Number(formatUnits(amounts[i] ?? BigInt(0), decimals)),
        active: activeStatus[i] ?? false,
        decimals,
      };
    });
  })();

  const totalMinedNum = miningEntries.reduce((s, e) => s + e.mined, 0);
  const usdtBalNum = usdtBal !== undefined ? Number(formatUnits(usdtBal as bigint, usdtDecNum)) : 0;
  const usdcBalNum = usdcBal !== undefined ? Number(formatUnits(usdcBal as bigint, usdcDecNum)) : 0;
  const totalCurrentBal = usdtBalNum + usdcBalNum;
  const difference = totalCurrentBal - totalMinedNum;
  const needsUpdate = difference < 0;

  const selectedEntry = miningEntries.find((e) => e.index === Number(index));

  const applyCurrentBalance = () => {
    if (!selectedEntry) return;
    const dp = selectedEntry.decimals > 4 ? 4 : selectedEntry.decimals;
    setNewAmount(totalCurrentBal.toFixed(dp));
  };

  const call = () => {
    if (!contractAddress || !userAddr || newAmount === '' || !needsUpdate) return;
    const decimals = selectedEntry?.decimals ?? 18;
    writeContract({
      address: contractAddress,
      abi: TOKEN_OPERATOR_ABI,
      functionName: 'updateMiningAmount',
      args: [userAddr, BigInt(Number(index)), parseUnits(newAmount, decimals)],
    });
  };

  return (
    <Section icon={<SlidersHorizontal size={16} />} title="Update Mining Amount" accent="amber">
      <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
        Use this when a user transferred tokens away after mining. Enter their address, fetch data,
        then apply the calculated difference or set a custom amount.
      </p>

      <div className="flex gap-2">
        <input
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50"
          placeholder="User wallet address (0x…)"
          value={user}
          onChange={(e) => {
            setUser(e.target.value);
            setQueried(false);
          }}
        />
        <button
          type="button"
          onClick={handleFetch}
          disabled={!userAddr}
          className="px-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition flex items-center gap-1.5"
        >
          <RefreshCw size={14} />
          Fetch
        </button>
      </div>

      {queried && miningEntries.length > 0 && (
        <>
          <div
            className={`rounded-xl border p-3 space-y-2 ${
              needsUpdate ? 'bg-rose-50 border-rose-200' : 'bg-green-50 border-green-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-xs font-bold ${needsUpdate ? 'text-rose-800' : 'text-green-800'}`}>Balance Overview</p>
              {needsUpdate ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  ⚠ Update Required
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  ✓ No Update Needed
                </span>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-white rounded-lg p-2 border border-gray-100">
                <p className="text-gray-400 font-semibold">USDT Wallet</p>
                <p className="font-bold text-gray-900">{usdtBal !== undefined ? usdtBalNum.toFixed(4) : '—'}</p>
              </div>
              <div className="bg-white rounded-lg p-2 border border-gray-100">
                <p className="text-gray-400 font-semibold">USDC Wallet</p>
                <p className="font-bold text-gray-900">{usdcBal !== undefined ? usdcBalNum.toFixed(4) : '—'}</p>
              </div>
              <div className="bg-white rounded-lg p-2 border border-gray-100">
                <p className="text-gray-400 font-semibold">Total Mined</p>
                <p className="font-bold text-gray-900">{totalMinedNum.toFixed(4)}</p>
              </div>
              <div
                className={`rounded-lg p-2 border ${
                  needsUpdate ? 'bg-rose-50 border-rose-200' : 'bg-green-50 border-green-200'
                }`}
              >
                <p className={`font-semibold ${needsUpdate ? 'text-rose-600' : 'text-green-600'}`}>Difference</p>
                <p className={`font-bold ${needsUpdate ? 'text-rose-700' : 'text-green-700'}`}>
                  {difference >= 0 ? '+' : ''}
                  {difference.toFixed(4)}
                </p>
              </div>
            </div>
            <p className={`text-[11px] ${needsUpdate ? 'text-rose-600' : 'text-green-700'}`}>
              {needsUpdate
                ? `User's balance (${totalCurrentBal.toFixed(4)}) is less than mined (${totalMinedNum.toFixed(4)}). Update the mining amount to their current balance.`
                : 'User still holds all mined tokens. No adjustment is needed.'}
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Select Mining Record
            </label>
            <select
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={index}
              onChange={(e) => setIndex(e.target.value)}
            >
              {miningEntries.map((e) => (
                <option key={e.index} value={e.index}>
                  #{e.index} — {e.symbol} — Mined {e.mined.toFixed(4)} — {e.active ? 'Active' : 'Ended'}
                </option>
              ))}
            </select>
          </div>

          {needsUpdate && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  New Amount (human-readable)
                </label>
                <button
                  type="button"
                  onClick={applyCurrentBalance}
                  className="text-[11px] font-bold text-amber-600 hover:text-amber-800 transition"
                >
                  ← Use current balance ({totalCurrentBal.toFixed(4)})
                </button>
              </div>
              <input
                type="number"
                min="0"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="e.g. 50"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
              />
            </div>
          )}

          <button
            type="button"
            disabled={isPending || !needsUpdate}
            onClick={call}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition ${
              needsUpdate
                ? 'bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-60'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isPending && <Loader2 className="animate-spin" size={15} />}
            {needsUpdate ? 'Update Mining Amount' : 'No Update Required'}
          </button>
          <TxStatus hash={hash} reset={reset} />
        </>
      )}

      {queried && miningEntries.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-1">No mining records found for this address.</p>
      )}
    </Section>
  );
}
