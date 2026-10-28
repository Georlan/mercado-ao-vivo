import type { MarketPoint, MarketQuote, MarketSnapshot, SymbolId } from '../data/marketTypes';

/**
 * Free, public reference series only. This is NOT an intraday market data feed.
 * PTAX: BCB SGS 1, daily USD selling reference rate.
 * IBOV: Ipeadata GM366_IBVSP366, B3-origin daily close, D-1 ONLY.
 */
const BCB_ENDPOINT = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados';
const IPEA_ENDPOINT = "https://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='GM366_IBVSP366')";
const BCB_SOURCE = 'https://dadosabertos.bcb.gov.br/dataset/1-taxa-de-cambio---livre---dolar-americano-venda---diario';
const IPEA_SOURCE = 'https://www.ipeadata.gov.br/';

export interface BcbRow { data: string; valor: string | number }
export interface IpeaRow { VALDATA: string; VALVALOR: number | string | null }

// UTC mid-day keeps a daily price as a single stable daily chart point in Brazil.
function toPoint(date: string, value: number): MarketPoint | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(value) || value <= 0) return null;
  const time = Date.parse(`${date}T15:00:00.000Z`) / 1000;
  if (!Number.isFinite(time) || new Date(time * 1000).toISOString().slice(0, 10) !== date) return null;
  return { time, value };
}

function brazilDate(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function parseBcbRows(data: unknown, now = new Date()): MarketPoint[] {
  if (!Array.isArray(data)) throw new Error('Formato BCB inválido');
  const maxDate = brazilDate(now);
  const points = data.flatMap((raw: BcbRow) => {
    if (typeof raw?.data !== 'string') return [];
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw.data);
    if (!match) return [];
    const iso = `${match[3]}-${match[2]}-${match[1]}`;
    const value = typeof raw.valor === 'number' ? raw.valor : Number(raw.valor);
    const point = toPoint(iso, value);
    return point && iso <= maxDate ? [point] : [];
  });
  return normalize(points);
}

export function parseIpeaRows(data: unknown, now = new Date()): MarketPoint[] {
  const rows = (data as { value?: unknown })?.value;
  if (!Array.isArray(rows)) throw new Error('Formato Ipeadata inválido');
  const today = brazilDate(now);
  const points = rows.flatMap((raw: IpeaRow) => {
    if (typeof raw?.VALDATA !== 'string' || raw.VALVALOR === null) return [];
    const iso = raw.VALDATA.slice(0, 10);
    // B3 D-1 only. Never republish same-day IBOV as an official realtime quote.
    if (iso >= today) return [];
    const value = typeof raw.VALVALOR === 'number' ? raw.VALVALOR : Number(raw.VALVALOR);
    const point = toPoint(iso, value);
    return point ? [point] : [];
  });
  return normalize(points);
}

function normalize(points: MarketPoint[]): MarketPoint[] {
  return [...new Map(points.map(p => [p.time, p])).values()].sort((a, b) => a.time - b.time).slice(-365);
}

export function dailyQuote(symbol: SymbolId, points: MarketPoint[], now: Date): MarketQuote {
  if (points.length < 2) throw new Error('Histórico insuficiente para variação');
  const last = points[points.length - 1];
  const reference = new Date(last.time * 1000).toISOString().slice(0, 10);
  const ageMs = Date.parse(`${brazilDate(now)}T15:00:00Z`) - last.time * 1000;
  return {
    symbol,
    title: symbol === 'USDBRL' ? 'Dólar PTAX (venda)' : 'Ibovespa · fechamento',
    value: last.value,
    previousClose: points[points.length - 2].value,
    currency: symbol === 'USDBRL' ? 'BRL' : 'PTS',
    marketStatus: 'unknown', // EOD reference is not a realtime exchange status.
    updatedAt: null, // Upstream does not provide a verifiable publication timestamp.
    observedOn: reference,
    source: symbol === 'USDBRL' ? 'Banco Central (SGS 1)' : 'Ipeadata (origem B3)',
    sourceUrl: symbol === 'USDBRL' ? BCB_SOURCE : IPEA_SOURCE,
    feedMode: ageMs > 7 * 86_400_000 ? 'stale' : 'eod',
    delayMinutes: null,
    series: points,
  };
}

function formatBcbDate(iso: string): string { return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`; }

function bcbUrl(now: Date): string {
  const today = brazilDate(now);
  const start = new Date(`${today}T15:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 400);
  const startDate = start.toISOString().slice(0, 10);
  return `${BCB_ENDPOINT}?formato=json&dataInicial=${encodeURIComponent(formatBcbDate(startDate))}&dataFinal=${encodeURIComponent(formatBcbDate(today))}`;
}

function ipeaUrl(): string {
  return `${IPEA_ENDPOINT}?$orderby=VALDATA%20desc&$top=420`;
}

async function upstreamJson(url: string, fetcher: typeof fetch): Promise<unknown> {
  const response = await fetcher(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function readQuote(symbol: SymbolId, now: Date, fetcher: typeof fetch): Promise<MarketQuote> {
  const json = await upstreamJson(symbol === 'USDBRL' ? bcbUrl(now) : ipeaUrl(), fetcher);
  const points = symbol === 'USDBRL' ? parseBcbRows(json, now) : parseIpeaRows(json, now);
  return dailyQuote(symbol, points, now);
}

// Cached in a warm server instance: no per-viewer upstream fanout. This is not a durable store.
let cache: { expires: number; promise: Promise<MarketSnapshot> } | null = null;

export async function loadMarketSnapshot(now = new Date(), fetcher: typeof fetch = fetch): Promise<MarketSnapshot> {
  if (fetcher === fetch && cache && Date.now() < cache.expires) return cache.promise;
  const run = async (): Promise<MarketSnapshot> => {
    const result = await Promise.allSettled([
      readQuote('USDBRL', now, fetcher),
      readQuote('IBOV', now, fetcher),
    ]);
    const quotes: MarketSnapshot['quotes'] = {};
    const errors: MarketSnapshot['errors'] = {};
    (['USDBRL', 'IBOV'] as const).forEach((symbol, index) => {
      const item = result[index];
      if (item.status === 'fulfilled') quotes[symbol] = item.value;
      else errors[symbol] = 'Fonte temporariamente indisponível';
    });
    return { quotes, errors, stocks: [], checkedAt: now.toISOString(), mode: 'official' };
  };
  const promise = run();
  if (fetcher === fetch) cache = { expires: Date.now() + 5 * 60_000, promise };
  return promise;
}

export async function marketApiResponse(now = new Date(), fetcher: typeof fetch = fetch): Promise<Response> {
  const snapshot = await loadMarketSnapshot(now, fetcher);
  const hasAny = Object.keys(snapshot.quotes).length > 0;
  return new Response(JSON.stringify(snapshot), {
    status: hasAny ? 200 : 503,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': hasAny ? 'public, max-age=60, s-maxage=300' : 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
