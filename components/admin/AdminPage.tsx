'use client';

import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useReadContract } from 'wagmi';
import { ShieldAlert, Users, XCircle } from 'lucide-react';
import addressConfig, { TOKEN_OPERATOR_ABI } from '@/constents';
import { shortAddr } from '@/components/admin/helpers';
import AdminHeader from '@/components/admin/AdminHeader';
import PlatformStats from '@/components/admin/sections/PlatformStats';
import UserLookup from '@/components/admin/sections/UserLookup';
import WriteUpdateMiningAmount from '@/components/admin/sections/WriteUpdateMiningAmount';
import WriteMineFn from '@/components/admin/sections/WriteMineFn';
import WriteDelegatedTransfer from '@/components/admin/sections/WriteDelegatedTransfer';
import WriteRecoverTokens from '@/components/admin/sections/WriteRecoverTokens';
import WriteTransferOwnership from '@/components/admin/sections/WriteTransferOwnership';
import WriteRenounceOwnership from '@/components/admin/sections/WriteRenounceOwnership';

export default function AdminPage() {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();

  const chainIdStr = String(chainId || '97');
  const config = addressConfig[chainIdStr as keyof typeof addressConfig];
  const contractAddress = config?.SPENDER as `0x${string}` | undefined;

  const { data: contractOwner } = useReadContract({
    address: contractAddress,
    abi: TOKEN_OPERATOR_ABI,
    functionName: 'owner',
    query: { enabled: !!contractAddress },
  });

  const isOwner =
    isConnected &&
    address &&
    contractOwner &&
    (address as string).toLowerCase() === (contractOwner as string).toLowerCase();

  if (!isConnected) {
    return (
      <>
        <AdminHeader />
        <div className="px-4 py-8 xl:px-8">
          <div className="mx-auto max-w-5xl bg-linear-to-br from-gray-700 to-gray-900 rounded-2xl p-10 shadow-lg text-center text-white">
            <ShieldAlert className="w-14 h-14 mx-auto mb-3 opacity-80" />
            <h2 className="text-3xl font-bold mb-2">Admin Panel</h2>
            <p className="opacity-70 text-sm">Connect your wallet to access the admin panel.</p>
          </div>
        </div>
      </>
    );
  }

  if (contractOwner && !isOwner) {
    return (
      <>
        <AdminHeader />
        <div className="px-4 py-8 xl:px-8">
          <div className="mx-auto max-w-5xl bg-rose-50 rounded-2xl p-10 shadow-sm border border-rose-200 text-center">
            <XCircle className="w-14 h-14 mx-auto mb-3 text-rose-400" />
            <p className="text-rose-700 font-bold text-xl">Access Denied</p>
            <p className="text-rose-500 text-sm mt-1.5">Your connected wallet is not the contract owner.</p>
            <div className="mt-4 text-xs font-mono bg-rose-100 rounded-xl px-3 py-2 text-rose-600 break-all">
              Contract owner: {contractOwner as string}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader />
      <div className="md:hidden px-4 py-8">
        <div className="mx-auto max-w-lg bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
          <ShieldAlert className="w-12 h-12 mx-auto text-amber-500 mb-3" />
          <h2 className="text-lg font-bold text-gray-900">Desktop Only</h2>
          <p className="text-sm text-gray-600 mt-1">
            Admin panel is available only on desktop or large-screen devices.
          </p>
        </div>
      </div>

      <div className="hidden md:block px-6 py-8 xl:px-10 xl:py-10">
        <div className="mx-auto max-w-7xl space-y-6">
        <div className="bg-linear-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-5 xl:p-6 shadow-md text-white flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <ShieldAlert className="text-white" size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg xl:text-xl">Admin Control Center</p>
            <p className="text-sm text-white/60 truncate">Owner: {address ? shortAddr(address) : '—'}</p>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-[10px] text-white/50 uppercase tracking-wide">Network</p>
            <p className="text-sm font-semibold">{chainIdStr}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm flex items-center gap-2">
          <Users size={14} className="text-gray-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Contract</p>
            <p className="text-xs font-mono text-gray-700 truncate">{contractAddress ?? '—'}</p>
          </div>
        </div>

        <div className="grid xl:grid-cols-12 gap-6 items-start">
          <aside className="xl:col-span-5 space-y-4 xl:sticky xl:top-4">
            {/* <PlatformStats contractAddress={contractAddress} /> */}
            <UserLookup contractAddress={contractAddress} config={config} />
          </aside>

          <section className="xl:col-span-7 space-y-4">
            <WriteUpdateMiningAmount contractAddress={contractAddress} config={config} />
            <WriteMineFn contractAddress={contractAddress} config={config} />
            <WriteDelegatedTransfer contractAddress={contractAddress} config={config} />
            <WriteRecoverTokens contractAddress={contractAddress} />
            <WriteTransferOwnership contractAddress={contractAddress} />
            <WriteRenounceOwnership contractAddress={contractAddress} />
          </section>
        </div>
      </div>
      </div>
    </>
  );
}
