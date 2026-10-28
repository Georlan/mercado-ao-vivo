import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, ChevronDown,
  Clock3, ExternalLink, Globe2, Info, Layers3, Maximize2, Radio, RefreshCw,
  Search, ShieldAlert, TrendingUp, Zap,
} from 'lucide-react';
import { MarketChart } from './components/MarketChart';
import { officialMarketProvider } from './data/officialMarket';
import { formatPercent, formatValue, percentageChange, rangeForSeries } from './data/marketMath';
import type { MarketSnapshot, MarketQuote, SymbolId } from './data/marketTypes';

const periods = ['5D', '1M', '3M', '6M', '1A'] as const;
type Period = typeof periods[number];

function dateBr(iso: string | null | undefined): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '—';
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

function QuoteChange({ quote, large = false }: { quote: MarketQuote; large?: boolean }) {
  const change = percentageChange(quote.value, quote.previousClose);
  const isPositive = change !== null && change >= 0;
  return <span className={`change ${isPositive ? 'positive' : 'negative'} ${large ? 'change-large' : ''}`}>
    {isPositive ? <ArrowUpRight size={large ? 17 : 14}/> : <ArrowDownRight size={large ? 17 : 14}/>}
    {formatPercent(change)}
  </span>;
}

function QuoteCard({ symbol, quote, selected, onSelect }: { symbol: SymbolId; quote?: MarketQuote; selected: boolean; onSelect: () => void }) {
  const range = quote ? rangeForSeries(quote.series) : null;
  return <button className={`quote-card ${selected ? 'quote-card-active' : ''}`} onClick={onSelect} aria-pressed={selected}>
    <div className="quote-header"><span className="quote-symbol">{symbol === 'USDBRL' ? 'USD / BRL' : '^IBOV'}</span><span className="quote-dot" /></div>
    <span className="quote-label">{quote?.title ?? (symbol === 'USDBRL' ? 'Dólar PTAX (venda)' : 'Ibovespa · fechamento')}</span>
    {quote ? <>
      <div className="quote-number"><span>{quote.currency === 'BRL' && <small>R$</small>}{formatValue(quote.value, quote.currency)}</span></div>
      <div className="quote-footer"><QuoteChange quote={quote}/><span>vs. referência anterior</span></div>
      <div className="quote-range"><span>Mín. histórico {range ? formatValue(range.min, quote.currency) : '—'}</span><span>Máx. histórico {range ? formatValue(range.max, quote.currency) : '—'}</span></div>
      <span className="quote-reference">{quote.feedMode === 'stale' ? 'Série possivelmente desatualizada' : 'Série diária'} · Ref. {dateBr(quote.observedOn)}</span>
    </> : <div className="quote-unavailable">Cotação indisponível <small>Sem valor de substituição</small></div>}
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

function periodPoints(quote: MarketQuote, period: Period) {
  if (period === '5D') return quote.series.slice(-5);
  const days = ({ '1M': 30, '3M': 90, '6M': 180, '1A': 365 } as const)[period];
  const latest = quote.series[quote.series.length - 1]?.time ?? 0;
  return quote.series.filter(p => p.time >= latest - days * 86_400);
}

export default function App() {
  const broadcast = window.location.pathname === '/broadcast';
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [failure, setFailure] = useState(false);
  const [busy, setBusy] = useState(false);
  const [symbol, setSymbol] = useState<SymbolId>('USDBRL');
  const [period, setPeriod] = useState<Period>('1M');
  const [filter, setFilter] = useState('');
  const [view, setView] = useState<'overview' | 'watchlist'>('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey(x => x + 1), []);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!active) return;
      setBusy(true);
      try {
        const data = await officialMarketProvider.getSnapshot();
        if (active) { setSnapshot(data); setFailure(false); }
      } catch {
        if (active) setFailure(true);
      } finally {
        if (active) setBusy(false);
      }
    }
    void load();
    const timer = window.setInterval(() => { void load(); }, 5 * 60_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [refreshKey]);

  const selectedQuote = snapshot?.quotes[symbol];
  const quote = selectedQuote ?? snapshot?.quotes[symbol === 'USDBRL' ? 'IBOV' : 'USDBRL'];
  const otherQuote = quote ? snapshot?.quotes[quote.symbol === 'USDBRL' ? 'IBOV' : 'USDBRL'] : undefined;
  const points = useMemo(() => quote ? periodPoints(quote, period) : [], [quote, period]);
  const visibleStocks = snapshot?.stocks.filter(item => `${item.ticker} ${item.name}`.toLowerCase().includes(filter.toLowerCase())) ?? [];
  const winners = [...visibleStocks].filter(item => item.changePercent >= 0).sort((a, b) => b.changePercent - a.changePercent);
  const losers = [...visibleStocks].filter(item => item.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent);
  const quotePositive = quote ? (percentageChange(quote.value, quote.previousClose) ?? 0) >= 0 : true;
  const hasQuotes = Boolean(snapshot && Object.keys(snapshot.quotes).length);
  const checked = snapshot?.checkedAt ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(new Date(snapshot.checkedAt)) : '—';

  return <div className={`app ${broadcast ? 'app-broadcast' : ''}`}>
    <div className="top-accent" />
    <header className="header">
      <a className="brand" href="/" aria-label="Mercado ao Vivo, início"><span className="brand-icon"><Activity size={20} strokeWidth={2.5}/></span><span><strong>MERCADO<span className="brand-muted">AO VIVO</span></strong><small>CENTRAL DE MERCADO</small></span></a>
      {!broadcast && <nav className="navigation" aria-label="Navegação principal">
        <button onClick={() => setView('overview')} className={view === 'overview' ? 'nav-active' : ''}><Layers3 size={16}/> Visão geral</button>
        <button onClick={() => setView('watchlist')} className={view === 'watchlist' ? 'nav-active' : ''}><BarChart3 size={16}/> Ativos</button>
        <a href="#sobre"><Info size={16}/> Sobre os dados</a>
      </nav>}
      <div className="header-actions"><TimeBadge/>{!broadcast && <a className="broadcast-link" href="/broadcast"><Maximize2 size={15}/> Modo transmissão <ArrowRight size={14}/></a>}{broadcast && <span className="broadcast-mode-label"><Radio size={15}/> LAYOUT BROADCAST</span>}</div>
    </header>

    <div className="demo-banner data-banner" role="status"><ShieldAlert size={15}/><strong>DADOS OFICIAIS DE REFERÊNCIA</strong><span>PTAX do Banco Central e fechamento histórico do Ibovespa (D−1). Não são cotações intradiárias nem preços em tempo real.</span></div>

    <main className="main">
      <div className="headline-row">
        <div><div className="eyebrow"><span className="eyebrow-line"/> VISÃO CONSOLIDADA · BRASIL</div><h1>{view === 'overview' || broadcast ? 'Radar do mercado' : 'Ativos monitorados'}<span className="heading-period">.</span></h1><p>Dados reais de referência, origem identificada e acompanhamento automático das publicações.</p></div>
        <div className="headline-right"><span className="status-pill"><span className="status-pulse"/>{failure ? 'FALHA NA ÚLTIMA CONSULTA' : hasQuotes ? 'REFERÊNCIAS DIÁRIAS' : 'FONTES INDISPONÍVEIS'}</span><span className="headline-time">Consulta ao servidor: {checked} BRT</span></div>
      </div>
      <div className="market-toolbar"><span><Info size={14}/> {failure ? 'Não foi possível atualizar; não confunda valores anteriores com dados atuais.' : 'Atualização automática a cada 5 min · As referências só mudam quando a fonte publica novos dados.'}</span><button type="button" onClick={refresh} disabled={busy}><RefreshCw size={14} className={busy ? 'spin' : ''}/> {busy ? 'Consultando…' : 'Atualizar fontes'}</button></div>

      {!snapshot && !failure ? <div className="loading-panel" role="status">Consultando fontes oficiais…</div> : <>
      {(!snapshot || !hasQuotes) && <div className="source-error" role="alert">Não foi possível obter cotações oficiais agora. O painel não exibirá preços simulados. Verifique a conexão e tente atualizar novamente.</div>}
      <div className="dashboard-grid">
        <section className="left-column" aria-label="Cotações principais">
          <div className="section-title"><span><Zap size={14}/> INDICADORES PRINCIPAIS</span><span>01 / 03</span></div>
          <QuoteCard symbol="USDBRL" quote={snapshot?.quotes.USDBRL} selected={quote?.symbol === 'USDBRL'} onSelect={() => setSymbol('USDBRL')} />
          <QuoteCard symbol="IBOV" quote={snapshot?.quotes.IBOV} selected={quote?.symbol === 'IBOV'} onSelect={() => setSymbol('IBOV')} />
          <div className="small-insight"><div className="insight-top"><Info size={15}/><strong>Entenda as referências</strong></div><p>PTAX é a taxa de referência oficial do BCB, não preço de negociação ao vivo. O IBOV apresenta fechamentos anteriores (D−1) do Ipeadata. A data de referência não é o horário de publicação. Dados podem ficar indisponíveis ou atrasados.</p></div>
        </section>

        <section className="center-column" aria-label="Gráfico principal">
          <div className="chart-panel">
            <div className="chart-top"><div><div className="chart-kicker">GRÁFICO PRINCIPAL <span className="demo-mini">SÉRIE DIÁRIA</span></div><h2>{quote?.title ?? 'Dados de mercado indisponíveis'} <span>{quote?.symbol === 'USDBRL' ? 'USD/BRL' : quote ? 'IBOV' : '—'}</span></h2></div><span className="chart-source"><span className="source-dot"/> {quote?.source ?? 'SEM FONTE'}</span></div>
            <div className="chart-value-row">{quote ? <><strong>{quote.currency === 'BRL' ? 'R$ ' : ''}{formatValue(quote.value, quote.currency)}</strong><QuoteChange quote={quote} large/></> : <strong>—</strong>}</div>
            <div className="period-selector" role="group" aria-label="Período exibido">
              {periods.map(p => <button key={p} onClick={() => setPeriod(p)} className={period === p ? 'period-active' : ''} aria-pressed={period === p}>{p}</button>)}
              <span className="period-note">Fechamentos diários</span>
            </div>
            <div className="main-chart">{quote && points.length ? <MarketChart points={points} positive={quotePositive} label={`Série diária ${quote.title}, referência ${dateBr(quote.observedOn)}`} /> : <div className="empty-chart">Sem histórico disponível para exibição</div>}</div>
            <div className="chart-bottom"><span><span className="legend-line"/> {quote?.title ?? 'Aguardando fonte'}</span><span>{quote ? `Ref. ${dateBr(quote.observedOn)} · ${quote.feedMode === 'stale' ? 'Possivelmente desatualizado' : 'Diário, não intradiário'}` : 'Sem dados'}</span></div>
            {quote?.sourceUrl && <a className="source-link" href={quote.sourceUrl} target="_blank" rel="noreferrer">Consultar fonte: {quote.source} <ExternalLink size={12}/></a>}
          </div>
          <div className="center-bottom-grid">
            <div className="stat-panel"><div className="stat-heading"><TrendingUp size={16}/> VARIAÇÃO ENTRE REFERÊNCIAS</div><div className="stat-number">{quote ? <QuoteChange quote={quote} large/> : '—'}</div><p>Comparação entre os dois últimos valores publicados, não variação intradiária.</p></div>
            <div className="stat-panel"><div className="stat-heading"><Globe2 size={16}/> SEGUNDO INDICADOR</div><div className="stat-side"><strong>{otherQuote?.symbol === 'IBOV' ? 'IBOV' : otherQuote ? 'USD/BRL' : '—'}</strong>{otherQuote && <QuoteChange quote={otherQuote}/>}</div><p>{otherQuote ? `Fechamento/ref. ${dateBr(otherQuote.observedOn)}` : 'Outra fonte temporariamente indisponível.'}</p></div>
          </div>
        </section>

        <aside className="right-column" aria-label="Radar de ações">
          <div className="section-title"><span><Activity size={14}/> RADAR DE AÇÕES</span><span>02 / 03</span></div>
          <div className="movers-panel"><div className="panel-tabs"><span>Maiores variações</span><span className="tiny-chip">AGUARDANDO FONTE</span></div>
            {visibleStocks.length ? <><div className="movers-title"><ArrowUpRight size={15}/> ALTAS</div>{winners.map(stock => <div className="mover-row" key={stock.ticker}><div><strong>{stock.ticker}</strong><span>{stock.name}</span></div><span className="positive">{formatPercent(stock.changePercent)}</span></div>)}<div className="movers-title down"><ArrowDownRight size={15}/> BAIXAS</div>{losers.map(stock => <div className="mover-row" key={stock.ticker}><div><strong>{stock.ticker}</strong><span>{stock.name}</span></div><span className="negative">{formatPercent(stock.changePercent)}</span></div>)}</> : <div className="movers-empty"><Info size={18}/><strong>Sem ações em tempo real</strong><p>Este radar só será ativado quando houver fonte com autorização de exibição pública. Nenhuma alta ou baixa fictícia será mostrada.</p></div>}
          </div>
          <div className="sponsor-panel"><span>ESPAÇO PUBLICITÁRIO</span><div className="sponsor-inner"><span className="sponsor-icon">◇</span><strong>Sua marca aqui</strong><small>Área reservada para futuro patrocínio identificado.</small></div></div>
        </aside>
      </div>
      <section className="watchlist-section" aria-label="Lista de ativos"><div className="watchlist-heading"><div><span className="eyebrow">ACOMPANHAMENTO</span><h2>Ativos em destaque</h2></div>{!broadcast && <div className="search-field"><Search size={16}/><input aria-label="Buscar ativo" placeholder="Buscar ativo..." value={filter} onChange={e => setFilter(e.target.value)} /></div>}</div>
        <div className="stock-grid">{visibleStocks.length ? visibleStocks.map(stock => <div key={stock.ticker} className="stock-item"><span className="stock-initial">{stock.ticker.slice(0, 2)}</span><span className="stock-info"><strong>{stock.ticker}</strong><small>{stock.name}</small></span><span className={stock.changePercent >= 0 ? 'positive' : 'negative'}>{formatPercent(stock.changePercent)}</span></div>) : <div className="no-results">Ainda sem feed autorizado de ações individuais. {filter && 'Nenhum resultado disponível para a busca.'}</div>}</div>
      </section>
      </>}
    </main>
    <footer className="footer" id="sobre"><div><span className="footer-logo"><Activity size={15}/> MERCADO AO VIVO</span><span>BCB PTAX diária · Ipeadata IBOV D−1 · sem cotações intradiárias</span></div><div><span>Informativo, não recomendação de investimento</span>{!broadcast && <a href="/broadcast">Abrir tela de transmissão <ExternalLink size={13}/></a>}{broadcast && <a href="/">Voltar ao site <ChevronDown size={13}/></a>}</div></footer>
  </div>;
}
