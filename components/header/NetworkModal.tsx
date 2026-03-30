/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from 'react';
import { X, Check } from 'lucide-react';
import { networks } from '@/config';
import { AppKitNetwork } from '@reown/appkit/networks';

type Props = {
  onClose: () => void;
  switchNetwork: (chain: AppKitNetwork) => Promise<unknown> | unknown;
  currentChainId?: number | null | string; 
};

export default function NetworkModal({ onClose, switchNetwork, currentChainId }: Props) {
  const handleSwitch = async (chain: AppKitNetwork) => {
    try {
      await switchNetwork(chain);
    } catch (e) {
      // ignore - the appkit adapter may throw if already on network or user rejects
    } finally {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:w-[92%] sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">Select Network</h3>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} className="text-gray-600" />
          </button>
        </div>

        {/* Network List */}
        <div className="p-3 max-h-[60vh] overflow-y-auto">
          <div className="space-y-1">
            {networks.map((n: any) => {
              const id = n.id;
              const name = n.name;
              const isActive = currentChainId && Number(currentChainId) === Number(n.id);
              const imgSrc = n.logo;
              return (
                <button
                  key={String(id)}
                  onClick={() => handleSwitch(n)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-teal-50 border border-teal-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-sm border border-gray-100">
                    <img src={imgSrc} alt={name} className="w-7 h-7 object-contain" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className={`text-sm font-semibold ${isActive ? 'text-teal-700' : 'text-gray-800'}`}>
                      {name}
                    </div>
                    {isActive && (
                      <span className="text-[11px] text-teal-600 font-medium">Connected</span>
                    )}
                  </div>
                  <div className="w-6 h-6 flex items-center justify-center">
                    {isActive ? (
                      <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    ) : (
                      <span className="text-gray-300 text-lg">›</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 text-center">
            Switch to a supported network to start mining
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slideUp 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}
