# PropostaZap

Orçamentos profissionais em 2 minutos, direto do celular, para prestadores de serviço.

Prestador autônomo perde dinheiro mandando preço solto no WhatsApp: sem itens
detalhados, a conversa vira comparação de número contra número. O PropostaZap monta a
proposta completa — itens, prazo, garantia, validade e condições de pagamento — e ainda
mostra o **lucro real** antes de o preço ser enviado.

## Como funciona

Não há servidor. O app inteiro roda no navegador, os dados ficam no aparelho do usuário e
o orçamento é compartilhado por um link que **carrega o próprio documento dentro da URL**
(comprimido com `deflate-raw` e codificado em base64url, no fragmento).

Isso significa: zero custo de infraestrutura, zero cadastro, zero dado de cliente
trafegando por servidor nosso — e nenhuma chave de API exposta, porque não há nenhuma.

## Rodando

```bash
bun install
bun run dev        # desenvolvimento
bun run test       # 99 testes
bun run typecheck  # checagem de tipos
bun run build      # dist/ com o app + 41 páginas estáticas
```

## Estrutura

```
src/lib/     domínio puro e testado — dinheiro, cálculo, saneamento, link, armazenamento
src/ui/      telas React
scripts/     gerador das páginas estáticas de SEO
```

Regras que valem a pena conhecer antes de mexer:

- **Dinheiro nunca é float.** Valores são inteiros em centavos, quantidades são inteiros
  em milésimos de unidade. `money.ts` faz a conversão a partir do texto digitado,
  resolvendo a ambiguidade entre `1.234` (milhar) e `1234.56` (decimal).
- **Todo dado que vem de fora passa por `validate.ts`.** Link público, backup importado e
  `localStorage` são igualmente não confiáveis.
- **Saneamento é segurança, não formatação.** Aparar espaço e validar formato de e-mail no
  caminho de escrita quebra a digitação — ver `SECURITY.md`, achado A-3.

## SEO

`scripts/build-seo.mjs` gera HTML estático de verdade: uma página por profissão
(`/modelo-de-orcamento/eletricista/`), o índice de modelos, a home, `sitemap.xml` e
`robots.txt`. Cada página traz conteúdo próprio, tabela de faixas de preço, FAQ com
`schema.org/FAQPage` e um botão que abre o app já com o modelo daquela profissão.

Uma SPA com rota em hash não é indexável; por isso o site de conteúdo é estático e o app
vive em `/app/`.

## Segurança

Auditoria completa, achados e riscos residuais em [`SECURITY.md`](./SECURITY.md).

## Situação

MVP funcional. O plano Pro ainda não tem cobrança ligada — isso exige backend para validar
assinatura, e está descrito como risco residual R-2 na auditoria.
