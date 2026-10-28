import { useEffect, useRef } from 'react';
import { ColorType, CrosshairMode, createChart } from 'lightweight-charts';
import type { MarketPoint } from '../data/marketTypes';

interface Props {
  points: MarketPoint[];
  positive: boolean;
  compact?: boolean;
  label?: string;
}

export function MarketChart({ points, positive, compact = false, label = 'Gráfico de série histórica' }: Props) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = container.current;
    if (!element || !points.length) return;

    const accent = positive ? '#43d6ac' : '#ff747c';
    const chart = createChart(element, {
      width: element.clientWidth,
      height: element.clientHeight,
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#788a9d', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 11 },
      grid: { vertLines: { color: '#1a2834' }, horzLines: { color: '#1a2834' } },
      rightPriceScale: { borderColor: '#273644', visible: !compact },
      timeScale: { borderColor: '#273644', visible: !compact, timeVisible: true, secondsVisible: false },
      crosshair: { mode: CrosshairMode.Normal, vertLine: { color: '#5b7084', labelBackgroundColor: '#253746' }, horzLine: { color: '#5b7084', labelBackgroundColor: '#253746' } },
      handleScroll: false,
      handleScale: false,
    });
    const series = chart.addAreaSeries({
      lineColor: accent, topColor: positive ? 'rgba(67,214,172,.25)' : 'rgba(255,116,124,.25)',
      bottomColor: 'rgba(0,0,0,0)', lineWidth: 2,
      crosshairMarkerRadius: 4,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    series.setData(points.map(({ time, value }) => ({ time: time as never, value })));
    chart.timeScale().fitContent();
    const observer = new ResizeObserver(() => chart.applyOptions({ width: element.clientWidth, height: element.clientHeight }));
    observer.observe(element);
    return () => { observer.disconnect(); chart.remove(); };
  }, [points, positive, compact]);

  return <div ref={container} className={compact ? 'chart chart-compact' : 'chart'} role="img" aria-label={label} />;
}
