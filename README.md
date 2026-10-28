# Mercado ao Vivo

MVP de dashboard financeiro com uma identidade HUD original para **site público** e futura **transmissão 24h**. Projeto inicial em React, TypeScript e Vite.

> **IMPORTANTE:** esta versão usa **somente dados fictícios de demonstração**, não cotação atual, não é ferramenta de investimento nem feed financeiro licenciado. Os números existem para validar layout, responsividade e contratos de integração.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra a URL exibida pelo Vite. Acesse `/broadcast` para o modo de transmissão em tela cheia (o mesmo dashboard, com componentes de navegação reduzidos).

## Qualidade

```bash
npm run typecheck
npm test
npm run build
```

O workflow `Dashboard CI` executa essas validações em pull requests.

## Estrutura

- `src/components/MarketChart.tsx`: gráficos com Lightweight Charts.
- `src/data/marketTypes.ts`: contrato do provedor, sem acoplamento a nenhuma API.
- `src/data/mockMarket.ts`: dados fictícios, marcados como demonstração.
- `src/data/marketMath.ts`: cálculos de variação, limites e formatação.
- `src/App.tsx`: tela do site e modo broadcast.
- `docs/ROADMAP.md`: integração de dados, persistência, retenção e monetização.

## Market data e licenças

Antes de colocar preços reais numa página pública ou transmissão monetizada, confirmar: titularidade, limites de chamadas, licenças de exibição e **redistribuição**, atraso e atribuições. Nunca expor credenciais de fornecedores no navegador.

Esta aplicação não oferece apostas, intermediação financeira ou recomendações de investimento.
