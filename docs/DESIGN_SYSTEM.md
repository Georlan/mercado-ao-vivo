# Mercado ao Vivo — direção visual (v1)

## Propósito

O gráfico e os números são os protagonistas. A interface deve parecer um instrumento de acompanhamento de fontes, não uma arte de campanha ou um aplicativo de trade que promete preço ao vivo sem tê-lo.

## Ativos independentes

- `public/assets/brand/market-mark.svg`: marca vetorial, arquivo isolado do código React.
- `public/assets/brand/favicon.svg`: versão reduzida e compatível com browser.
- `public/assets/states/data-unavailable.svg`: representação visual discreta da ausência de histórico; nunca exibir um gráfico fictício para preencher lacunas.

Todos podem ser substituídos individualmente, sem alterar a estrutura dos painéis. SVGs são editáveis e servidos como recursos estáticos. Nenhum asset contém preços, textos comerciais ou alegações.

## Linguagem

- Carvão profundo (`#0b1116`), painéis (`#111a20`), linha (`#27353c`), texto (`#e7eceb`).
- Verde suave (`#78c7ab`) e vermelho contido (`#dc8790`) comunicam sinal positivo e negativo, não decoração.
- IBM Plex Sans para texto e IBM Plex Mono para valores; números tabulares.
- Sem gradiente de fundo, brilho ornamental, pseudo-métricas, numeração decorativa, sobreposições holográficas ou cards repetindo a mesma informação.
- Um gráfico central dominante; indicadores à esquerda, cobertura verificável à direita.
- `broadcast` herda componentes e dados, mas ajusta densidade para 16:9. A validação final em OBS precisa ser visual, em 1920×1080, e não apenas build.

## Conteúdo e estados

- Não chamar PTAX diária de preço comercial negociado naquele instante.
- Não chamar IBOV D−1 de tempo real.
- Fonte e data de referência visíveis no painel; horário de consulta não equivale a timestamp da cotação.
- Falhas e ausências nunca recebem valores fabricados.
- Nenhum espaço publicitário vazio deve competir com a informação antes de ter patrocinador real.

## Próximo QA visual

1. Conferir widescreen 1920×1080, desktop 1440, tablet 768 e mobile 390.
2. Verificar legibilidade real da versão broadcast em tela cheia/OBS e contraste do texto secundário.
3. Confirmar que o estado indisponível é bem apresentado quando IBOV falhar ou a API retornar 503.
4. Evoluir ícones e marca apenas se as referências de identidade justificarem; não adicionar assets decorativos.
