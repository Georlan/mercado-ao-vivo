import type { MarketDataProvider, MarketPoint, MarketSnapshot } from './marketTypes';

// Cotações e curvas inteiramente fictícias. Nunca usar como se fossem preços atuais.
const baseTime = Date.UTC(2025, 0, 2, 12, 0, 0) / 1000;
const dollarValues = [5.14,5.16,5.13,5.18,5.20,5.17,5.21,5.19,5.23,5.22,5.25,5.24,5.28,5.26,5.31,5.29,5.33,5.32,5.30,5.34,5.37,5.35,5.38,5.40,5.39,5.42,5.41,5.45,5.44,5.47];
const ibovValues = [128200,128600,128100,128900,129400,129000,129600,129300,129100,129900,130100,129800,130500,130200,130700,130300,130900,130500,131100,131400,130900,131300,131000,131800,131500,131900,132100,131700,132200,132500];
const asPoints = (values: number[]): MarketPoint[] => values.map((value, i) => ({ time: baseTime + i * 60 * 15, value }));

const snapshot: MarketSnapshot = {
  quotes: {
    USDBRL: {
      symbol: 'USDBRL', title: 'Dólar comercial', value: 5.47, previousClose: 5.39,
      currency: 'BRL', marketStatus: 'unknown', updatedAt: null, observedOn: null, source: 'Cenário fictício',
      feedMode: 'demo', delayMinutes: null, series: asPoints(dollarValues),
    },
    IBOV: {
      symbol: 'IBOV', title: 'Ibovespa', value: 132500, previousClose: 130850,
      currency: 'PTS', marketStatus: 'unknown', updatedAt: null, observedOn: null, source: 'Cenário fictício',
      feedMode: 'demo', delayMinutes: null, series: asPoints(ibovValues),
    },
  },
  stocks: [
    { ticker: 'PETR4', name: 'Petrobras PN', changePercent: 1.84 },
    { ticker: 'VALE3', name: 'Vale ON', changePercent: -0.76 },
    { ticker: 'ITUB4', name: 'Itaú Unibanco PN', changePercent: 0.92 },
    { ticker: 'BBAS3', name: 'Banco do Brasil ON', changePercent: -0.31 },
    { ticker: 'WEGE3', name: 'WEG ON', changePercent: 2.18 },
    { ticker: 'BBDC4', name: 'Bradesco PN', changePercent: -1.14 },
  ],
};

export const demoMarketProvider: MarketDataProvider = {
  async getSnapshot() {
    // Cópia evita mutação acidental da fixture compartilhada.
    return structuredClone(snapshot);
  },
};
