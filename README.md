# Mercado ao Vivo

Site de referência financeira em React, TypeScript e Vite com HUD próprio e rota `/broadcast` para futura transmissão. **O feed oficial inicial é DIÁRIO, não intradiário**; o nome do projeto não representa promessa de cotações segundo a segundo.

## Rodar localmente

```bash
npm install
npm run dev
```

- `/`: site responsivo.
- `/broadcast`: layout adaptado para fonte de navegador do OBS.
- `/api/market`: JSON agregando referências oficiais, com cache de até 5 minutos no servidor aquecido.
- Vite monta a rota de API durante `npm run dev`, sem tokens nem banco de dados.

## Fontes integradas nesta fase

| Ativo | Origem | Representa | Atualização |
|---|---|---|---|
| USD/BRL | BCB, SGS série 1 | Dólar PTAX (venda), valor de referência | Observações diárias publicadas pelo BCB |
| IBOV | Ipeadata `GM366_IBVSP366` (dados de origem B3) | Ibovespa, último fechamento **anterior ao dia atual** (D−1) | Observações históricas conforme publicação do Ipeadata, não intradiárias |
| Ações individuais | Sem fonte contratada | Não aparecem no radar | Não aplicável |

As datas exibidas são datas **de referência**, não timestamps de atualização da API nem cotação tick-a-tick. A tela verifica novas publicações a cada 5 minutos, mas isso **não faz o preço variar a cada 5 minutos**. O backend busca dados de cada fonte independentemente; em caso de falha, o ativo fica indisponível, sem valores fictícios de fallback. Não existe recomendação de investimento.

### Direitos de uso

- [BCB — série de cotação](https://dadosabertos.bcb.gov.br/dataset/1-taxa-de-cambio---livre---dolar-americano-venda---diario) e [licença de dados abertos](https://dadosabertos.bcb.gov.br/pages/perguntas-frequentes): dados públicos de referência, conforme termos próprios.
- [Ipeadata](https://www.ipeadata.gov.br/): série histórica diária de origem B3. Apenas registros anteriores à data corrente de São Paulo são exibidos. [FAQ B3](https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/distribuidores/perguntas-frequentes/) descreve as condições para dados de fim de dia e D−1; confirmar eventuais obrigações adicionais do fornecedor antes de monetizar a redistribuição.
- Não usar scraping de páginas públicas da B3: elas proíbem coleta automatizada. Não usar dados de brapi/TradingView como feed público sem contrato pertinente.

**Atenção: APIs públicas externas podem falhar, bloquear tráfego automatizado ou mudar o contrato. A conectividade ponta a ponta depende do ambiente de execução.**

## Deploy

- Cloudflare Pages: build `npm run build`, saída `dist`, com Pages Functions em `functions/api/market.ts`.
- Caso hospede apenas `dist` em serviço estático, **`/api/market` não existirá**. É preciso adaptar a rota de backend ou usar Cloudflare Pages Functions.
- Cache em memória é por instância e não durável. Antes de aumentar o tráfego, usar cache compartilhado/limites de requisição e monitoramento.
- Não colocar tokens, segredos nem chaves em código frontend ou repositório público.

## Testes

```bash
npm run typecheck
npm test
npm run build
```

CI executa os mesmos gates. Os testes das fontes usam respostas locais simuladas para garantir parsing, integridade e falhas. Eles **não comprovam disponibilidade ao vivo** das APIs externas.

## Estrutura

- `src/server/marketService.ts`: agregador e validação dos dados oficiais; isolado de React.
- `functions/api/market.ts`: rota de produção para Cloudflare Pages.
- `vite.config.ts`: expõe a mesma rota para desenvolvimento local.
- `src/data/officialMarket.ts`: cliente da API de mesma origem.
- `src/data/marketTypes.ts`: contratos independentes de fornecedor.
- `src/data/mockMarket.ts`: fixture fictícia preservada apenas para testes ou prototipação, **não utilizada na interface pública**.
- `src/components/MarketChart.tsx`: gráfico histórico com Lightweight Charts.
- `docs/ROADMAP.md`: próximo trabalho e requisitos de licenciamento.
