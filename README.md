# Orça no ZAP

Orçamentos profissionais em 2 minutos, direto do celular, para prestadores de serviço.

Prestador autônomo perde dinheiro mandando preço solto no WhatsApp: sem itens
detalhados, a conversa vira comparação de número contra número. O Orça no ZAP monta a
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
bun run test       # 130 testes
bun run typecheck  # checagem de tipos
bun run build      # dist/ com o app + 42 páginas estáticas
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

## Deploy

Automático: todo push em `master` dispara `.github/workflows/deploy.yml`, que roda
typecheck e testes, builda e publica na branch `gh-pages`. Testes vermelhos não vão ao ar.

A configuração de cobrança vive em **variáveis do repositório** (Settings › Secrets and
variables › Actions › Variables), não em secrets: esses valores viajam no bundle e no
código PIX que o cliente lê, então tratá-los como segredo seria mentira. Para mudar preço
de canal de atendimento ou chave PIX, altere a variável e empurre qualquer commit.

| Variável | Uso |
|---|---|
| `VITE_PIX_CHAVE` | chave que recebe as assinaturas |
| `VITE_PIX_NOME` | nome do recebedor no app do banco (máx. 25, sem acento) |
| `VITE_PIX_CIDADE` | cidade do recebedor (máx. 15, sem acento) |
| `VITE_WHATSAPP_SUPORTE` | número que recebe o comprovante |

O workflow falha de propósito se a chave PIX estiver configurada mas não aparecer no
bundle, ou se o arquivo de verificação do Search Console sumir do build — os dois erros
seriam silenciosos e caros.

## Segurança

Auditoria completa, achados e riscos residuais em [`SECURITY.md`](./SECURITY.md).

## Cobrança

Plano Pro pago por PIX, sem gateway e sem taxa por transação:

1. O cliente copia o código PIX na tela de assinatura e paga no app do banco.
2. Manda o comprovante pelo WhatsApp.
3. Você confirma o PIX na conta e emite a licença:

```bash
node scripts/emitir-licenca.mjs --nome "Eletrica Silva" --meses 12 --id pix-4417
```

O comando imprime a mensagem pronta para enviar e registra a emissão em
`chaves/licencas-emitidas.csv`. O cliente cola o código no app e o Pro libera na hora.

A licença é assinada com ECDSA P-256. O app carrega apenas a chave pública, então não há
como forjar. **A chave privada em `chaves/licenca-privada.json` é o negócio**: está fora do
git, faça backup offline. Perdê-la impede novas emissões.

Antes do primeiro build com cobrança, copie `.env.example` para `.env` e preencha
`VITE_PIX_CHAVE` e `VITE_WHATSAPP_SUPORTE`. Sem isso a tela avisa que a cobrança não está
configurada, em vez de mostrar um código que não cai em conta nenhuma.

## Situação

MVP funcional e no ar, com cobrança por PIX operando de forma manual (você confirma o
pagamento e emite a licença). Automatizar exigiria gateway com taxa ou backend próprio.
