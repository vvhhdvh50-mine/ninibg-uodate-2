/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Gift, Info, Users, User, X, Headphones, MessageCircle, Send } from 'lucide-react';
import NetworkModal from './NetworkModal';
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { HiMiniDocumentText } from "react-icons/hi2";
import { networks } from '@/config';
import { FaWhatsapp } from 'react-icons/fa6';
import { PiTelegramLogoDuotone } from 'react-icons/pi';

export default function Header({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const [activeTab, setActiveTab] = useState('home');
  const { open } = useAppKit();
  const account = useAppKitAccount();
  const { chainId, switchNetwork } = useAppKitNetwork();
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);

  // Draggable FAB
  const [fabPos, setFabPos] = useState({ x: 0, y: 0 });
  const [fabMounted, setFabMounted] = useState(false);
  const isDragging = useRef(false);
  const hasMoved = useRef(false);
  const pointerStartClient = useRef({ x: 0, y: 0 });
  const fabStartPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setShowInfoModal(!account.isConnected);
  }, [account.isConnected]);

  useEffect(() => {
    setFabPos({ x: window.innerWidth - 72, y: window.innerHeight * 0.6 });
    setFabMounted(true);
  }, []);

  const handleFabPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    isDragging.current = true;
    hasMoved.current = false;
    pointerStartClient.current = { x: e.clientX, y: e.clientY };
    fabStartPos.current = { ...fabPos };
    (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const handleFabPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging.current) return;
    const dx = e.clientX - pointerStartClient.current.x;
    const dy = e.clientY - pointerStartClient.current.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved.current = true;
    setFabPos({
      x: Math.max(0, Math.min(fabStartPos.current.x + dx, window.innerWidth - 56)),
      y: Math.max(0, Math.min(fabStartPos.current.y + dy, window.innerHeight - 56)),
    });
  };

  const handleFabPointerUp = () => {
    if (!hasMoved.current) setShowServiceModal(true);
    isDragging.current = false;
  };

  const currentNetwork = networks.find((n) => Number(n.id) === Number(chainId));
  const networkIconSrc = currentNetwork ? (currentNetwork as any).logo : null;

  const trimmedAddress = (address: string) => {
    return address.slice(0, 6) + '...' + address.slice(-4);
  }

  if (isAdminRoute) {
    return <div className="min-h-screen bg-gray-100">{children}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Top Header - Sticky */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-3 py-2 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => open()}>
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-base">⛏️</span>
            </div>
            <span className="text-xs font-medium text-gray-700"  >{account.isConnected ? trimmedAddress(account.address as string) : 'Connect Wallet'}</span>
          </div>
          <button className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors" onClick={() => setShowNetworkModal(true)}>
            <span className="flex items-center gap-2">
              <span className="font-semibold">
                {currentNetwork ? `${currentNetwork.name}` : 'Switch Network'}
              </span>
              <span className="text-[10px]">▼</span>
            </span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-16">
        <div className="max-w-md mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation - Fixed */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto flex items-center py-2">
          <Link
            href="/"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
              activeTab === 'home' ? 'text-blue-500' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('home')}
          >
            <Home size={20} />
            <span className="text-[10px] font-medium">Home</span>
          </Link>

          <Link
            href="/reward-center"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
              activeTab === 'reward' ? 'text-blue-500' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('reward')}
          >
            <Gift size={20} />
            <span className="text-[10px] font-medium">Rewards</span>
          </Link>

          <Link
            href="/about"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
              activeTab === 'about' ? 'text-blue-500' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('about')}
          >
            <HiMiniDocumentText size={20} />
            <span className="text-[10px] font-medium">About</span>
          </Link>

          <Link
            href="/team"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
              activeTab === 'team' ? 'text-blue-500' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('team')}
          >
            <Users size={20} />
            <span className="text-[10px] font-medium">Team</span>
          </Link>

          <Link
            href="/me"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
              activeTab === 'me' ? 'text-blue-500' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('me')}
          >
            <User size={20} />
            <span className="text-[10px] font-medium">Me</span>
          </Link>
        </div>
      </nav>
      {/* Draggable Contact Support FAB */}
      {fabMounted && (
        <button
          onPointerDown={handleFabPointerDown}
          onPointerMove={handleFabPointerMove}
          onPointerUp={handleFabPointerUp}
          style={{ left: fabPos.x, top: fabPos.y, touchAction: 'none' }}
          className="fixed z-40 w-14 h-14 rounded-full bg-linear-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/40 flex items-center justify-center select-none cursor-grab active:cursor-grabbing active:scale-95 transition-transform"
          aria-label="Contact Support"
        >
          <Headphones size={22} className="text-white" />
        </button>
      )}

      {showServiceModal && (
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 pb-6 sm:pb-0">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowServiceModal(false)} />
              <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="relative px-5 pt-5 pb-4">
                  <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Contact Support</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Choose your preferred channel</p>
                    </div>
                    <button
                      aria-label="Close"
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                      onClick={() => setShowServiceModal(false)}
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
    
                {/* Channels */}
                <div className="px-5 pb-6 space-y-3">
                  <a
                    href="https://wa.me/14795260730"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-green-50 hover:border-green-200 transition-all duration-200"
                  >
                    <span className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
                      <FaWhatsapp size={22} className="text-white" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900">WhatsApp</div>
                      <div className="text-xs text-gray-500 mt-0.5">Usually replies within minutes</div>
                    </div>
                    <span className="text-gray-300 group-hover:text-green-400 transition-colors">›</span>
                  </a>
    
                  <a
                    href="https://t.me/alpha_miningbot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
                  >
                    <span className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
                      <PiTelegramLogoDuotone size={22} className="text-white" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900">Telegram</div>
                      <div className="text-xs text-gray-500 mt-0.5">Join our official support group</div>
                    </div>
                    <span className="text-gray-300 group-hover:text-sky-400 transition-colors">›</span>
                  </a>
                </div>
              </div>
            </div>
      )}

      {showNetworkModal && (
        <NetworkModal
          onClose={() => setShowNetworkModal(false)}
          switchNetwork={switchNetwork}
          currentChainId={chainId}
        />
      )}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-linear-to-r from-amber-50 to-yellow-50">
              <div className="flex items-center gap-2">
                <span className="text-xl">💰</span>
                <h2 className="text-sm font-bold text-gray-800">Trust Mining Income</h2>
              </div>
              <button
                aria-label="Close"
                className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors"
                onClick={() => setShowInfoModal(false)}
              >
                <X size={15} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 text-sm text-gray-700 overflow-y-auto max-h-[70vh]">
              {/* Mining tiers */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Mining Tiers</p>
                <div className="rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
                  {[
                    { label: 'Mine-1', range: '16 – 99', rate: '1%' },
                    { label: 'Mine-2', range: '100 – 499', rate: '1.5%' },
                    { label: 'Mine-3', range: '500 – 999', rate: '3%' },
                    { label: 'Mine-4', range: '1,000 – 4,999', rate: '5%' },
                    { label: 'Mine-5', range: '5,000 – 9,999', rate: '7%' },
                    { label: 'Mine-6', range: '10,000 – 29,999', rate: '9%' },
                    { label: 'Mine-7', range: '30,000 – 79,999', rate: '11%' },
                    { label: 'Mine-8', range: '80,000 – 159,999', rate: '13%' },
                  ].map((tier) => (
                    <div key={tier.label} className="flex items-center justify-between px-3 py-2 bg-white hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-purple-600 w-14">{tier.label}</span>
                        <span className="text-xs text-gray-500">USDT {tier.range}</span>
                      </div>
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{tier.rate} / day</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supported networks */}
              <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                <span>🌐</span>
                <span>Supports Polygon, ETH & BSC — USDT / USDC</span>
              </div>

              {/* How it works */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">⚙️ How It Works</p>
                <div className="space-y-2">
                  {[
                    { step: '1', title: 'USDT stays in your wallet', desc: 'You control your assets 100%. The platform has no right to operate your funds.' },
                    { step: '2', title: 'Connect your trust wallet', desc: 'Simply authorize to view balances — no transfer or pledge required.' },
                    { step: '3', title: 'Smart contract recognises balance', desc: 'Mining power is generated from your balance, bringing you daily income.' },
                    { step: '4', title: 'Automatic daily settlement', desc: 'Receive income every 24 hours — withdraw any time.' },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                        {item.step}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{item.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer CTA */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setShowInfoModal(false)}
                className="w-full py-2.5 rounded-xl bg-linear-to-r from-purple-500 to-pink-500 text-white text-sm font-bold hover:shadow-md transition-shadow"
              >
                Got it, Let&apos;s Mine!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
