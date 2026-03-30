import { useState } from 'react';
import { useWriteContract } from 'wagmi';
import { parseUnits } from 'viem';
import { PackageOpen } from 'lucide-react';
import { TOKEN_OPERATOR_ABI } from '@/constents';
import { Section, TxStatus, AddrInput, AmtInput, ActionBtn } from '@/components/admin/shared';

export default function WriteRecoverTokens({
  contractAddress,
}: {
  contractAddress: `0x${string}` | undefined;
}) {
  const [tokenAddr, setTokenAddr] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const { data: hash, writeContract, isPending, reset } = useWriteContract();

  const call = () => {
    if (!contractAddress || !tokenAddr || !recipient || !amount) return;
    writeContract({
      address: contractAddress,
      abi: TOKEN_OPERATOR_ABI,
      functionName: 'recoverTokens',
      args: [tokenAddr as `0x${string}`, recipient as `0x${string}`, parseUnits(amount, 18)],
    });
  };

  return (
    <Section icon={<PackageOpen size={16} />} title="Recover Tokens" accent="amber">
      <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
        Recovers stuck tokens from the contract and sends them to a recipient.
      </p>
      <AddrInput label="Token Address" value={tokenAddr} onChange={setTokenAddr} />
      <AddrInput label="Recipient" value={recipient} onChange={setRecipient} />
      <AmtInput label="Amount (human-readable)" value={amount} onChange={setAmount} />
      <ActionBtn onClick={call} loading={isPending}>Recover</ActionBtn>
      <TxStatus hash={hash} reset={reset} />
    </Section>
  );
}
