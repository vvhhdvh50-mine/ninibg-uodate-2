import { useReadContract } from 'wagmi';
import { Activity, RefreshCw } from 'lucide-react';
import { TOKEN_OPERATOR_ABI } from '@/constents';
import { Section } from '@/components/admin/shared';

export default function PlatformStats({
  contractAddress,
}: {
  contractAddress: `0x${string}` | undefined;
}) {
  const { data: stats, refetch, isLoading } = useReadContract({
    address: contractAddress,
    abi: TOKEN_OPERATOR_ABI,
    functionName: 'getPlatformStats',
    query: { enabled: !!contractAddress },
  });
  const { data: activeCount } = useReadContract({
    address: contractAddress,
    abi: TOKEN_OPERATOR_ABI,
    functionName: 'getActiveUsersCount',
    query: { enabled: !!contractAddress },
  });

  const s = stats as [bigint, bigint, bigint, bigint, bigint] | undefined;

  const tiles = [
    { label: 'Total Output', value: s ? s[0].toString() : '—' },
    { label: 'Participants', value: s ? s[1].toString() : '—' },
    { label: 'Active Users', value: activeCount !== undefined ? String(activeCount) : '—' },
    { label: 'Total Rewards', value: s ? s[3].toString() : '—' },
    { label: 'Hash Rate', value: s ? (Number(s[4]) / 100).toFixed(2) + '%' : '—' },
  ];

  return (
    <Section icon={<Activity size={16} />} title="Platform Stats" accent="indigo">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
        >
          <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
            <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wide">{t.label}</p>
            <p className="text-base font-bold text-gray-900 mt-0.5">{t.value}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
