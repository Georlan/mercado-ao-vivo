# Roadmap de produto

1. **MVP visual (este PR):** HUD responsivo, modo 16:9 `/broadcast`, estados de cotação, provider isolado, dados demonstrativos explícitos.
2. **Viabilidade de market data:** testar fontes de USD/BRL e IBOV; obter autorização explícita para exibição pública, distribuição e monetização; documentar atrasos e termos. Não inserir chaves no front-end.
3. **Back-end:** FastAPI com contratos versionados, agregação, cache, timestamps de origem, sinalização de falhas e limites de taxa; dados compartilhados para site e transmissão.
4. **Site e retenção:** páginas por ativo, SEO, navegação, alertas opt-in e métricas respeitando privacidade.
5. **Contas e persistência:** PostgreSQL quando usuários, watchlist e previsões gratuitas precisarem de histórico, rate limit e prevenção de fraude. Sem apostar dinheiro nem criar plataforma de jogos de azar.
6. **Live 24h:** testar browser source do OBS, disponibilidade, uso de CPU, quedas de rede, watchdog, grafismo de dados atrasados e regras do YouTube.
7. **Monetização:** patrocínio identificado no site, depois acordos publicitários e serviços premium conforme tráfego. Revisar licenças de dados e políticas da plataforma.

## Princípios inegociáveis

- Mostrar fonte, horário de atualização e atraso efetivo de cada ativo.
- Não apresentar DEMO como cotação real; não interpolar preços para simular ticks.
- Não manter a palavra “AO VIVO” junto de dados indisponíveis ou atrasados sem identificação.
- Nenhum segredo, token ou credencial no repositório público.
- Gates de CI verdes antes de merge, inclusive sem testes destrutivos em produção.
