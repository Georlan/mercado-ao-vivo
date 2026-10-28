import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, CalendarDays, Clock3,
  ExternalLink, Info, Maximize2, RefreshCw, Radio,
} from 'lucide-react';
import { MarketChart } from './components/MarketChart';
import { officialMarketProvider } from './data/officialMarket';
import { formatPercent, formatValue, percentageChange } from './data/marketMath';
import type { MarketQuote, MarketSnapshot, SymbolId } from './data/marketTypes';

const periods = ['5D', '1M', '3M', '6M', '1A'] as const;
type Period = typeof periods[number];

const instruments: Array<{ symbol: SymbolId; short: string; name: string }> = [
  { symbol: 'USDBRL', short: 'USD / BRL', name: 'Dólar PTAX (venda)' },
  { symbol: 'IBOV', short: 'IBOV', name: 'Ibovespa · fechamento' },
];

function dateBr(iso: string | null | undefined): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '—';
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

function QuoteChange({ quote, large = false }: { quote: MarketQuote; large?: boolean }) {
  const change = percentageChange(quote.value, quote.previousClose);
  if (change === null) return <span className="change change-neutral">—</span>;
  const direction = change > 0 ? 'positive' : change < 0 ? 'negative' : 'change-neutral';
  return <span className={`change ${direction} ${large ? 'change-large' : ''}`}>
    {change > 0 && <ArrowUpRight size={large ? 18 : 15} aria-hidden="true" />}
    {change < 0 && <ArrowDownRight size={large ? 18 : 15} aria-hidden="true" />}
    {formatPercent(change)}
  </span>;
}

function QuoteCard({ symbol, quote, selected, onSelect }: {
  symbol: SymbolId; quote?: MarketQuote; selected: boolean; onSelect: () => void;
}) {
  const info = instruments.find(item => item.symbol === symbol)!;
  return <button className={`quote-card ${selected ? 'quote-card-active' : ''}`} onClick={onSelect} aria-pressed={selected}>
    <span className="quote-topline"><span className="quote-symbol">{info.short}</span><span className="quote-select">{selected ? 'Em foco' : 'Ver gráfico'}</span></span>
    <span className="quote-label">{info.name}</span>
    {quote ? <>
      <span className="quote-number">{quote.currency === 'BRL' && <small>R$</small>}{formatValue(quote.value, quote.currency)}</span>
      <span className="quote-footer"><QuoteChange quote={quote} /><span>vs. referência anterior</span></span>
      <span className="quote-reference"><CalendarDays size={13} /> Referência: {dateBr(quote.observedOn)}{quote.feedMode === 'stale' ? ' · Desatualizada' : ''}</span>
    </> : <span className="quote-unavailable">Indisponível <small>Sem dados nesta fonte</small></span>}
  </button>;
}

