import type { MarketDataProvider, MarketSnapshot } from './marketTypes';

export const officialMarketProvider: MarketDataProvider = {
  async getSnapshot(): Promise<MarketSnapshot> {
    const response = await fetch('/api/market', { headers: { Accept: 'application/json' }, cache: 'no-store' });
    // The API returns a structured error state even if both sources are unavailable.
    if (!response.ok && response.status !== 503) throw new Error(`Erro ao obter mercado: HTTP ${response.status}`);
    const snapshot: MarketSnapshot = await response.json();
    if (!snapshot || !snapshot.quotes || !Array.isArray(snapshot.stocks)) throw new Error('Resposta do mercado inválida');
    return snapshot;
  },
};
