import { formatUnits } from 'viem';

export type AdminTokenConfig = {
  USDT?: string;
  USDC?: string;
};

export function shortAddr(a: string) {
  return a.slice(0, 6) + '…' + a.slice(-4);
}

export function fmtUnits(raw: bigint | undefined, decimals = 18, dp = 4) {
  if (raw === undefined) return '—';
  return Number(formatUnits(raw, decimals)).toFixed(dp);
}