function Clock() {
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setClock(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  return <span className="clock-label"><Clock3 size={14} aria-hidden="true" />{new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(clock)} <span className="time-zone">Brasília</span></span>;
}

function periodPoints(quote: MarketQuote, period: Period) {
  if (period === '5D') return quote.series.slice(-5);
  const days = ({ '1M': 30, '3M': 90, '6M': 180, '1A': 365 } as const)[period];
  const latest = quote.series[quote.series.length - 1]?.time ?? 0;
  return quote.series.filter(point => point.time >= latest - days * 86_400);
}

export default function App() {
  const broadcast = window.location.pathname === '/broadcast';
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [failure, setFailure] = useState(false);
  const [busy, setBusy] = useState(false);
  const [symbol, setSymbol] = useState<SymbolId>('USDBRL');
  const [period, setPeriod] = useState<Period>('1M');
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey(value => value + 1), []);

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

  const quote = snapshot?.quotes[symbol];
  const points = useMemo(() => quote ? periodPoints(quote, period) : [], [quote, period]);
  // A cor da linha representa a tendência da janela selecionada, não a variação do último dia.
  const quotePositive = points.length > 1 ? points[points.length - 1].value >= points[0].value : true;
  const checked = snapshot?.checkedAt ? new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit',
  }).format(new Date(snapshot.checkedAt)) : '—';
  const available = Boolean(snapshot?.quotes.USDBRL || snapshot?.quotes.IBOV);

  return <div className={`app ${broadcast ? 'app-broadcast' : ''}`}>
    <header className="header">
      <a className="brand" href="/" aria-label="Mercado ao Vivo — início">
        <img className="brand-mark" src="/assets/brand/market-mark.svg" width="42" height="42" alt="" />
        <span className="brand-lockup"><strong>mercado<span>ao vivo</span></strong><small>DADOS DE MERCADO</small></span>
      </a>
      {!broadcast && <nav className="navigation" aria-label="Navegação principal">
        <a href="#painel">Painel</a><a href="#ativos">Ativos</a><a href="#sobre">Fontes e metodologia</a>
      </nav>}
      <div className="header-actions"><Clock />
        {!broadcast ? <a className="broadcast-link" href="/broadcast"><Maximize2 size={15} /> Transmissão <ArrowRight size={14} /></a>
          : <span className="broadcast-mode-label"><Radio size={14} /> Modo transmissão</span>}
      </div>
    </header>

    <div className="data-banner" role="note"><Info size={14} /><span><strong>Dados de referência</strong> — PTAX diária e fechamento IBOV D−1. Não representam cotações intradiárias em tempo real.</span></div>

    <main className="main" id="painel">
      <div className="headline-row">
        <div className="headline-copy"><span className="eyebrow">MERCADOS · BRASIL</span><h1>Dólar e Ibovespa</h1>
          <p>Séries públicas, com origem e data de referência identificadas.</p></div>
        <div className="headline-right"><span className={`status-pill ${failure ? 'status-error' : ''}`}><span className="status-indicator" />{failure ? 'Falha na consulta' : available ? 'Referências diárias' : 'Aguardando fontes'}</span>
          <span className="headline-time">Consultado às {checked} · horário de Brasília</span></div>
      </div>

      <div className="market-toolbar"><span>{failure ? 'Não foi possível renovar a consulta. Verifique as datas antes de utilizar os valores.' : 'Consulta periódica a cada 5 minutos; os valores mudam apenas quando publicados.'}</span>
        {!broadcast && <button type="button" onClick={refresh} disabled={busy}><RefreshCw size={15} className={busy ? 'spin' : ''} />{busy ? 'Consultando' : 'Atualizar dados'}</button>}
      </div>

      {!snapshot && !failure && <div className="loading-panel" role="status">Consultando fontes…</div>}
      {failure && <div className="source-error" role="alert">Falha ao consultar as fontes. {available ? 'Os dados abaixo podem estar desatualizados.' : 'Nenhuma cotação será substituída por valores simulados.'}</div>}

      <div className="dashboard-grid">
        <section className="left-column" aria-label="Indicadores principais">
          <h2 className="section-title">Indicadores</h2>
          {instruments.map(item => <QuoteCard key={item.symbol} symbol={item.symbol} quote={snapshot?.quotes[item.symbol]} selected={symbol === item.symbol} onSelect={() => setSymbol(item.symbol)} />)}
          <p className="left-note">Selecione um indicador para consultar sua série histórica.</p>
        </section>

        <section className="center-column" aria-label="Gráfico principal">
          <div className="chart-panel">
            <div className="chart-top"><div><span className="chart-kicker">SÉRIE HISTÓRICA</span><h2>{symbol === 'USDBRL' ? 'Dólar PTAX (venda)' : 'Ibovespa (fechamento)'}</h2></div>
              <span className="chart-source">{quote?.source ?? 'Fonte indisponível'}</span></div>
            <div className="chart-value-row">
              <strong>{quote ? `${quote.currency === 'BRL' ? 'R$ ' : ''}${formatValue(quote.value, quote.currency)}` : '—'}</strong>
              {quote && <QuoteChange quote={quote} large />}
              {quote && <span className="chart-value-note">em relação à referência anterior</span>}
            </div>
            <div className="period-selector" role="group" aria-label="Período do histórico">
              {periods.map(p => <button key={p} onClick={() => setPeriod(p)} className={period === p ? 'period-active' : ''} aria-pressed={period === p}>{p}</button>)}
              <span className="period-note">Observações diárias</span>
            </div>
            <div className="main-chart">{quote && points.length ? <MarketChart points={points} positive={quotePositive} label={`Histórico diário de ${quote.title}, referência ${dateBr(quote.observedOn)}`} />
              : <div className="empty-chart"><img src="/assets/states/data-unavailable.svg" width="180" height="90" alt="" /><strong>Histórico indisponível</strong><span>Selecione outra fonte ou tente atualizar.</span></div>}</div>
            <div className="chart-bottom"><span>{quote ? `Referência ${dateBr(quote.observedOn)}${quote.feedMode === 'stale' ? ' · Série possivelmente desatualizada' : ''}` : 'Sem dados para este indicador'}</span>
              {quote?.sourceUrl && <a className="source-link" href={quote.sourceUrl} target="_blank" rel="noreferrer">Ver fonte <ExternalLink size={13}/></a>}</div>
          </div>
        </section>

        <aside className="right-column" aria-label="Cobertura de mercado">
          <h2 className="section-title">Cobertura</h2>
          <div className="coverage-panel">
            <div className="coverage-row"><div><strong>USD/BRL</strong><span>Banco Central · PTAX</span></div><span className={`coverage-status ${snapshot?.quotes.USDBRL ? '' : 'coverage-off'}`}>{snapshot?.quotes.USDBRL ? 'Disponível' : 'Indisponível'}</span></div>
            <div className="coverage-row"><div><strong>Ibovespa</strong><span>Ipeadata · D−1</span></div><span className={`coverage-status ${snapshot?.quotes.IBOV ? '' : 'coverage-off'}`}>{snapshot?.quotes.IBOV ? 'Disponível' : 'Indisponível'}</span></div>
            <div className="coverage-row"><div><strong>Ações individuais</strong><span>Aguardando fonte licenciada</span></div><span className="coverage-status coverage-off">Sem cobertura</span></div>
          </div>
          <div className="context-panel"><span className="context-heading">COMO LER O PAINEL</span>
            <p>A PTAX é uma taxa de referência, não o preço para compra de dólar. O Ibovespa disponível aqui é um fechamento histórico, não uma cotação intradiária.</p>
          </div>
        </aside>
      </div>

      {!broadcast && <>
        <section className="assets-section" id="ativos"><div><span className="eyebrow">COBERTURA EM EVOLUÇÃO</span><h2>Ações brasileiras</h2><p>O radar de ações será disponibilizado quando houver uma fonte que permita exibição pública. Não exibimos altas e baixas fictícias.</p></div><span className="assets-state">Ainda não disponível</span></section>
        <section className="method-section" id="sobre"><div><h2>Fontes e metodologia</h2><p>A interface verifica as publicações periodicamente. O horário da consulta não é o horário da cotação.</p></div><div className="method-details"><p><strong>USD/BRL:</strong> série 1 do Banco Central, dólar PTAX de venda.</p><p><strong>IBOV:</strong> série histórica diária do Ipeadata (origem B3), apenas fechamentos anteriores à data atual.</p></div></section>
      </>}
    </main>
    <footer className="footer"><span>© Mercado ao Vivo · Informação, não recomendação de investimento</span><div><span>Fontes: Banco Central e Ipeadata</span>{broadcast && <a href="/">Voltar ao site <ArrowRight size={13} /></a>}</div></footer>
  </div>;
}
