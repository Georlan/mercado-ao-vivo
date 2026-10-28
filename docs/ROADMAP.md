# Roadmap — Mercado ao Vivo

## Concluído

1. HUD responsivo, site e modo `/broadcast`.
2. Agregador de **dados de referência diários**: BCB PTAX venda (SGS 1) e Ibovespa de fechamento D−1 (Ipeadata); origem e data visíveis; sem fallback fictício.
3. Atualização a cada 5 minutos, isolamento de falhas por fonte, testes de parsing e CI.

## Próximas entregas

1. **Homologação manual dos feeds:** com o ambiente online, verificar CORS/back-end, disponibilidade e horário efetivo das publicações. Validar estabilidade em 24h, feriados e mudanças do formato Ipeadata; monitorar 429 e timeouts. Não alegar tempo real.
2. **Licenças:** confirmar termos do Ipeadata e de eventuais agregadores antes de publicar dados em site monetizado ou live. Para intradiário do Ibovespa, negociar fonte devidamente licenciada; nunca coletar automaticamente páginas públicas da B3.
3. **Infraestrutura:** cache compartilhado, logs sem credenciais, limites de upstream, avisos de indisponibilidade, alerta de série vencida e deploy HTTPS.
4. **Retenção:** páginas individuais, SEO, favoritos, alertas opt-in e métricas privativas.
5. **Comunidade:** previsões **gratuitas, sem apostas/prêmios monetários**, regras auditáveis, autenticação e banco PostgreSQL quando necessário.
6. **Live:** OBS Browser Source em `/broadcast`, watchdog e avaliação das regras de monetização do YouTube.
7. **Receita:** patrocínios identificados, anúncios e serviços premium após comprovar audiência e autorização de dados.

## Regras de integridade

- Nunca representar PTAX ou fechamento IBOV D−1 como cotação em tempo real.
- Mostrar **data de referência**; não inventar timestamps de publicação.
- Não mostrar ticker/alta/baixa de ativos sem fonte autorizada.
- Falha de API = indisponível, jamais dados demonstrativos se passando por atuais.
- Nenhum segredo no GitHub público; CI verde antes de merge.
