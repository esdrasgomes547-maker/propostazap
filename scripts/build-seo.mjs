/**
 * Gera as páginas estáticas do site: home, índice de modelos e uma página por
 * profissão. Elas existem como HTML de verdade no disco — é isso que faz o
 * Google indexar o conteúdo, coisa que uma SPA com rota em hash não consegue.
 *
 * Roda depois do `vite build`, escrevendo dentro de dist/.
 */
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { gerarIcones } from './gerar-icones.mjs';
import { fonteDoServiceWorker } from './service-worker-fonte.mjs';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(RAIZ, 'dist');

// SITE é só a origem (sem caminho); BASE é o prefixo de URL onde o site é servido.
// GitHub Pages de projeto serve em /<repo>/, então os dois se somam na URL —
// mas em disco os arquivos vão na raiz de dist/, sem o prefixo.
/**
 * Origem do site, para URL canônica e sitemap.
 *
 * Na Vercel o domínio só é conhecido depois do projeto criado, então o build
 * lê a variável que ela injeta sozinha. SITE_URL continua tendo prioridade,
 * que é como o GitHub Pages e um domínio próprio entram.
 */
const SITE = (
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://orcanozap.vercel.app')
).replace(/\/$/, '');

/** GitHub Pages de projeto serve em /<repo>/; Vercel e domínio próprio, na raiz. */
const BASE = process.env.BASE_PATH ?? '/';

/** Converte um caminho de URL no caminho de arquivo correspondente dentro de dist/. */
function semBase(caminho) {
  return caminho.startsWith(BASE) ? `/${caminho.slice(BASE.length)}` : caminho;
}

