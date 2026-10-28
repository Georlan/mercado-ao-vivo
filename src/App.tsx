import { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, ChevronDown,
  Clock3, ExternalLink, Globe2, Info, Layers3, Maximize2, Radio, Search,
  ShieldAlert, TrendingUp, Zap,
} from 'lucide-react';
import { MarketChart } from './components/MarketChart';
import { demoMarketProvider } from './data/mockMarket';
import { formatPercent, formatValue, percentageChange, rangeForSeries } from './data/marketMath';
import type { MarketSnapshot, MarketQuote, SymbolId } from './data/marketTypes';

const periods = ['1D', '1S', '1M', '3M', '1A'] as const;
type Period = typeof periods[number];

function QuoteChange({ quote, large = false }: { quote: MarketQuote; large?: boolean }) {
  const change = percentageChange(quote.value, quote.previousClose);
  const isPositive = change !== null && change >= 0;
  return <span className={`change ${isPositive ? 'positive' : 'negative'} ${large ? 'change-large' : ''}`}>
    {isPositive ? <ArrowUpRight size={large ? 17 : 14}/> : <ArrowDownRight size={large ? 17 : 14}/>}
    {formatPercent(change)}
  </span>;
}

function QuoteCard({ quote, selected, onSelect }: { quote: MarketQuote; selected: boolean; onSelect: () => void }) {
  const range = rangeForSeries(quote.series);
  return <button className={`quote-card ${selected ? 'quote-card-active' : ''}`} onClick={onSelect} aria-pressed={selected}>
    <div className="quote-header"><span className="quote-symbol">{quote.symbol === 'USDBRL' ? 'USD / BRL' : '^IBOV'}</span><span className="quote-dot" /></div>
    <span className="quote-label">{quote.title}</span>
    <div className="quote-number"><span>{quote.currency === 'BRL' && <small>R$</small>}{formatValue(quote.value, quote.currency)}</span></div>
    <div className="quote-footer"><QuoteChange quote={quote}/><span>vs. fechamento anterior</span></div>
    <div className="quote-range"><span>Min. {range ? formatValue(range.min, quote.currency) : '—'}</span><span>Máx. {range ? formatValue(range.max, quote.currency) : '—'}</span></div>
  </button>;
}

function TimeBadge() {
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setClock(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  return <span className="clock-label"><Clock3 size={14}/>{new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false }).format(clock)} <span className="time-zone">BRT</span></span>;
}

