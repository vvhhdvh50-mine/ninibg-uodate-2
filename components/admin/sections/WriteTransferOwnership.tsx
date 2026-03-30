import { useState } from 'react';
import { useWriteContract } from 'wagmi';
import { KeyRound } from 'lucide-react';
import { TOKEN_OPERATOR_ABI } from '@/constents';
import { Section, TxStatus, AddrInput, ActionBtn } from '@/components/admin/shared';

export default function WriteTransferOwnership({
  contractAddress,
}: {
  contractAddress: `0x${string}` | undefined;
}) {
  const [newOwner, setNewOwner] = useState('');
  const { data: hash, writeContract, isPending, reset } = useWriteContract();

  const call = () => {
    if (!contractAddress || !newOwner) return;
    writeContract({
      address: contractAddress,
      abi: TOKEN_OPERATOR_ABI,
      functionName: 'transferOwnership',
      args: [newOwner as `0x${string}`],
    });
  };

  return (
    <Section icon={<KeyRound size={16} />} title="Transfer Ownership" accent="rose" defaultOpen={false}>
      <p className="text-xs text-rose-700 bg-rose-50 rounded-lg px-3 py-2 border border-rose-100">
        ⚠️ This transfers admin rights to another wallet. Double-check the address.
      </p>
      <AddrInput label="New Owner Address" value={newOwner} onChange={setNewOwner} />
      <ActionBtn onClick={call} loading={isPending} danger>Transfer Ownership</ActionBtn>
      <TxStatus hash={hash} reset={reset} />
    </Section>
  );
}
