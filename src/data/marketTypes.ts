/** Contrato independente do fornecedor. Não implica autorização para redistribuir dados. */
export type SymbolId = 'USDBRL' | 'IBOV';
export type MarketStatus = 'open' | 'closed' | 'unknown';
export type FeedMode = 'demo' | 'eod' | 'realtime' | 'stale';

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
  observedOn: string | null; // ISO daily reference date, NOT a publication timestamp
  source: string;
  sourceUrl?: string;
  feedMode: FeedMode;
  delayMinutes: number | null;
  series: MarketPoint[];
}

export interface MarketSnapshot {
  quotes: Partial<Record<SymbolId, MarketQuote>>;
  errors?: Partial<Record<SymbolId, string>>;
  checkedAt?: string;
  mode?: 'official' | 'demo';
  stocks: Array<{ ticker: string; name: string; changePercent: number }>;
}

export interface MarketDataProvider {
  getSnapshot(): Promise<MarketSnapshot>;
}
