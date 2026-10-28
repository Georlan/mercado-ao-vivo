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
    const accent = positive ? '#78c7ab' : '#dc8790';
    const chart = createChart(element, {
      width: element.clientWidth, height: element.clientHeight,
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#90a0a8', fontFamily: 'IBM Plex Sans, system-ui, sans-serif', fontSize: 12 },
      grid: { vertLines: { color: '#1e2a30' }, horzLines: { color: '#1e2a30' } },
      rightPriceScale: { borderColor: '#29373c', visible: !compact },
      timeScale: { borderColor: '#29373c', visible: !compact, timeVisible: true, secondsVisible: false },
      crosshair: { mode: CrosshairMode.Normal, vertLine: { color: '#53666b', labelBackgroundColor: '#28393d' }, horzLine: { color: '#53666b', labelBackgroundColor: '#28393d' } },
      handleScroll: false, handleScale: false,
    });
    const series = chart.addAreaSeries({
      lineColor: accent, topColor: positive ? 'rgba(120,199,171,.14)' : 'rgba(220,135,144,.13)',
      bottomColor: 'rgba(0,0,0,0)', lineWidth: 2,
      crosshairMarkerRadius: 4, priceLineVisible: false, lastValueVisible: false,
    });
    series.setData(points.map(({ time, value }) => ({ time: time as never, value })));
    chart.timeScale().fitContent();
    const observer = new ResizeObserver(() => chart.applyOptions({ width: element.clientWidth, height: element.clientHeight }));
    observer.observe(element);
    return () => { observer.disconnect(); chart.remove(); };
  }, [points, positive, compact]);
  return <div ref={container} className="chart" role="img" aria-label={label} />;
}
