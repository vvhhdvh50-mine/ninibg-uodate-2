import { useState } from 'react';
import { useWriteContract } from 'wagmi';
import { AlertTriangle } from 'lucide-react';
import { TOKEN_OPERATOR_ABI } from '@/constents';
import { Section, TxStatus, ActionBtn } from '@/components/admin/shared';

export default function WriteRenounceOwnership({
  contractAddress,
}: {
  contractAddress: `0x${string}` | undefined;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const { data: hash, writeContract, isPending, reset } = useWriteContract();

  const call = () => {
    if (!contractAddress || !confirmed) return;
    writeContract({
      address: contractAddress,
      abi: TOKEN_OPERATOR_ABI,
      functionName: 'renounceOwnership',
      args: [],
    });
  };

  return (
    <Section icon={<AlertTriangle size={16} />} title="Renounce Ownership" accent="rose" defaultOpen={false}>
      <div className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-3 space-y-2">
        <p className="text-sm font-bold text-rose-700 flex items-center gap-1.5">
          <AlertTriangle size={14} /> IRREVERSIBLE ACTION
        </p>
        <p className="text-xs text-rose-600">
          This permanently removes ownership of the contract. No address will be able to call
          owner-only functions afterwards. This cannot be undone.
        </p>
        <label className="flex items-center gap-2 text-xs font-semibold text-rose-700 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-3.5 h-3.5 accent-rose-600"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          I understand this is irreversible
        </label>
      </div>
      <ActionBtn onClick={call} loading={isPending} danger>
        Renounce Ownership
      </ActionBtn>
      <TxStatus hash={hash} reset={reset} />
    </Section>
  );
}
