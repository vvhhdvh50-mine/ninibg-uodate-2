'use client';

import { useState } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useReadContract, useReadContracts } from 'wagmi';
import { formatUnits, type Abi } from 'viem';
import { ShieldAlert, XCircle } from 'lucide-react';
import addressConfig, { ERC20_ABI, TOKEN_OPERATOR_ABI } from '@/constents';
import AdminHeader from '@/components/admin/AdminHeader';
import { shortAddr } from '@/components/admin/helpers';

const PAGE_SIZE = 20;

type MultiCallItem = {
  status: 'success' | 'failure';
  result?: unknown;
  error?: Error;
};

function getResult<T>(item: unknown): T | undefined {
  if (!item || typeof item !== 'object') return undefined;
  const entry = item as MultiCallItem;
  return entry.status === 'success' ? (entry.result as T) : undefined;
}

export default function AdminUsersPage() {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const [page, setPage] = useState(1);

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

  const { data: usdtDec } = useReadContract({
    address: config?.USDT as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: 'decimals',
    args: [],
    query: { enabled: !!config?.USDT },
  });
  const { data: usdcDec } = useReadContract({
    address: config?.USDC as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: 'decimals',
    args: [],
    query: { enabled: !!config?.USDC },
  });

  const { data: totalParticipantsData, isLoading: isLoadingUsers } = useReadContract({
    address: contractAddress,
    abi: TOKEN_OPERATOR_ABI,
    functionName: 'getTotalParticipants',
    query: { enabled: !!contractAddress },
  });

  const totalUsers = Number((totalParticipantsData as bigint | undefined) ?? BigInt(0));
  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalUsers);
  const pageIndexes = Array.from({ length: Math.max(0, endIndex - startIndex) }, (_, i) =>
    BigInt(startIndex + i)
  );

  const { data: pageUsersData, isLoading: isLoadingPageUsers } = useReadContracts({
    contracts:
      contractAddress && pageIndexes.length > 0
        ? pageIndexes.map((index) => ({
            address: contractAddress,
            abi: TOKEN_OPERATOR_ABI as Abi,
            functionName: 'allUsers',
            args: [index],
          }))
        : [],
    query: { enabled: !!contractAddress && pageIndexes.length > 0 },
  });

  const pageUsers = ((pageUsersData ?? [])
    .map((item) => getResult<`0x${string}`>(item))
    .filter(Boolean) as `0x${string}`[]);

  const pageContracts =
    contractAddress && config?.USDT && config?.USDC
      ? pageUsers.flatMap((user) => [
          {
            address: contractAddress,
            abi: TOKEN_OPERATOR_ABI as Abi,
            functionName: 'getAllUserMiningData',
            args: [user],
          },
          {
            address: config.USDT as `0x${string}`,
            abi: ERC20_ABI as Abi,
            functionName: 'balanceOf',
            args: [user],
          },
          {
            address: config.USDC as `0x${string}`,
            abi: ERC20_ABI as Abi,
            functionName: 'balanceOf',
            args: [user],
          },
        ])
      : [];

  const { data: rowsData, isLoading: isLoadingRows } = useReadContracts({
    contracts: pageContracts,
    query: { enabled: !!contractAddress && !!config?.USDT && !!config?.USDC && pageUsers.length > 0 },
  });

  const usdtDecimals = (usdtDec as number | undefined) ?? 18;
  const usdcDecimals = (usdcDec as number | undefined) ?? 18;

  const rows = pageUsers.map((user, index) => {
    const base = index * 3;
    const miningData = getResult<[
      readonly string[],
      readonly bigint[],
      readonly bigint[],
      readonly number[],
      readonly boolean[],
    ]>(rowsData?.[base]);
    const usdtBal = getResult<bigint>(rowsData?.[base + 1]) ?? BigInt(0);
    const usdcBal = getResult<bigint>(rowsData?.[base + 2]) ?? BigInt(0);

    const totalMined = miningData
      ? miningData[1].reduce((sum, amount, itemIndex) => {
          const decimals = typeof miningData[3][itemIndex] === 'number' ? miningData[3][itemIndex] : 18;
          return sum + Number(formatUnits(amount ?? BigInt(0), decimals));
        }, 0)
      : 0;

    const usdt = Number(formatUnits(usdtBal, usdtDecimals));
    const usdc = Number(formatUnits(usdcBal, usdcDecimals));
    const current = usdt + usdc;
    const difference = current - totalMined;

    return {
      address: user,
      usdt,
      usdc,
      totalMined,
      difference,
      needsUpdate: difference < 0,
    };
  });

  if (!isConnected) {
    return (
      <>
        <AdminHeader />
        <div className="px-4 py-8 xl:px-8">
          <div className="mx-auto max-w-5xl bg-linear-to-br from-gray-700 to-gray-900 rounded-2xl p-10 shadow-lg text-center text-white">
            <ShieldAlert className="w-14 h-14 mx-auto mb-3 opacity-80" />
            <h2 className="text-3xl font-bold mb-2">Admin Users</h2>
            <p className="opacity-70 text-sm">Connect your wallet to access the admin users page.</p>
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
          <p className="text-sm text-gray-600 mt-1">Admin users page is available only on desktop or large-screen devices.</p>
        </div>
      </div>

      <div className="hidden md:block px-6 py-8 xl:px-10 xl:py-10">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">Admin Directory</p>
              <h1 className="text-3xl font-bold text-gray-900 mt-1">All Users Balances</h1>
              <p className="text-sm text-gray-500 mt-1">
                On-chain pagination: load only users for this page via index range.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-gray-400">Current range</p>
              <p className="text-sm font-semibold text-gray-700">
                {totalUsers === 0 ? '0-0' : `${startIndex + 1}-${endIndex}`} of {totalUsers}
              </p>
            </div>
          </div>

          {/* <div className="grid xl:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{filteredUsers.length}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">On This Page</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{rows.length}</p>
            </div>
            <div className="bg-rose-50 rounded-2xl border border-rose-100 shadow-sm p-4">
              <p className="text-[11px] uppercase tracking-wide font-semibold text-rose-400">Need Update</p>
              <p className="text-2xl font-bold text-rose-700 mt-1">{pageNeedsUpdate}</p>
            </div>
            <div className="bg-amber-50 rounded-2xl border border-amber-100 shadow-sm p-4">
              <p className="text-[11px] uppercase tracking-wide font-semibold text-amber-500">Page Shortfall</p>
              <p className="text-2xl font-bold text-amber-700 mt-1">{pageShortfall.toFixed(4)}</p>
            </div>
          </div> */}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-gray-900">User Balances Table</p>
                <p className="text-xs text-gray-500 mt-0.5">Difference = (USDT + USDC) − total mined</p>
              </div>
              <div className="text-xs text-gray-400">Page {safePage} of {totalPages}</div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wide">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold">Wallet</th>
                    <th className="text-right px-5 py-3 font-semibold">USDT</th>
                    <th className="text-right px-5 py-3 font-semibold">USDC</th>
                    <th className="text-right px-5 py-3 font-semibold">Total Mined</th>
                    <th className="text-right px-5 py-3 font-semibold">Difference</th>
                    <th className="text-center px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(isLoadingUsers || isLoadingPageUsers || isLoadingRows) && rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                        Loading users data...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                        No users found on this page.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.address} className="border-t border-gray-100 hover:bg-gray-50/70">
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-mono text-gray-800">{shortAddr(row.address)}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{row.address}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-gray-800">{row.usdt.toFixed(4)}</td>
                        <td className="px-5 py-4 text-right font-semibold text-gray-800">{row.usdc.toFixed(4)}</td>
                        <td className="px-5 py-4 text-right font-semibold text-gray-800">{row.totalMined.toFixed(4)}</td>
                        <td className={`px-5 py-4 text-right font-bold ${row.needsUpdate ? 'text-rose-700' : 'text-green-700'}`}>
                          {row.difference >= 0 ? '+' : ''}{row.difference.toFixed(4)}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${row.needsUpdate ? 'bg-rose-100 text-rose-700' : 'bg-green-100 text-green-700'}`}>
                            {row.needsUpdate ? 'Update required' : 'Healthy'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Showing {(safePage - 1) * PAGE_SIZE + (rows.length ? 1 : 0)}-
                {(safePage - 1) * PAGE_SIZE + rows.length} of {totalUsers}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={safePage === totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
