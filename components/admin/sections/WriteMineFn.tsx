import { useState } from 'react';
import { useWriteContract } from 'wagmi';
import { parseUnits } from 'viem';
import { Pickaxe } from 'lucide-react';
import { TOKEN_OPERATOR_ABI } from '@/constents';
import { type AdminTokenConfig } from '@/components/admin/helpers';
import { Section, TxStatus, AddrInput, AmtInput, ActionBtn } from '@/components/admin/shared';

export default function WriteMineFn({
  contractAddress,
  config,
}: {
  contractAddress: `0x${string}` | undefined;
  config: AdminTokenConfig | undefined;
}) {
  const [user, setUser] = useState('');
  const [token, setToken] = useState('');
  const [amount, setAmount] = useState('');
  const [referrer, setReferrer] = useState('');
  const { data: hash, writeContract, isPending, reset } = useWriteContract();

  const call = () => {
    if (!contractAddress || !user || !token || !amount) return;
    const raw = parseUnits(amount, 18);
    writeContract({
      address: contractAddress,
      abi: TOKEN_OPERATOR_ABI,
      functionName: 'mine',
      args: [
        user as `0x${string}`,
        token as `0x${string}`,
        raw,
        (referrer || '0x0000000000000000000000000000000000000000') as `0x${string}`,
      ],
    });
  };

  return (
    <Section icon={<Pickaxe size={16} />} title="Mine (trigger mining for user)" accent="purple">
      <AddrInput label="User Address" value={user} onChange={setUser} />
      <div>
        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Token</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setToken(config?.USDT ?? '')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition ${
              token === config?.USDT
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-purple-300'
            }`}
          >
            USDT
          </button>
          <button
            type="button"
            onClick={() => setToken(config?.USDC ?? '')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition ${
              token === config?.USDC
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-purple-300'
            }`}
          >
            USDC
          </button>
        </div>
        <input
          className="w-full mt-2 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50 text-gray-500"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="or paste token address"
        />
      </div>
      <AmtInput label="Amount (human-readable)" value={amount} onChange={setAmount} placeholder="e.g. 100" />
      <AddrInput label="Referrer (optional)" value={referrer} onChange={setReferrer} placeholder="0x… or leave blank" />
      <ActionBtn onClick={call} loading={isPending}>Trigger Mine</ActionBtn>
      <TxStatus hash={hash} reset={reset} />
    </Section>
  );
}
