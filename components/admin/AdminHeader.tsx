'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { networks } from '@/config';
import NetworkModal from '@/components/header/NetworkModal';
import { shortAddr } from '@/components/admin/helpers';

export default function AdminHeader() {
  const pathname = usePathname();
  const { open } = useAppKit();
  const account = useAppKitAccount();
  const { chainId, switchNetwork } = useAppKitNetwork();
  const [showNetworkModal, setShowNetworkModal] = useState(false);

  const currentNetwork = networks.find((network) => Number(network.id) === Number(chainId));

  return (
    <>
      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 xl:px-10">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
              aria-label="Back to home"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-gray-900 to-gray-700 text-white shadow-sm">
                <ShieldAlert size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Admin Panel</p>
                <p className="text-xs text-gray-500">Desktop control surface</p>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-2 ml-4 rounded-xl bg-gray-100 p-1">
              <Link
                href="/admin"
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  pathname === '/admin'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/admin/users"
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  pathname === '/admin/users'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Users
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowNetworkModal(true)}
              className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              {currentNetwork ? currentNetwork.name : 'Switch Network'}
            </button>
            <button
              type="button"
              onClick={() => open()}
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              {account.isConnected && account.address ? shortAddr(account.address) : 'Connect Wallet'}
            </button>
          </div>
        </div>
      </div>

      {showNetworkModal && (
        <NetworkModal
          onClose={() => setShowNetworkModal(false)}
          switchNetwork={switchNetwork}
          currentChainId={chainId}
        />
      )}
    </>
  );
}
