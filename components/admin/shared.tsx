import { useState, type ReactNode } from 'react';
import { useWaitForTransactionReceipt } from 'wagmi';
import { ChevronDown, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

type SectionAccent = 'purple' | 'indigo' | 'rose' | 'amber' | 'teal';

export function Section({
  icon,
  title,
  children,
  defaultOpen = true,
  accent = 'purple',
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  accent?: SectionAccent;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const accentMap: Record<SectionAccent, string> = {
    purple: 'bg-purple-100 text-purple-600 border-purple-200',
    indigo: 'bg-indigo-100 text-indigo-600 border-indigo-200',
    rose: 'bg-rose-100 text-rose-600 border-rose-200',
    amber: 'bg-amber-100 text-amber-600 border-amber-200',
    teal: 'bg-teal-100 text-teal-600 border-teal-200',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${accentMap[accent]}`}>
          {icon}
        </div>
        <span className="flex-1 font-bold text-gray-900 text-sm">{title}</span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          open ? 'max-h-500 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="border-t border-gray-100 px-4 py-4 space-y-3">{children}</div>
      </div>
    </div>
  );
}

export function TxStatus({ hash, reset }: { hash: `0x${string}` | undefined; reset: () => void }) {
  const { isLoading, isSuccess, isError } = useWaitForTransactionReceipt({ hash });
  if (!hash) return null;

  return (
    <div
      className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs border ${
        isLoading
          ? 'bg-blue-50 border-blue-100 text-blue-700'
          : isSuccess
          ? 'bg-green-50 border-green-100 text-green-700'
          : 'bg-rose-50 border-rose-100 text-rose-700'
      }`}
    >
      {isLoading && <Loader2 className="animate-spin shrink-0 mt-0.5" size={13} />}
      {isSuccess && <CheckCircle2 className="shrink-0 mt-0.5" size={13} />}
      {isError && <XCircle className="shrink-0 mt-0.5" size={13} />}
      <span className="break-all flex-1">
        {isLoading && 'Waiting for confirmation…'}
        {isSuccess && `Confirmed! Tx: ${hash}`}
        {isError && `Failed. Tx: ${hash}`}
      </span>
      {!isLoading && (
        <button type="button" onClick={reset} className="ml-1 font-bold underline shrink-0">
          Dismiss
        </button>
      )}
    </div>
  );
}

export function AddrInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </label>
      <input
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50"
        placeholder={placeholder ?? '0x…'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function AmtInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </label>
      <input
        type="number"
        min="0"
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50"
        placeholder={placeholder ?? '0'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function ActionBtn({
  onClick,
  loading,
  danger,
  children,
}: {
  onClick: () => void;
  loading?: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-60 ${
        danger
          ? 'bg-rose-600 hover:bg-rose-700 text-white'
          : 'bg-purple-600 hover:bg-purple-700 text-white'
      }`}
    >
      {loading && <Loader2 className="animate-spin" size={15} />}
      {children}
    </button>
  );
}