/** Carrega o catálogo TypeScript compilando-o para um módulo temporário. */
async function carregarProfissoes() {
  const saida = join(RAIZ, 'node_modules', '.cache', 'profissoes.mjs');
  await mkdir(dirname(saida), { recursive: true });
  await build({
    entryPoints: [join(RAIZ, 'src/lib/professions.ts')],
    outfile: saida,
    bundle: true,
    format: 'esm',
    platform: 'node',
    logLevel: 'silent',
  });
  return import(`${saida}?t=${Date.now()}`);
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Todo texto vindo do catálogo é escapado antes de virar HTML. */
function esc(valor) {
  return String(valor).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

function reais(centavos) {
  const inteiro = Math.floor(centavos / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${inteiro},${String(centavos % 100).padStart(2, '0')}`;
}

const CSP =
  "default-src 'self'; base-uri 'none'; object-src 'none'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; font-src 'self'; form-action 'none'";

const CSS = `
/* Paleta de bloco de orçamento: papel, régua, tinta.
   A esmeralda é reservada para dinheiro e ação — em nenhum outro lugar. */
:root{
  --papel:#f2f1ec; --via:#fff; --regua:#dad8cf;
  --tinta:#16191c; --tinta-fraca:#6b7076;
  --esmeralda:#047857; --carbono:#c2410c;
  --mono:ui-monospace,'SF Mono','JetBrains Mono',Menlo,Consolas,monospace;
  --sans:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
  --medida:min(100%,72rem);
}
@media (prefers-color-scheme:dark){
  :root{--papel:#13161a;--via:#1a1e24;--regua:#2a2f37;--tinta:#e9e7e2;--tinta-fraca:#98a0aa;--esmeralda:#34d399;--carbono:#f0834f}
}
:root[data-theme='dark']{--papel:#13161a;--via:#1a1e24;--regua:#2a2f37;--tinta:#e9e7e2;--tinta-fraca:#98a0aa;--esmeralda:#34d399;--carbono:#f0834f}
:root[data-theme='light']{--papel:#f2f1ec;--via:#fff;--regua:#dad8cf;--tinta:#16191c;--tinta-fraca:#6b7076;--esmeralda:#047857;--carbono:#c2410c}

*{box-sizing:border-box}
body{margin:0;background:var(--papel);color:var(--tinta);font-family:var(--sans);line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:inherit}
:focus-visible{outline:2px solid var(--esmeralda);outline-offset:3px}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}

.wrap{width:var(--medida);margin:0 auto;padding:0 1.5rem}

/* ---- topo ---- */
.topo{border-bottom:1px solid var(--regua);background:var(--papel);position:sticky;top:0;z-index:20}
.faixa{width:var(--medida);margin:0 auto;padding:.9rem 1.5rem;display:flex;align-items:center;gap:.75rem}
.marca{display:flex;align-items:center;gap:.6rem;text-decoration:none;font-weight:700;letter-spacing:-.02em;font-size:1.02rem}
.marca svg{display:block;flex:none}
.topo .btn{margin-left:auto}

/* ---- botões: retangulares, sem raio grande, sem sombra ---- */
.btn{display:inline-flex;align-items:center;gap:.5rem;background:var(--esmeralda);color:var(--papel);
  text-decoration:none;font-weight:650;font-size:.95rem;padding:.7rem 1.15rem;border-radius:3px;
  border:1px solid var(--esmeralda);transition:opacity .15s}
.btn:hover{opacity:.88}
.btn.vazio{background:transparent;color:var(--tinta);border-color:var(--tinta)}
.btn.pequeno{padding:.5rem .85rem;font-size:.85rem}

.rotulo{font-family:var(--mono);font-size:.68rem;letter-spacing:.18em;text-transform:uppercase;color:var(--tinta-fraca);margin:0}

/* ---- herói assimétrico ---- */
/* Abertura da home: duas colunas, tese à esquerda e a folha à direita. */
.abertura{display:grid;grid-template-columns:1fr;gap:2.5rem;padding:clamp(2.5rem,7vw,5rem) 0 clamp(2rem,5vw,3.5rem)}
@media(min-width:62rem){.abertura{grid-template-columns:1.05fr .95fr;gap:4rem;align-items:center}}
.abertura h1{font-size:clamp(2.1rem,5.4vw,3.5rem);line-height:1.03;letter-spacing:-.035em;font-weight:800;margin:.9rem 0 0;max-width:16ch;text-wrap:balance}
.abertura .sub{font-size:clamp(1rem,1.6vw,1.15rem);color:var(--tinta-fraca);max-width:44ch;margin:1.1rem 0 0}

/* Cabeçalho das páginas internas: uma coluna só. */
.heroi{padding:clamp(1.75rem,4vw,2.75rem) 0 clamp(1.5rem,3vw,2rem)}
.heroi h1{font-size:clamp(1.8rem,4.2vw,2.7rem);line-height:1.06;letter-spacing:-.03em;font-weight:800;margin:.5rem 0 0;max-width:20ch;text-wrap:balance}
.heroi p{color:var(--tinta-fraca);max-width:52ch;margin:.9rem 0 0}
.acoes{display:flex;gap:.6rem;flex-wrap:wrap;margin-top:1.8rem}
.selo{font-family:var(--mono);font-size:.72rem;color:var(--tinta-fraca);margin:1.1rem 0 0;letter-spacing:.02em}

/* ---- a folha do bloco ---- */
.folha{background:var(--via);border:1px solid var(--regua);border-radius:2px;padding:1.5rem 1.35rem 1.25rem;
  box-shadow:0 1px 0 var(--regua),0 12px 28px -22px rgba(0,0,0,.5);position:relative}
.folha::before{content:'';position:absolute;left:0;right:0;top:0;height:3px;background:var(--esmeralda)}
.folha-topo{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;padding-bottom:.9rem;border-bottom:1px solid var(--regua)}
.folha-topo strong{font-size:1rem;letter-spacing:-.01em}
.folha-num{font-family:var(--mono);font-size:.72rem;color:var(--tinta-fraca);text-align:right;line-height:1.5}
.folha table{width:100%;border-collapse:collapse;margin-top:.35rem}
.folha th{font-family:var(--mono);font-size:.6rem;letter-spacing:.14em;text-transform:uppercase;color:var(--tinta-fraca);font-weight:400;text-align:left;padding:.55rem 0 .4rem}
.folha th.n,.folha td.n{text-align:right}
.folha td{padding:.5rem 0;border-bottom:1px solid var(--regua);font-size:.88rem;vertical-align:baseline}
.folha td.n{font-family:var(--mono);font-variant-numeric:tabular-nums;white-space:nowrap}
.folha tbody tr:last-child td{border-bottom:0}
.folha-total{display:flex;justify-content:space-between;align-items:baseline;gap:1rem;margin-top:.9rem;padding-top:.85rem;border-top:2px solid var(--tinta)}
.folha-total span{font-family:var(--mono);font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;color:var(--tinta-fraca)}
.folha-total b{font-family:var(--mono);font-size:clamp(1.5rem,3.4vw,1.9rem);font-variant-numeric:tabular-nums;color:var(--esmeralda);letter-spacing:-.03em}
.folha-pe{display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-top:1rem;font-family:var(--mono);font-size:.66rem;color:var(--tinta-fraca)}
.carimbo{border:1.5px solid var(--esmeralda);color:var(--esmeralda);font-family:var(--mono);font-size:.62rem;
  letter-spacing:.14em;text-transform:uppercase;padding:.3rem .6rem;transform:rotate(-4deg);white-space:nowrap}

/* ---- seções separadas por régua, sem cartão ---- */
section{border-top:1px solid var(--regua);padding:clamp(2.5rem,6vw,4rem) 0}
h2{font-size:clamp(1.45rem,3vw,2rem);letter-spacing:-.025em;margin:.6rem 0 0;font-weight:800;text-wrap:balance;max-width:20ch}
.sub{color:var(--tinta-fraca);margin:.7rem 0 0;max-width:52ch}

.linhas{margin:2rem 0 0;display:grid;gap:0}
.linhas > div{display:grid;grid-template-columns:1fr;gap:.3rem;padding:1.35rem 0;border-top:1px solid var(--regua)}
@media(min-width:52rem){.linhas > div{grid-template-columns:auto 1fr;gap:2rem;align-items:baseline}}
.linhas > div:first-child{border-top:0}
.linhas h3{margin:0;font-size:1.02rem;letter-spacing:-.01em;min-width:12rem}
.linhas p{margin:0;color:var(--tinta-fraca);font-size:.96rem;max-width:56ch}

/* comparação: o jeito velho contra o novo */
.contraste{display:grid;gap:1.25rem;margin-top:2rem}
@media(min-width:48rem){.contraste{grid-template-columns:1fr 1fr;gap:2.5rem}}
.contraste > div{border-top:2px solid var(--regua);padding-top:1rem}
.contraste > div.certo{border-top-color:var(--esmeralda)}
.contraste .rotulo{margin-bottom:.6rem}
.contraste .zap{background:var(--via);border:1px solid var(--regua);border-radius:2px;padding:.7rem .9rem;font-size:.92rem;max-width:22rem}
.contraste .zap.dele{border-left:3px solid var(--carbono)}
.contraste p{color:var(--tinta-fraca);font-size:.92rem;margin:.8rem 0 0;max-width:38ch}

/* profissões */
.lista{display:grid;gap:0;grid-template-columns:repeat(auto-fill,minmax(15rem,1fr));padding:0;list-style:none;margin:1.8rem 0 0;border-top:1px solid var(--regua)}
.lista a{display:block;padding:.85rem .2rem;border-bottom:1px solid var(--regua);text-decoration:none;font-size:.95rem;transition:padding-left .15s,color .15s}
.lista a:hover{padding-left:.6rem;color:var(--esmeralda)}

/* tabelas de preço nas páginas de profissão */
table{width:100%;border-collapse:collapse;font-size:.94rem;margin:1.5rem 0 .5rem}
th,td{text-align:left;padding:.72rem .5rem;border-bottom:1px solid var(--regua)}
th{font-family:var(--mono);font-size:.63rem;text-transform:uppercase;letter-spacing:.12em;color:var(--tinta-fraca);font-weight:400}
td.num{text-align:right;font-family:var(--mono);font-variant-numeric:tabular-nums;white-space:nowrap}
.nota{font-size:.85rem;color:var(--tinta-fraca);max-width:60ch}

/* perguntas */
.faq{border-top:1px solid var(--regua);padding:1.35rem 0}
.faq h3{margin:0 0 .4rem;font-size:1rem;letter-spacing:-.01em}
.faq p{margin:0;color:var(--tinta-fraca);font-size:.94rem;max-width:62ch}

/* cartões viraram blocos com régua em cima */
.grade{display:grid;gap:1.5rem;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));margin:2rem 0 0}
.cartao{border-top:2px solid var(--regua);padding-top:1rem}
.cartao h3{margin:0 0 .45rem;font-size:1rem;letter-spacing:-.01em}
.cartao p{margin:0;color:var(--tinta-fraca);font-size:.94rem}

/* chamada final */
.chamada{border-top:1px solid var(--regua);padding:clamp(2.5rem,6vw,4rem) 0;display:flex;flex-wrap:wrap;
  align-items:center;justify-content:space-between;gap:1.5rem}
.chamada > h2{flex:1 1 100%}
.chamada h2{margin:0}
.chamada p{margin:.5rem 0 0;color:var(--tinta-fraca);max-width:40ch}

.migalha{font-family:var(--mono);font-size:.7rem;color:var(--tinta-fraca);padding-top:1.5rem;letter-spacing:.04em}
.migalha a{text-decoration:none}
.migalha a:hover{color:var(--esmeralda)}

.rodape{border-top:1px solid var(--regua);padding:2.5rem 0 3.5rem;color:var(--tinta-fraca);font-size:.86rem;margin-top:1rem}
.rodape p{margin:.4rem 0;max-width:62ch}
.rodape a{color:var(--tinta)}
`;


/**
 * Marca: um Z traçado entre duas réguas — as linhas do bloco de orçamento que
 * o produto substitui. Legível a 16px, sem depender de texto dentro do ícone.
 */
const MARCA_SVG = (lado = 28) =>
  `<svg width="${lado}" height="${lado}" viewBox="0 0 32 32" role="img" aria-label="Orça no ZAP">` +
  `<rect width="32" height="32" rx="7" fill="#047857"/>` +
  `<path d="M9.5 11h13M9.5 21h13M21.5 11 10.5 21" stroke="#fff" stroke-width="2.6" ` +
  `stroke-linecap="round" fill="none"/></svg>`;

const FAVICON =
  "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'>" +
  "<rect width='32' height='32' rx='7' fill='%23047857'/>" +
  "<path d='M9.5 11h13M9.5 21h13M21.5 11 10.5 21' stroke='white' stroke-width='2.6' " +
  "stroke-linecap='round' fill='none'/></svg>";

function pagina({ titulo, descricao, caminho, corpo, jsonLd, script = false }) {
  const canonico = `${SITE}${caminho}`;
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descricao)}">
<link rel="canonical" href="${esc(canonico)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descricao)}">
<meta property="og:url" content="${esc(canonico)}">
<meta property="og:locale" content="pt_BR">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#059669">
<link rel="icon" href="${FAVICON}">
<style>${CSS}</style>
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>` : ''}
</head>
<body>
<header class="topo">
  <div class="faixa">
    <a class="marca" href="${BASE}">${MARCA_SVG(28)}Orça no ZAP</a>
    <a class="btn pequeno" href="${BASE}app/">Abrir o app</a>
  </div>
</header>
${corpo}
<footer class="rodape">
  <div class="wrap">
    <p><strong>Orça no ZAP</strong> — orçamento profissional em 2 minutos, direto do celular.</p>
    <p>Os valores citados são faixas de referência de mercado para ajudar na montagem do seu orçamento. Não são cotação nem tabela oficial: quem define o preço do seu serviço é você.</p>
    <p><a href="${BASE}modelos/">Todos os modelos</a> · <a href="${BASE}precos/">Preços</a> · <a href="${BASE}app/">Abrir o app</a></p>
  </div>
</footer>
${script ? `<script type="module" src="${BASE}landing.js"></script>` : ''}
</body>
</html>`;
}

function paginaProfissao(p, comuns) {
  const caminho = `${BASE}modelo-de-orcamento/${p.slug}/`;
  const titulo = `Modelo de orçamento para ${p.nome.toLowerCase()} — grátis e pronto para enviar`;
  const descricao = `Monte um orçamento de ${p.nome.toLowerCase()} com itens, valores, prazo e garantia. Preencha, gere o PDF e envie pelo WhatsApp. Grátis e sem cadastro.`;
  const duvidas = [p.duvidaEspecifica, ...comuns];

  const linhas = p.servicos
    .map(
      (s) =>
        `<tr><td>${esc(s.descricao)}</td><td>${esc(s.unidade)}</td><td class="num">${esc(reais(s.valorSugeridoCentavos))}</td></tr>`,
    )
    .join('');

  const faq = duvidas
    .map((d) => `<div class="faq"><h3>${esc(d.pergunta)}</h3><p>${esc(d.resposta)}</p></div>`)
    .join('');

  const corpo = `
<div class="wrap">
  <nav class="migalha"><a href="${BASE}">Início</a> › <a href="${BASE}modelos/">Modelos</a> › ${esc(p.nome)}</nav>
  <div class="heroi">
    <h1>Modelo de orçamento para ${esc(p.nome.toLowerCase())}</h1>
    <p>${esc(p.intro)}</p>
    <div class="acoes">
      <a class="btn" href="${BASE}app/#/nova/${esc(p.slug)}">Criar orçamento de ${esc(p.nome.toLowerCase())}</a>
      <a class="btn vazio" href="${BASE}modelos/">Ver outras profissões</a>
    </div>
    <p class="selo">Grátis · sem cadastro · funciona no celular</p>
  </div>

  <section>
    <h2>Serviços que não podem faltar no orçamento</h2>
    <p class="sub">Já vêm preenchidos no app — é só clicar e ajustar o valor para a sua realidade.</p>
    <table>
      <thead><tr><th>Serviço</th><th>Unidade</th><th style="text-align:right">Faixa de referência</th></tr></thead>
      <tbody>${linhas}</tbody>
    </table>
    <p class="nota">Faixas de referência de mercado, para servir de ponto de partida. Ajuste conforme sua região, seu custo e sua margem.</p>
  </section>

  <section>
    <h2>Como montar em 2 minutos</h2>
    <div class="grade">
      <div class="cartao"><h3>1. Escolha os serviços</h3><p>Clique nos serviços de ${esc(p.nome.toLowerCase())} já cadastrados e ajuste quantidade e valor.</p></div>
      <div class="cartao"><h3>2. Informe custo e lucro</h3><p>Lance o custo de cada item e veja na hora a margem real do serviço, antes de mandar o preço.</p></div>
      <div class="cartao"><h3>3. Envie pelo WhatsApp</h3><p>Gere o link do orçamento ou salve em PDF e mande para o cliente direto do celular.</p></div>
    </div>
    <div class="chamada">
      <div>
        <h2>Seu próximo orçamento sai daqui</h2>
        <p>Sem instalar nada, sem criar conta, sem pagar.</p>
      </div>
      <a class="btn" href="${BASE}app/#/nova/${esc(p.slug)}">Começar agora</a>
    </div>
  </section>

  <section>
    <h2>Dúvidas de quem trabalha com ${esc(p.nome.toLowerCase())}</h2>
    ${faq}
  </section>
</div>`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: duvidas.map((d) => ({
        '@type': 'Question',
        name: d.pergunta,
        acceptedAnswer: { '@type': 'Answer', text: d.resposta },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: `${SITE}${BASE}` },
        { '@type': 'ListItem', position: 2, name: 'Modelos', item: `${SITE}${BASE}modelos/` },
        { '@type': 'ListItem', position: 3, name: p.nome, item: `${SITE}${caminho}` },
      ],
    },
  ];

  return { caminho, html: pagina({ titulo, descricao, caminho, corpo, jsonLd }) };
}

function paginaModelos(profissoes) {
  const porCategoria = new Map();
  for (const p of profissoes) {
    if (!porCategoria.has(p.categoria)) porCategoria.set(p.categoria, []);
    porCategoria.get(p.categoria).push(p);
  }

  const blocos = [...porCategoria.entries()]
    .map(
      ([categoria, lista]) => `
    <section>
      <h2>${esc(categoria)}</h2>
      <ul class="lista">
        ${lista
          .map(
            (p) =>
              `<li><a href="${BASE}modelo-de-orcamento/${esc(p.slug)}/">Orçamento para ${esc(p.nome.toLowerCase())}</a></li>`,
          )
          .join('')}
      </ul>
    </section>`,
    )
    .join('');

  const corpo = `
<div class="wrap">
  <nav class="migalha"><a href="${BASE}">Início</a> › Modelos</nav>
  <div class="heroi">
    <h1>Modelos de orçamento por profissão</h1>
    <p>${profissoes.length} modelos prontos, com os serviços mais pedidos de cada área já cadastrados e faixas de preço de referência.</p>
  </div>
  ${blocos}
</div>`;

  return {
    caminho: `${BASE}modelos/`,
    html: pagina({
      titulo: 'Modelos de orçamento por profissão — grátis',
      descricao: `${profissoes.length} modelos de orçamento prontos para eletricista, pedreiro, pintor, designer e mais. Preencha e envie pelo WhatsApp.`,
      caminho: `${BASE}modelos/`,
      corpo,
    }),
  };
}


function paginaPrecos() {
  const caminho = `${BASE}precos/`;
  const corpo = `
<div class="wrap">
  <nav class="migalha"><a href="${BASE}">Início</a> › Preços</nav>
  <div class="heroi">
    <h1>Grátis para começar. Barato para crescer.</h1>
    <p>Sem cartão, sem cadastro, sem fidelidade. O plano gratuito não expira.</p>
  </div>

  <div class="grade">
    <div class="cartao">
      <h3>Gratuito</h3>
      <p style="font-size:26px;font-weight:700;color:var(--tinta);margin:6px 0">R$ 0</p>
      <p>5 orçamentos por mês, para sempre. Todos os modelos de profissão, PDF, link e envio por WhatsApp inclusos.</p>
    </div>
    <div class="cartao" style="border-color:var(--marca)">
      <h3>Pro anual</h3>
      <p style="font-size:26px;font-weight:700;color:var(--marca-escura);margin:6px 0">R$ 197<span style="font-size:14px;font-weight:400;color:var(--suave)">/ano</span></p>
      <p>Orçamentos ilimitados. Menos de R$ 17 por mês — costuma se pagar no primeiro serviço fechado.</p>
    </div>
    <div class="cartao">
      <h3>Pro mensal</h3>
      <p style="font-size:26px;font-weight:700;color:var(--tinta);margin:6px 0">R$ 29<span style="font-size:14px;font-weight:400;color:var(--suave)">/mês</span></p>
      <p>Orçamentos ilimitados, renova quando você quiser.</p>
    </div>
  </div>

  <section>
    <h2>Perguntas sobre o pagamento</h2>
    <div class="faq"><h3>Como eu pago?</h3><p>Por PIX. Você copia o código, paga no app do seu banco e manda o comprovante. Em seguida recebe um código de ativação para colar no app.</p></div>
    <div class="faq"><h3>Preciso de cartão de crédito?</h3><p>Não. Não existe cobrança automática nem cartão cadastrado: você paga quando quiser renovar.</p></div>
    <div class="faq"><h3>O que acontece quando vence?</h3><p>Você volta ao plano gratuito, com 5 orçamentos por mês. Nenhum orçamento é apagado — continua tudo no seu aparelho.</p></div>
    <div class="faq"><h3>Funciona em mais de um celular?</h3><p>Sim. O mesmo código de ativação pode ser colado nos seus aparelhos. Lembre que os orçamentos ficam gravados em cada aparelho separadamente.</p></div>
    <div class="faq"><h3>Vale a pena o anual?</h3><p>Sai 43% mais barato que pagar mês a mês. Se você fecha pelo menos um serviço por ano graças a um orçamento bem apresentado, já pagou.</p></div>
  </section>

  <div class="chamada">
    <div>
      <h2>Comece pelo gratuito</h2>
      <p>Sem cadastro. Se gostar, o Pro está a um PIX de distância.</p>
    </div>
    <a class="btn" href="${BASE}app/">Criar orçamento grátis</a>
  </div>
</div>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Orça no ZAP Pro',
    description: 'Orçamentos ilimitados para prestadores de serviço.',
    offers: [
      { '@type': 'Offer', name: 'Pro anual', price: '197.00', priceCurrency: 'BRL' },
      { '@type': 'Offer', name: 'Pro mensal', price: '29.00', priceCurrency: 'BRL' },
    ],
  };

  return {
    caminho,
    html: pagina({
      titulo: 'Preços — Orça no ZAP',
      descricao:
        'Plano gratuito com 5 orçamentos por mês, para sempre. Pro ilimitado por R$ 197 ao ano ou R$ 29 ao mês, pago por PIX, sem cartão e sem fidelidade.',
      caminho,
      corpo,
      jsonLd,
    }),
  };
}

function paginaInicial(profissoes) {
  const destaques = profissoes.slice(0, 12);

  // Os valores viajam em centavos para o script contar até eles na abertura.
  const itens = [
    ['Instalação de ponto de tomada', '4', 'un', 9000, 36000],
    ['Troca de quadro com disjuntor DR', '1', 'un', 95000, 95000],
    ['Passagem de cabo em eletroduto', '18', 'm', 2200, 39600],
  ];

  const linhas = itens
    .map(
      ([desc, qtd, un, unit, tot]) => `
          <tr data-linha>
            <td>${esc(desc)}</td>
            <td class="n">${esc(qtd)}</td>
            <td class="n">${esc(un)}</td>
            <td class="n" data-centavos="${unit}">${esc(reais(unit).replace('R$ ', ''))}</td>
            <td class="n" data-centavos="${tot}">${esc(reais(tot).replace('R$ ', ''))}</td>
          </tr>`,
    )
    .join('');

  const corpo = `
<div class="wrap">
  <div class="abertura">
    <div>
      <p class="rotulo">Para quem vive de prestar serviço</p>
      <h1>Preço solto no zap vira leilão.</h1>
      <p class="sub">
        Quando você manda só o número, o cliente só consegue comparar número. Mande o
        orçamento inteiro — itens, prazo, garantia, validade — e saiba sua margem antes
        de apertar enviar.
      </p>
      <div class="acoes">
        <a class="btn" href="${BASE}app/">Fazer meu orçamento</a>
        <a class="btn vazio" href="${BASE}modelos/">Ver modelos por profissão</a>
      </div>
      <p class="selo">grátis · sem cadastro · seus dados ficam no seu aparelho</p>
    </div>

    <div class="folha" data-folha>
      <div class="folha-topo">
        <div>
          <strong>Elétrica Silva</strong>
          <p class="rotulo" style="margin-top:.25rem">Instalação de quadro</p>
        </div>
        <div class="folha-num">Nº 0042<br>válido até 18/08</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Serviço</th><th class="n">Qtd</th><th class="n">Un</th>
            <th class="n">Unit.</th><th class="n">Total</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
      <div class="folha-total">
        <span>Total</span>
        <b data-total>R$ 1.706,00</b>
      </div>
      <div class="folha-pe">
        <span>50% na aprovação · garantia 12 meses</span>
        <span class="carimbo" data-carimbo>enviado no zap</span>
      </div>
    </div>
  </div>

  <section data-revela>
    <p class="rotulo">O que muda na prática</p>
    <h2>A mesma obra, contada de dois jeitos</h2>
    <div class="contraste">
      <div>
        <p class="rotulo">Como costuma ser</p>
        <div class="zap dele">fica 1700</div>
        <p>
          O cliente pergunta pro próximo e fecha com quem disser 1600. Você não perdeu no
          preço — perdeu por não ter mostrado o que estava incluso.
        </p>
      </div>
      <div class="certo">
        <p class="rotulo">Como fica</p>
        <div class="zap">
          <strong>Orçamento nº 0042</strong><br>
          3 itens · prazo 3 dias · garantia 12 meses<br>
          <span style="color:var(--esmeralda);font-weight:650">Total R$ 1.706,00</span>
        </div>
        <p>
          Agora não é número contra número. É proposta, com prazo e garantia escritos — e
          fica muito mais difícil de comparar com chute.
        </p>
      </div>
    </div>
  </section>

  <section data-revela>
    <p class="rotulo">Por dentro</p>
    <h2>Três coisas que ninguém faz na planilha</h2>
    <div class="linhas">
      <div>
        <h3>Sua margem, ao vivo</h3>
        <p>
          Lance o custo de cada item e o lucro aparece na tela enquanto você monta. Dá para
          descobrir na hora se o desconto que o cliente pediu ainda cabe — ou se aquele
          serviço que você achava bom estava te pagando quase nada.
        </p>
      </div>
      <div>
        <h3>Vai pelo zap, abre no celular</h3>
        <p>
          Você gera um link e manda na conversa. O cliente abre sem instalar nada e sem se
          cadastrar. Se preferir papel, salva em PDF.
        </p>
      </div>
      <div>
        <h3>Funciona sem internet</h3>
        <p>
          Instale na tela de início e o app abre em obra, porão e subsolo. Seus orçamentos
          ficam no aparelho — não passam por servidor nenhum, nem os seus nem os do cliente.
        </p>
      </div>
    </div>
  </section>

  <section data-revela>
    <p class="rotulo">${profissoes.length} profissões</p>
    <h2>Os serviços da sua área já vêm preenchidos</h2>
    <p class="sub">Com faixa de preço de referência para você ajustar, não para copiar.</p>
    <ul class="lista">
      ${destaques
        .map(
          (p) =>
            `<li><a href="${BASE}modelo-de-orcamento/${esc(p.slug)}/">Orçamento para ${esc(p.nome.toLowerCase())}</a></li>`,
        )
        .join('')}
    </ul>
    <p style="margin-top:1.5rem"><a href="${BASE}modelos/">Ver todas as ${profissoes.length} profissões &rarr;</a></p>
  </section>

  <section data-revela>
    <p class="rotulo">Perguntas</p>
    <h2>O que perguntam antes de usar</h2>
    <div class="faq"><h3>Preciso pagar?</h3><p>Não. São 5 orçamentos por mês de graça, e isso não expira. O plano ilimitado é opcional e custa R$ 197 por ano.</p></div>
    <div class="faq"><h3>Onde ficam meus dados?</h3><p>No seu navegador. Nada é enviado para servidor nenhum — nem seus orçamentos, nem os dados dos seus clientes. Dá para baixar um backup quando quiser.</p></div>
    <div class="faq"><h3>Preciso instalar?</h3><p>Não. Abre como site no celular. Se quiser, adicione à tela de início e ele passa a abrir como aplicativo, inclusive sem internet.</p></div>
    <div class="faq"><h3>Serve para a minha profissão?</h3><p>São ${profissoes.length} modelos prontos, de pedreiro a confeiteiro. E dá para montar do zero com seus próprios itens.</p></div>
  </section>

  <div class="chamada">
    <div>
      <h2>Seu próximo orçamento sai daqui</h2>
      <p>Leva menos tempo do que digitar o preço na conversa.</p>
    </div>
    <a class="btn" href="${BASE}app/">Começar agora</a>
  </div>
</div>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Orça no ZAP',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    inLanguage: 'pt-BR',
    description:
      'Gerador de orçamentos para prestadores de serviço, com envio por WhatsApp, PDF e controle de custo e margem.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
  };

  return {
    caminho: BASE,
    html: pagina({
      titulo: 'Orça no ZAP — orçamento profissional em 2 minutos',
      descricao:
        'Monte orçamentos profissionais e envie pelo WhatsApp em 2 minutos. Grátis, sem cadastro, com controle de custo e lucro.',
      caminho: BASE,
      corpo,
      jsonLd,
      script: true,
    }),
  };
}

/**
 * Empacota a animação da página inicial. O anime.js entra aqui, não por CDN:
 * a CSP do site é `script-src 'self'`, e recurso de terceiro em runtime é
 * superfície de ataque que este projeto não abre.
 */
async function escreverScriptDaLanding() {
  await build({
    entryPoints: [join(RAIZ, 'scripts/landing.js')],
    outfile: join(DIST, 'landing.js'),
    bundle: true,
    format: 'esm',
    minify: true,
    target: 'es2020',
    logLevel: 'silent',
  });

  const { size } = await stat(join(DIST, 'landing.js'));
  return Math.round(size / 1024);
}

async function escreverServiceWorker() {
  const assets = await readdir(join(DIST, 'assets')).catch(() => []);
  const precache = [
    `${BASE}app/`,
    `${BASE}manifest.webmanifest`,
    `${BASE}landing.js`,
    ...assets.map((a) => `${BASE}assets/${a}`),
  ];

  const versao = assets.slice().sort().join('|') || 'sem-assets';
  const cache = `propostazap-${createHash('sha1').update(versao).digest('hex').slice(0, 8)}`;

  await writeFile(join(DIST, 'sw.js'), fonteDoServiceWorker({ cache, precache, base: BASE }), 'utf8');
  return { arquivos: precache.length, cache };
}

async function escrever(caminho, html) {
  const destino = join(DIST, semBase(caminho).replace(/^\//, ''), 'index.html');
  await mkdir(dirname(destino), { recursive: true });
  await writeFile(destino, html, 'utf8');
}

async function principal() {
  const { PROFISSOES, duvidasComuns } = await carregarProfissoes();

  const icones = gerarIcones();
  for (const { lado, png } of icones) {
    await writeFile(join(DIST, `icone-${lado}.png`), png);
  }

  // O vite gerou dist/index.html para a SPA; ele passa a viver em /app/.
  const spa = await readFile(join(DIST, 'index.html'), 'utf8');
  await mkdir(join(DIST, 'app'), { recursive: true });
  await writeFile(join(DIST, 'app', 'index.html'), spa, 'utf8');

  const paginas = [paginaInicial(PROFISSOES), paginaModelos(PROFISSOES), paginaPrecos()];
  for (const p of PROFISSOES) paginas.push(paginaProfissao(p, duvidasComuns(p)));

  for (const { caminho, html } of paginas) await escrever(caminho, html);

  const urls = [...paginas.map((p) => p.caminho), `${BASE}app/`];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join('\n')}
</urlset>`;
  await writeFile(join(DIST, 'sitemap.xml'), sitemap, 'utf8');

  await writeFile(
    join(DIST, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE}${BASE}sitemap.xml\n`,
    'utf8',
  );

  await writeFile(
    join(DIST, 'manifest.webmanifest'),
    JSON.stringify({
      name: 'Orça no ZAP — orçamentos em 2 minutos',
      short_name: 'Orça no ZAP',
      description:
        'Monte orçamentos profissionais e envie pelo WhatsApp. Funciona sem internet.',
      start_url: `${BASE}app/`,
      scope: BASE,
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#f8fafc',
      theme_color: '#059669',
      lang: 'pt-BR',
      icons: icones.map(({ lado }) => ({
        src: `${BASE}icone-${lado}.png`,
        sizes: `${lado}x${lado}`,
        type: 'image/png',
        purpose: 'any',
      })),
    }),
    'utf8',
  );

  // GitHub Pages ignora arquivos que começam com _ sem isto.
  await writeFile(join(DIST, '.nojekyll'), '', 'utf8');

  const kbLanding = await escreverScriptDaLanding();
  const sw = await escreverServiceWorker();

  console.log(`SEO: ${paginas.length} páginas + sitemap com ${urls.length} URLs`);
  console.log(`Offline: service worker com ${sw.arquivos} arquivos no precache`);
  console.log(`Landing: animação empacotada em ${kbLanding} KB`);
}

principal().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
