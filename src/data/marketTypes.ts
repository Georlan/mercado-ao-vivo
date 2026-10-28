/** Contrato independente do fornecedor. Não implica autorização para redistribuir dados. */
export type SymbolId = 'USDBRL' | 'IBOV';
export type MarketStatus = 'open' | 'closed' | 'unknown';
export type FeedMode = 'demo' | 'delayed' | 'realtime' | 'stale';

export interface MarketPoint {
  time: number; // UNIX UTC seconds
  value: number;
}

export interface MarketQuote {
  symbol: SymbolId;
  title: string;
  value: number;
  previousClose: number;
  currency: 'BRL' | 'PTS';
  marketStatus: MarketStatus;
  updatedAt: string | null;
  source: string;
  feedMode: FeedMode;
  delayMinutes: number | null;
  series: MarketPoint[];
}

export interface MarketSnapshot {
  quotes: Record<SymbolId, MarketQuote>;
  stocks: Array<{ ticker: string; name: string; changePercent: number }>;
}

export interface MarketDataProvider {
  getSnapshot(): Promise<MarketSnapshot>;
}
