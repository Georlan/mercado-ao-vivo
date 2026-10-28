import type { MarketPoint } from './marketTypes';

export function percentageChange(value: number, previousClose: number): number | null {
  if (!Number.isFinite(value) || !Number.isFinite(previousClose) || previousClose <= 0) return null;
  return ((value - previousClose) / previousClose) * 100;
}

export function rangeForSeries(points: MarketPoint[]): { min: number; max: number } | null {
  if (!points.length || points.some((p) => !Number.isFinite(p.value))) return null;
  return { min: Math.min(...points.map((p) => p.value)), max: Math.max(...points.map((p) => p.value)) };
}

export function formatValue(value: number, currency: 'BRL' | 'PTS'): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: currency === 'BRL' ? 4 : 0,
    maximumFractionDigits: currency === 'BRL' ? 4 : 0,
  }).format(value);
}

export function formatPercent(value: number | null): string {
  if (value === null) return '—';
  return `${value > 0 ? '+' : ''}${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}%`;
}
