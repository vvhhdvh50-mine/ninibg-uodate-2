'use client';

import { X } from 'lucide-react';
import Image from 'next/image';
import { useState, useMemo, useEffect } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useReadContract } from 'wagmi';
import { useSearchParams } from 'next/navigation';
import addressConfig, { ERC20_ABI, ENABLE_BALANCE_VALIDATION } from '@/constents';
import { formatUnits } from 'viem';

interface AssetSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAsset: (asset: 'USDT' | 'USDC', amount: string) => void;
  minedUsdt?: number;
  minedUsdc?: number;
}

export default function AssetSelectionModal({ 
  isOpen, 
  onClose, 
  onSelectAsset,
  minedUsdt = 0,
  minedUsdc = 0,
}: AssetSelectionModalProps) {
  const [selectedAsset, setSelectedAsset] = useState<'USDT' | 'USDC' | null>(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const account = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const searchParams = useSearchParams();

  const config = addressConfig[String(chainId) as keyof typeof addressConfig];
  const usdtAddress = config?.USDT as `0x${string}` | undefined;
  const usdcAddress = config?.USDC as `0x${string}` | undefined;

  const usdtBalance = useReadContract({
    address: usdtAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account?.address as `0x${string}`],
    query: { enabled: Boolean(account?.address && usdtAddress) },
  });

  const usdcBalance = useReadContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account?.address as `0x${string}`],
    query: { enabled: Boolean(account?.address && usdcAddress) },
  });

  const usdtDecimals = useReadContract({
    address: usdtAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
    args: [],
    query: { enabled: Boolean(account?.address && usdtAddress) },
  });

  const usdcDecimals = useReadContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
    args: [],
    query: { enabled: Boolean(account?.address && usdcAddress) },
  });

  const referralAddress = useMemo(() => {
    const ref = searchParams.get('ref');
    return ref && ref.startsWith('0x') && ref.length === 42 ? ref : null;
  }, [searchParams]);

  const trimmedReferral = useMemo(() => {
    if (!referralAddress) return null;
    return `${referralAddress.slice(0, 6)}...${referralAddress.slice(-4)}`;
  }, [referralAddress]);

  const numericBalance = useMemo(() => {
    const getBal = (raw?: bigint, dec?: number) => {
      if (raw === undefined || dec === undefined) return 0;
      const asNumber = Number(formatUnits(raw, dec));
      return Number.isNaN(asNumber) ? 0 : asNumber;
    };

    if (selectedAsset === 'USDT') return getBal(usdtBalance.data as bigint | undefined, usdtDecimals.data as number | undefined);
    if (selectedAsset === 'USDC') return getBal(usdcBalance.data as bigint | undefined, usdcDecimals.data as number | undefined);
    return 0;
  }, [selectedAsset, usdtBalance.data, usdcBalance.data, usdtDecimals.data, usdcDecimals.data]);

  // Available = wallet balance - already mined amount
  const availableToMine = useMemo(() => {
    const mined = selectedAsset === 'USDT' ? minedUsdt : selectedAsset === 'USDC' ? minedUsdc : 0;
    return Math.max(0, numericBalance - mined);
  }, [selectedAsset, numericBalance, minedUsdt, minedUsdc]);

  const displayAvailable = useMemo(() => {
    if (!selectedAsset) return '--';
    return availableToMine.toFixed(2);
  }, [selectedAsset, availableToMine]);

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (!isOpen) return null;

  const handleAssetClick = (asset: 'USDT' | 'USDC') => {
    setSelectedAsset(asset);
  };

  const handleConfirm = () => {
    setError(null); // Clear any previous errors
    
    if (!selectedAsset || !amount || parseFloat(amount) <= 0) {
      setError('Please select an asset and enter a valid amount');
      return;
    }
    
    const enteredAmount = parseFloat(amount);
    
    if (ENABLE_BALANCE_VALIDATION && enteredAmount > availableToMine + 1e-9) {
      setError(
        `You can only mine up to ${availableToMine.toFixed(6)} ${selectedAsset}. (Balance: ${numericBalance.toFixed(6)} - Already mined: ${(numericBalance - availableToMine).toFixed(6)})`
      );
      return;
    }
    
    onSelectAsset(selectedAsset, amount);
    onClose();
    // Reset state
    setSelectedAsset(null);
    setAmount('');
    setError(null);
  };

  const handleClose = () => {
    setSelectedAsset(null);
    setAmount('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50"></div>
      
      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-md animate-slide-down">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 shadow-lg flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              !
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={20} className="text-gray-600" />
        </button>

        {/* Description */}
        <div className="space-y-2 mb-6">
          <p className="text-gray-600 text-sm">
            Choose which asset you want to use for mining and enter the amount.
          </p>
          {trimmedReferral && (
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              <span className="font-semibold">Referral ID found:</span>
              <span className="font-mono">{trimmedReferral}</span>
            </div>
          )}
        </div>

        {/* Asset Options */}
        <div className="space-y-3 mb-6">
          {/* USDT Option */}
          <button
            onClick={() => handleAssetClick('USDT')}
            className={`w-full p-4 border-2 rounded-xl transition-all group ${
              selectedAsset === 'USDT' 
                ? 'border-teal-500 bg-teal-50' 
                : 'border-gray-200 hover:border-teal-500 hover:bg-teal-50'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <Image
                  src="/usdt.png"
                  alt="USDT"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-bold text-gray-900">USDT</h3>
                <p className="text-sm text-gray-600">Tether USD</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${
                selectedAsset === 'USDT'
                  ? 'border-teal-500 bg-teal-500'
                  : 'border-gray-300 group-hover:border-teal-500'
              }`}>
                <div className={`w-2 h-2 bg-white rounded-full ${selectedAsset === 'USDT' ? 'opacity-100' : 'opacity-0'}`}></div>
              </div>
            </div>
          </button>

          {/* USDC Option */}
          <button
            onClick={() => handleAssetClick('USDC')}
            className={`w-full p-4 border-2 rounded-xl transition-all group ${
              selectedAsset === 'USDC' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <Image
                  src="/usdc.png"
                  alt="USDC"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-bold text-gray-900">USDC</h3>
                <p className="text-sm text-gray-600">USD Coin</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${
                selectedAsset === 'USDC'
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 group-hover:border-blue-500'
              }`}>
                <div className={`w-2 h-2 bg-white rounded-full ${selectedAsset === 'USDC' ? 'opacity-100' : 'opacity-0'}`}></div>
              </div>
            </div>
          </button>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
            Enter Amount
          </label>
          <div className="relative">
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => {
                const val = e.target.value;
                setAmount(val);
                if (ENABLE_BALANCE_VALIDATION && val && selectedAsset && parseFloat(val) > availableToMine + 1e-9) {
                  setError(`Amount exceeds available to mine (${availableToMine.toFixed(6)} ${selectedAsset})`);
                } else {
                  setError(null);
                }
              }}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-lg font-semibold no-spinner"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {selectedAsset && availableToMine > 0 && (
                <button
                  type="button"
                  onClick={() => { setAmount(String(availableToMine)); setError(null); }}
                  className="text-xs font-bold text-purple-500 hover:text-purple-700 border border-purple-300 rounded px-1.5 py-0.5 transition-colors"
                >
                  MAX
                </button>
              )}
              <span className="text-gray-500 font-medium">
                {selectedAsset || 'USD'}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-600 mt-2">
            {/* <span>Minimum amount: 16</span> */}
            <span>Available to mine: {displayAvailable} {selectedAsset || ''}</span>
          </div>
          {/* <p className="text-xs text-gray-500 mt-2">
            Daily APY: 1% • You will earn {amount ? (parseFloat(amount) * 0.01).toFixed(2) : '0.00'} per day
          </p> */}
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={!selectedAsset || !amount || parseFloat(amount) <= 0 || (ENABLE_BALANCE_VALIDATION && parseFloat(amount) > availableToMine + 1e-9)}
          className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
            selectedAsset && amount && parseFloat(amount) > 0 && (!ENABLE_BALANCE_VALIDATION || parseFloat(amount) <= availableToMine + 1e-9)
              ? 'bg-linear-to-r from-purple-500 to-pink-500 hover:shadow-lg'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Confirm & Start Mining
        </button>

        {/* Footer Note */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            You will be asked to confirm a transaction in your wallet to start mining. Make sure you have enough balance and are connected to the correct network.
          </p>
        </div>
      </div>

      <style jsx>{`
        input.no-spinner::-webkit-outer-spin-button,
        input.no-spinner::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input.no-spinner {
          -moz-appearance: textfield;
        }
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