export default function App() {
  const broadcast = window.location.pathname === '/broadcast';
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [symbol, setSymbol] = useState<SymbolId>('USDBRL');
  const [period, setPeriod] = useState<Period>('1D');
  const [filter, setFilter] = useState('');
  const [view, setView] = useState<'overview' | 'watchlist'>('overview');

  useEffect(() => {
    let active = true;
    demoMarketProvider.getSnapshot().then(data => { if (active) setSnapshot(data); }).catch(console.error);
    return () => { active = false; };
  }, []);

  const quote = snapshot?.quotes[symbol];
  const otherQuote = snapshot?.quotes[symbol === 'USDBRL' ? 'IBOV' : 'USDBRL'];
  const points = useMemo(() => {
    if (!quote) return [];
    // Reamostragens de uma MESMA fixture fictícia para avaliar a UI, sem alegar histórico real.
    const size = ({ '1D': 10, '1S': 15, '1M': 20, '3M': 25, '1A': 30 } as const)[period];
    return quote.series.slice(-size);
  }, [quote, period]);
  const visibleStocks = snapshot?.stocks.filter(item => `${item.ticker} ${item.name}`.toLowerCase().includes(filter.toLowerCase())) ?? [];
  const winners = snapshot?.stocks.filter(item => item.changePercent >= 0).sort((a,b) => b.changePercent - a.changePercent) ?? [];
  const losers = snapshot?.stocks.filter(item => item.changePercent < 0).sort((a,b) => a.changePercent - b.changePercent) ?? [];
  const quotePositive = quote ? (percentageChange(quote.value, quote.previousClose) ?? 0) >= 0 : true;

  return <div className={`app ${broadcast ? 'app-broadcast' : ''}`}>
    <div className="top-accent"/>
    <header className="header">
      <a className="brand" href="/" aria-label="Mercado ao Vivo, início"><span className="brand-icon"><Activity size={20} strokeWidth={2.5}/></span><span><strong>MERCADO<span className="brand-muted">AO VIVO</span></strong><small>CENTRAL DE MERCADO</small></span></a>
      {!broadcast && <nav className="navigation" aria-label="Navegação principal">
        <button onClick={() => setView('overview')} className={view === 'overview' ? 'nav-active' : ''}><Layers3 size={16}/> Visão geral</button>
        <button onClick={() => setView('watchlist')} className={view === 'watchlist' ? 'nav-active' : ''}><BarChart3 size={16}/> Ativos</button>
        <a href="#sobre"><Info size={16}/> Sobre os dados</a>
      </nav>}
      <div className="header-actions"><TimeBadge/>{!broadcast && <a className="broadcast-link" href="/broadcast"><Maximize2 size={15}/> Modo transmissão <ArrowRight size={14}/></a>}{broadcast && <span className="broadcast-mode-label"><Radio size={15}/> LAYOUT BROADCAST</span>}</div>
    </header>

    <div className="demo-banner" role="status"><ShieldAlert size={15}/><strong>AMBIENTE DE DEMONSTRAÇÃO</strong><span>Todos os valores, variações e gráficos abaixo são fictícios. Nenhuma fonte de mercado está conectada.</span></div>

    <main className="main">
      <div className="headline-row">
        <div><div className="eyebrow"><span className="eyebrow-line"/> VISÃO CONSOLIDADA · BRASIL</div><h1>{view === 'overview' || broadcast ? 'Radar do mercado' : 'Ativos monitorados'}<span className="heading-period">.</span></h1><p>Acompanhe dólar, bolsa brasileira e movimentos de mercado em um só lugar.</p></div>
        <div className="headline-right"><span className="status-pill"><span className="status-pulse"/> FEED NÃO CONECTADO</span><span className="headline-time">Atualização de preços: indisponível</span></div>
      </div>

      {!snapshot || !quote || !otherQuote ? <div className="loading-panel" role="status">Preparando painel de demonstração…</div> : <>
      <div className="dashboard-grid">
        <section className="left-column" aria-label="Cotações principais">
          <div className="section-title"><span><Zap size={14}/> INDICADORES PRINCIPAIS</span><span>01 / 03</span></div>
          <QuoteCard quote={snapshot.quotes.USDBRL} selected={symbol === 'USDBRL'} onSelect={() => setSymbol('USDBRL')}/>
          <QuoteCard quote={snapshot.quotes.IBOV} selected={symbol === 'IBOV'} onSelect={() => setSymbol('IBOV')}/>
          <div className="small-insight"><div className="insight-top"><Info size={15}/><strong>Sobre este painel</strong></div><p>O gráfico e as métricas são uma demonstração visual. Em produção, cada indicador terá sua fonte, atraso e horário de origem identificados.</p></div>
        </section>

        <section className="center-column" aria-label="Gráfico principal">
          <div className="chart-panel">
            <div className="chart-top"><div><div className="chart-kicker">GRÁFICO PRINCIPAL <span className="demo-mini">CENÁRIO FICTÍCIO</span></div><h2>{quote.title} <span>{symbol === 'USDBRL' ? 'USD/BRL' : 'IBOV'}</span></h2></div><span className="chart-source"><span className="source-dot"/> DADOS SIMULADOS</span></div>
            <div className="chart-value-row"><strong>{quote.currency === 'BRL' ? 'R$ ' : ''}{formatValue(quote.value, quote.currency)}</strong><QuoteChange quote={quote} large/></div>
            <div className="period-selector" role="group" aria-label="Período exibido">
              {periods.map(p => <button key={p} onClick={() => setPeriod(p)} className={period === p ? 'period-active' : ''} aria-pressed={period === p}>{p}</button>)}
              <span className="period-note">Janelas ilustrativas</span>
            </div>
            <div className="main-chart"><MarketChart points={points} positive={quotePositive}/></div>
            <div className="chart-bottom"><span><span className="legend-line"/> {quote.title}</span><span>Dados fictícios · Sem atualização automática</span></div>
          </div>
          <div className="center-bottom-grid">
            <div className="stat-panel"><div className="stat-heading"><TrendingUp size={16}/> VARIAÇÃO NO CENÁRIO</div><div className="stat-number"><QuoteChange quote={quote} large/></div><p>Comparação com a referência fictícia anterior.</p></div>
            <div className="stat-panel"><div className="stat-heading"><Globe2 size={16}/> SEGUNDO INDICADOR</div><div className="stat-side"><strong>{otherQuote.symbol === 'IBOV' ? 'IBOV' : 'USD/BRL'}</strong><QuoteChange quote={otherQuote}/></div><p>Selecione um cartão à esquerda para alternar o gráfico.</p></div>
          </div>
        </section>

        <aside className="right-column" aria-label="Radar de ações">
          <div className="section-title"><span><Activity size={14}/> RADAR DE AÇÕES</span><span>02 / 03</span></div>
          <div className="movers-panel">
            <div className="panel-tabs"><span>Maiores variações</span><span className="tiny-chip">EXEMPLOS</span></div>
            <div className="movers-title"><ArrowUpRight size={15}/> ALTAS</div>
            {winners.map(stock => <div className="mover-row" key={stock.ticker}><div><strong>{stock.ticker}</strong><span>{stock.name}</span></div><span className="positive">{formatPercent(stock.changePercent)}</span></div>)}
            <div className="movers-title down"><ArrowDownRight size={15}/> BAIXAS</div>
            {losers.map(stock => <div className="mover-row" key={stock.ticker}><div><strong>{stock.ticker}</strong><span>{stock.name}</span></div><span className="negative">{formatPercent(stock.changePercent)}</span></div>)}
          </div>
          <div className="sponsor-panel"><span>ESPAÇO PUBLICITÁRIO</span><div className="sponsor-inner"><span className="sponsor-icon">◇</span><strong>Sua marca aqui</strong><small>Área reservada para futuro patrocínio identificado.</small></div></div>
        </aside>
      </div>
      <section className="watchlist-section" aria-label="Lista de ativos">
        <div className="watchlist-heading"><div><span className="eyebrow">ACOMPANHAMENTO</span><h2>Ativos em destaque</h2></div>{!broadcast && <div className="search-field"><Search size={16}/><input aria-label="Buscar ativo" placeholder="Buscar ativo..." value={filter} onChange={e => setFilter(e.target.value)} /></div>}</div>
        <div className="stock-grid">{visibleStocks.length ? visibleStocks.map(stock => <div key={stock.ticker} className="stock-item"><span className="stock-initial">{stock.ticker.slice(0,2)}</span><span className="stock-info"><strong>{stock.ticker}</strong><small>{stock.name}</small></span><span className={stock.changePercent >= 0 ? 'positive' : 'negative'}>{formatPercent(stock.changePercent)}</span></div>) : <div className="no-results">Nenhum ativo corresponde à busca.</div>}</div>
      </section>
      </>}
    </main>
    <footer className="footer" id="sobre"><div><span className="footer-logo"><Activity size={15}/> MERCADO AO VIVO</span><span>Protótipo de interface · Preços e gráficos fictícios</span></div><div><span>Sem feed de mercado conectado</span>{!broadcast && <a href="/broadcast">Abrir tela de transmissão <ExternalLink size={13}/></a>}{broadcast && <a href="/">Voltar ao site <ChevronDown size={13}/></a>}</div></footer>
  </div>;
}
