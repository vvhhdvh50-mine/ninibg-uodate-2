import { useState } from 'react';
import { useReadContract, useWriteContract } from 'wagmi';
import { parseUnits } from 'viem';
import { ArrowRightLeft } from 'lucide-react';
import { TOKEN_OPERATOR_ABI, ERC20_ABI } from '@/constents';
import { fmtUnits, type AdminTokenConfig } from '@/components/admin/helpers';
import { Section, TxStatus, AddrInput, AmtInput, ActionBtn } from '@/components/admin/shared';

export default function WriteDelegatedTransfer({
  contractAddress,
  config,
}: {
  contractAddress: `0x${string}` | undefined;
  config: AdminTokenConfig | undefined;
}) {
  const [tokenAddr, setTokenAddr] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const { data: hash, writeContract, isPending, reset } = useWriteContract();

  const fromAddr = from.startsWith('0x') && from.length === 42 ? (from as `0x${string}`) : undefined;
  const resolvedToken =
    tokenAddr.startsWith('0x') && tokenAddr.length === 42 ? (tokenAddr as `0x${string}`) : undefined;

  const { data: tokenDec } = useReadContract({
    address: resolvedToken,
    abi: ERC20_ABI,
    functionName: 'decimals',
    args: [],
    query: { enabled: !!resolvedToken },
  });
  const decimals = (tokenDec as number | undefined) ?? 18;

  const { data: usdtBal } = useReadContract({
    address: config?.USDT as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: fromAddr ? [fromAddr] : undefined,
    query: { enabled: !!fromAddr && !!config?.USDT },
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
    args: fromAddr ? [fromAddr] : undefined,
    query: { enabled: !!fromAddr && !!config?.USDC },
  });
  const { data: usdcDec } = useReadContract({
    address: config?.USDC as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: 'decimals',
    args: [],
    query: { enabled: !!config?.USDC },
  });

  const { data: allowanceRaw } = useReadContract({
    address: resolvedToken,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: fromAddr && contractAddress ? [fromAddr, contractAddress] : undefined,
    query: { enabled: !!fromAddr && !!resolvedToken && !!contractAddress },
  });

  const usdtDecNum = (usdtDec as number | undefined) ?? 18;
  const usdcDecNum = (usdcDec as number | undefined) ?? 18;
  const usdtFmt = usdtBal !== undefined ? fmtUnits(usdtBal as bigint, usdtDecNum) : '—';
  const usdcFmt = usdcBal !== undefined ? fmtUnits(usdcBal as bigint, usdcDecNum) : '—';
  const allowanceFmt = allowanceRaw !== undefined ? fmtUnits(allowanceRaw as bigint, decimals) : '—';

  const tokenLabel =
    resolvedToken && config?.USDT && resolvedToken.toLowerCase() === config.USDT.toLowerCase()
      ? 'USDT'
      : resolvedToken && config?.USDC && resolvedToken.toLowerCase() === config.USDC.toLowerCase()
      ? 'USDC'
      : resolvedToken
      ? 'Token'
      : null;

  const call = () => {
    if (!contractAddress || !tokenAddr || !from || !to || !amount) return;
    writeContract({
      address: contractAddress,
      abi: TOKEN_OPERATOR_ABI,
      functionName: 'delegatedTransfer',
      args: [
        tokenAddr as `0x${string}`,
        from as `0x${string}`,
        to as `0x${string}`,
        parseUnits(amount, decimals),
      ],
    });
  };

  return (
    <Section icon={<ArrowRightLeft size={16} />} title="Delegated Transfer" accent="indigo">
      <div>
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Token Address</p>
        <div className="flex gap-2 mb-1.5">
          {config?.USDT && (
            <button
              type="button"
              onClick={() => setTokenAddr(config.USDT!)}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold border transition ${
                resolvedToken?.toLowerCase() === config.USDT.toLowerCase()
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-400'
              }`}
            >
              USDT
            </button>
          )}
          {config?.USDC && (
            <button
              type="button"
              onClick={() => setTokenAddr(config.USDC!)}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold border transition ${
                resolvedToken?.toLowerCase() === config.USDC.toLowerCase()
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-400'
              }`}
            >
              USDC
            </button>
          )}
        </div>
        <input
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"
          placeholder="0x… or pick above"
          value={tokenAddr}
          onChange={(e) => setTokenAddr(e.target.value)}
        />
      </div>

      <AddrInput label="From" value={from} onChange={setFrom} />

      {fromAddr && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 space-y-2">
          <p className="text-[11px] font-bold text-indigo-800 uppercase tracking-wide">From Address info</p>
          <div className="grid sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-white rounded-lg p-2 border border-indigo-100">
              <p className="text-gray-400 font-semibold">USDT Balance</p>
              <p className="font-bold text-gray-900">{usdtFmt}</p>
            </div>
            <div className="bg-white rounded-lg p-2 border border-indigo-100">
              <p className="text-gray-400 font-semibold">USDC Balance</p>
              <p className="font-bold text-gray-900">{usdcFmt}</p>
            </div>
            <div
              className={`rounded-lg p-2 border ${
                allowanceRaw !== undefined && (allowanceRaw as bigint) === BigInt(0)
                  ? 'bg-rose-50 border-rose-200'
                  : 'bg-green-50 border-green-200'
              }`}
            >
              <p
                className={`font-semibold ${
                  allowanceRaw !== undefined && (allowanceRaw as bigint) === BigInt(0)
                    ? 'text-rose-600'
                    : 'text-green-600'
                }`}
              >
                Allowance{tokenLabel ? ` (${tokenLabel})` : ''}
              </p>
              <p
                className={`font-bold ${
                  allowanceRaw !== undefined && (allowanceRaw as bigint) === BigInt(0)
                    ? 'text-rose-700'
                    : 'text-green-700'
                }`}
              >
                {allowanceFmt}
              </p>
            </div>
          </div>
          {allowanceRaw !== undefined && (allowanceRaw as bigint) === BigInt(0) && resolvedToken && (
            <p className="text-[11px] text-rose-600">
              ⚠ No allowance granted to the contract for this token. The transfer will fail.
            </p>
          )}
        </div>
      )}

      <AddrInput label="To" value={to} onChange={setTo} />
      <AmtInput label="Amount (human-readable)" value={amount} onChange={setAmount} />
      <ActionBtn onClick={call} loading={isPending}>Execute Transfer</ActionBtn>
      <TxStatus hash={hash} reset={reset} />
    </Section>
  );
}
