import { describe, expect, it } from 'vitest';
import { dailyQuote, loadMarketSnapshot, marketApiResponse, parseBcbRows, parseIpeaRows } from './marketService';

const now = new Date('2026-10-27T18:00:00.000Z');
const bcb = [{ data: '23/10/2026', valor: '5.1000' }, { data: '26/10/2026', valor: '5.2000' }, { data: '27/10/2026', valor: '5.3000' }];
const ipea = { value: [
  { VALDATA: '2026-10-27T00:00:00-03:00', VALVALOR: 90000 },
  { VALDATA: '2026-10-26T00:00:00-03:00', VALVALOR: 80000 },
  { VALDATA: '2026-10-23T00:00:00-03:00', VALVALOR: 75000 },
] };

function mockedFetch(bad: 'none' | 'bcb' | 'ipea' | 'both' = 'none'): typeof fetch {
  return (async (url: string) => {
    const isBcb = String(url).includes('bcb.gov.br');
    if (bad === 'both' || (bad === 'bcb' && isBcb) || (bad === 'ipea' && !isBcb)) return new Response('unavailable', { status: 503 });
    return new Response(JSON.stringify(isBcb ? bcb : ipea), { status: 200 });
  }) as unknown as typeof fetch;
}

describe('fontes oficiais e controles de integridade', () => {
  it('parses PTAX com datas e rejeita datas futuras, inválidas e valores não positivos', () => {
    const points = parseBcbRows([...bcb, { data: '28/10/2026', valor: '20' }, { data: '30/02/2026', valor: '25' }, { data: '12/10/2026', valor: '0' }], now);
    expect(points).toHaveLength(3);
    expect(points.map(p => p.value)).toEqual([5.1, 5.2, 5.3]);
  });

  it('enforces IBOV D-1, never exposing today as daily B3 close', () => {
    const points = parseIpeaRows(ipea, now);
    expect(points).toHaveLength(2);
    expect(points.map(p => p.value)).toEqual([75000, 80000]);
  });

  it('labels real values as reference only, not intraday or timestamped publication', () => {
    const usd = dailyQuote('USDBRL', parseBcbRows(bcb, now), now);
    expect(usd.title).toBe('Dólar PTAX (venda)');
    expect(usd.feedMode).toBe('eod');
    expect(usd.updatedAt).toBeNull();
    expect(usd.observedOn).toBe('2026-10-27');
    expect(usd.previousClose).toBe(5.2);
  });

  it('keeps a working quote when the other source fails, without fake fallback', async () => {
    const snapshot = await loadMarketSnapshot(now, mockedFetch('ipea'));
    expect(snapshot.quotes.USDBRL?.value).toBe(5.3);
    expect(snapshot.quotes.IBOV).toBeUndefined();
    expect(snapshot.errors?.IBOV).toBeTruthy();
    expect(snapshot.stocks).toEqual([]);
  });

  it('answers HTTP 503 when both sources fail, never an invented quote', async () => {
    const res = await marketApiResponse(now, mockedFetch('both'));
    expect(res.status).toBe(503);
    const result = await res.json();
    expect(result.quotes).toEqual({});
    expect(result.stocks).toEqual([]);
  });

  it('rejects a malformed Ipeadata response safely', () => {
    expect(() => parseIpeaRows({ somethingElse: [] }, now)).toThrow();
  });
});
