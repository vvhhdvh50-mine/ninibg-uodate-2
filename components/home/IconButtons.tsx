'use client';

import { Bell, Headphones, Info, Share2, X } from 'lucide-react';
import { FaWhatsapp } from "react-icons/fa6";
import { PiTelegramLogoDuotone } from "react-icons/pi";
import Link from 'next/link';
import { useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';

export default function IconButtons() {
  const [copied, setCopied] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const account = useAppKitAccount();

  const handleInviteClick = async () => {
    try {
      const origin = window.location.origin;
      const ref = account?.address ? `?ref=${account.address}` : '';
      const url = `${origin}/${ref}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="grid grid-cols-4 gap-3 py-3">
      <Link href="/notification" className="flex flex-col items-center gap-1 group">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow border border-gray-100">
          <Bell size={20} className="text-gray-700" />
        </div>
        <span className="text-xs text-gray-600 font-medium">Notifications</span>
      </Link>
      
      <button
        type="button"
        onClick={() => setShowServiceModal(true)}
        className="flex flex-col items-center gap-1 group"
      >
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow border border-gray-100">
          <Headphones size={20} className="text-gray-700" />
        </div>
        <span className="text-xs text-gray-600 font-medium">Online Service</span>
      </button>
      
      <Link href="/about" className="flex flex-col items-center gap-1 group">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow border border-gray-100">
          <Info size={20} className="text-gray-700" />
        </div>
        <span className="text-xs text-gray-600 font-medium">About</span>
      </Link>
      
      <button onClick={handleInviteClick} className="flex flex-col items-center gap-1 group relative">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow border border-gray-100">
          <Share2 size={20} className="text-gray-700" />
        </div>
        <span className="text-xs text-gray-600 font-medium">
          {copied ? 'Copied!' : 'Invite'}
        </span>
      </button>
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
    </div>
  );
}
