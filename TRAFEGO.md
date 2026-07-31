# Plano de tráfego — PropostaZap

Estratégia: **zero verba de mídia**. Todo o crescimento vem de conteúdo indexável e de
distribuição orgânica. Anúncio pago fica de fora por decisão, não por limitação.

## A tese

Prestador de serviço não pesquisa “software de orçamento”. Ele pesquisa
**“modelo de orçamento para pedreiro”**, **“como fazer orçamento de pintura”**,
**“quanto cobrar por m² de forro”**. São buscas de intenção altíssima, volume distribuído
em cauda longa e concorrência fraca — a maioria dos resultados hoje é planilha em Excel e
PDF genérico.

O site responde exatamente essa busca e entrega a ferramenta na mesma página. O visitante
não precisa se cadastrar para ter valor: cria o orçamento, envia pelo WhatsApp, e o link
que ele manda carrega a assinatura “Feito com PropostaZap” — cada orçamento enviado vira
uma impressão de marca para um cliente final.

## O que já está feito e no ar

| Item | Situação |
|---|---|
| 39 páginas de profissão com conteúdo próprio, tabela de preços e FAQ | no ar |
| Cobrança por PIX ligada no app, com licença assinada | no ar (falta a chave PIX) |
| Índice de modelos agrupado por categoria | no ar |
| `sitemap.xml` com 43 URLs | no ar |
| `robots.txt` | no ar |
| URL canônica em toda página | no ar |
| Dados estruturados `FAQPage` e `BreadcrumbList` | no ar |
| Open Graph e Twitter Card (prévia ao compartilhar) | no ar |
| Página de preços indexável, com `schema.org/Product` | no ar |
| Submissão ao IndexNow — Bing, Yandex e parceiros | **enviado: 43 URLs, aceito** |
| Google Search Console — propriedade verificada (arquivo HTML) | **feito em 31/07/2026** |
| Sitemap enviado ao Google | enviado; primeira leitura ainda na fila |
| Indexação prioritária pedida para 7 URLs | **feito** |
| Home indexada no Google | **confirmado** |
| Loop de marca: link enviado ao cliente exibe a assinatura | no ar |

Reenviar a qualquer momento, depois de publicar páginas novas:

```bash
bun run indexnow
```

## Estado da indexação no Google

Propriedade verificada em 31/07/2026 pelo método de arquivo HTML
(`public/google70877a97f710bc89.html` — **não apague**, remover tira a verificação).

Indexação prioritária já solicitada para: home, `/precos/`, `/modelos/`, e as páginas de
`eletricista`, `pedreiro`, `pintor`, `diarista` e `encanador`. A home **já aparece como
indexada**; as demais estão na fila de rastreamento.

O sitemap consta como “não foi possível buscar”. Isso é o estado que o Google mostra antes
da primeira leitura — a coluna “Última leitura” está vazia, ou seja, ele ainda nem tentou.
Do lado do site está tudo correto e verificado: HTTP 200, `content-type: application/xml`,
XML válido com 43 URLs, todas dentro do escopo da propriedade, e o Googlebot recebe 200.
Costuma resolver sozinho em algumas horas. Se em uma semana continuar assim, reenvie.

## O que depende de você (não consigo fazer sozinho)

Cada item exige login na sua conta — nenhum custa dinheiro.

1. **Publicar as campanhas.** Material pronto em `CAMPANHAS.md`. Postar em grupo exige
   suas contas, e postagem em comunidade é coisa que, feita errada, queima o perfil — por
   isso não faço no automático.

2. **Bing Webmaster Tools** — https://www.bing.com/webmasters
   Importa do Search Console em um clique. Opcional: o IndexNow já alimenta o Bing.

3. **Perfil da Empresa no Google** — se você atende uma região, o perfil aparece no mapa e
   é o canal orgânico de maior conversão para serviço local.

## Sequência recomendada nas primeiras semanas

**Semana 1 — indexação.** Search Console e Bing configurados. Peça indexação manual das 5
páginas de profissão mais buscadas (pedreiro, eletricista, pintor, encanador, diarista).

**Semana 2 — distribuição direta.** Grupos de WhatsApp, Facebook e Telegram de prestadores
por categoria. A postagem que funciona não é anúncio: é a ferramenta como resposta a uma
dúvida real (“quanto cobro por isso?”), com o link da página da profissão daquele grupo —
nunca a home.

**Semana 3 — prova.** Peça a 5 usuários reais um print do orçamento que eles enviaram.
Depoimento de prestador com nome e profissão converte mais que qualquer texto de vendas.

**Semana 4 — cauda longa.** Cada profissão nova é uma página nova. Adicione ao array em
`src/lib/professions.ts`, rode `bun run build` e `bun run indexnow`. Custo marginal por
página: zero.

## Material pronto para publicar

Calendário de 4 semanas, textos por canal, roteiros de vídeo curto e respostas para as
objeções mais comuns: [`CAMPANHAS.md`](./CAMPANHAS.md).

## Modelos de postagem prontos

**Grupo de WhatsApp de prestadores**
> Fiz uma ferramenta que monta orçamento e já mostra quanto sobra pra você depois do custo.
> Grátis, não precisa cadastrar. Escolhe a profissão e os serviços já vêm preenchidos:
> https://esdrasgomes547-maker.github.io/propostazap/

**Grupo de Facebook por categoria** (trocar a URL pela página da profissão do grupo)
> Vi bastante gente aqui perguntando quanto cobrar. Montei uma página com os serviços mais
> pedidos de [profissão] e faixa de preço de referência, e dá pra gerar o orçamento na hora
> e mandar pro cliente pelo WhatsApp. Sem cadastro:
> https://esdrasgomes547-maker.github.io/propostazap/modelo-de-orcamento/[profissao]/

**Resposta a “quanto devo cobrar?”**
> Depende da sua região e do seu custo, mas essa página tem a faixa de referência de
> mercado dos serviços de [profissão] e monta o orçamento já calculando sua margem:
> [link da profissão]

Regra que vale mais que qualquer modelo: **poste a resposta, não o produto.** Divulgação
direta em grupo de profissional é ignorada ou apagada; resposta útil com link fica.

## Métricas que importam

Sem analytics instalado — de propósito, para não quebrar a CSP nem rastrear ninguém. O que
observar no Search Console: impressões por página de profissão (mostra qual cauda pega),
CTR (mostra se o título vende) e posição média. As páginas que subirem primeiro indicam
onde vale escrever mais.

## Cobrança

Já está ligada: PIX direto, sem gateway e sem taxa por transação, com licença assinada
criptograficamente (ver `README.md` e `SECURITY.md`). Falta apenas preencher
`VITE_PIX_CHAVE` e `VITE_WHATSAPP_SUPORTE` no `.env` e rebuildar — enquanto isso o app não
oferece compra, só ativação de código.

Ordem que funciona: **não divulgue o Pro no começo**. Quem compra é quem bate no limite de
5 por mês. Divulgar preço antes de existir uso é queimar a única chance de conversão.
