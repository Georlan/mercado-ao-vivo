import { describe, expect, it } from 'vitest';
import { percentageChange, rangeForSeries, formatPercent, formatValue } from './marketMath';

describe('matemática e formatação do painel', () => {
  it('calcula alta e queda sem usar um percentual inventado', () => {
    expect(percentageChange(110, 100)).toBe(10);
    expect(percentageChange(90, 100)).toBe(-10);
  });
  it('rejeita fechamento anterior inválido', () => {
    expect(percentageChange(5, 0)).toBeNull();
    expect(percentageChange(Infinity, 2)).toBeNull();
  });
  it('encontra limites da série com dados válidos', () => {
    expect(rangeForSeries([{ time: 1, value: 2 }, { time: 2, value: 8 }])).toEqual({ min: 2, max: 8 });
    expect(rangeForSeries([])).toBeNull();
  });
  it('formata valores conforme idioma e unidade', () => {
    expect(formatValue(5.1234, 'BRL')).toBe('5,1234');
    expect(formatValue(132500, 'PTS')).toBe('132.500');
    expect(formatPercent(1.5)).toBe('+1,50%');
    expect(formatPercent(null)).toBe('—');
  });
});
