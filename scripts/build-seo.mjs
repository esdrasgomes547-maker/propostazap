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
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(RAIZ, 'dist');

// SITE é só a origem (sem caminho); BASE é o prefixo de URL onde o site é servido.
// GitHub Pages de projeto serve em /<repo>/, então os dois se somam na URL —
// mas em disco os arquivos vão na raiz de dist/, sem o prefixo.
const SITE = process.env.SITE_URL?.replace(/\/$/, '') ?? 'https://orcanozap.pages.dev';
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
:root{--marca:#059669;--marca-escura:#047857;--tinta:#0f172a;--suave:#475569;--borda:#e2e8f0;--fundo:#f8fafc}
*{box-sizing:border-box}
body{margin:0;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:var(--tinta);background:#fff;line-height:1.65}
a{color:var(--marca-escura)}
.topo{position:sticky;top:0;z-index:10;background:rgba(255,255,255,.92);backdrop-filter:blur(8px);border-bottom:1px solid var(--borda)}
.faixa{max-width:960px;margin:0 auto;padding:14px 20px;display:flex;align-items:center;gap:12px}
.marca{display:flex;align-items:center;gap:8px;font-weight:700;text-decoration:none;color:var(--tinta)}
.marca span{display:grid;place-items:center;width:32px;height:32px;border-radius:9px;background:var(--marca);color:#fff;font-size:11px;font-weight:700;letter-spacing:-.02em}
.wrap{max-width:960px;margin:0 auto;padding:0 20px}
.heroi{padding:64px 0 48px;text-align:center}
.heroi h1{font-size:clamp(30px,5vw,46px);line-height:1.15;margin:0 0 16px;letter-spacing:-.02em}
.heroi p{font-size:18px;color:var(--suave);max-width:640px;margin:0 auto 28px}
.btn{display:inline-block;background:var(--marca);color:#fff;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:11px;box-shadow:0 1px 3px rgba(0,0,0,.12)}
.btn:hover{background:var(--marca-escura)}
.btn.vazio{background:#fff;color:var(--tinta);border:1px solid var(--borda);box-shadow:none}
.acoes{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.selo{display:inline-block;font-size:13px;color:var(--suave);margin-top:14px}
.grade{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));margin:36px 0}
.cartao{border:1px solid var(--borda);border-radius:14px;padding:20px;background:#fff}
.cartao h3{margin:0 0 8px;font-size:17px}
.cartao p{margin:0;color:var(--suave);font-size:15px}
section{padding:40px 0;border-top:1px solid var(--borda)}
h2{font-size:26px;letter-spacing:-.01em;margin:0 0 8px}
.sub{color:var(--suave);margin:0 0 20px}
table{width:100%;border-collapse:collapse;font-size:15px;margin:8px 0 4px}
th,td{text-align:left;padding:11px 8px;border-bottom:1px solid var(--borda)}
th{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--suave)}
td.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.nota{font-size:13px;color:var(--suave)}
.faq{border:1px solid var(--borda);border-radius:12px;padding:16px 18px;margin-bottom:10px;background:var(--fundo)}
.faq h3{margin:0 0 6px;font-size:16px}
.faq p{margin:0;color:var(--suave);font-size:15px}
.lista{display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));padding:0;list-style:none;margin:0}
.lista a{display:block;padding:11px 14px;border:1px solid var(--borda);border-radius:10px;text-decoration:none;color:var(--tinta);font-size:15px;background:#fff}
.lista a:hover{border-color:var(--marca);color:var(--marca-escura)}
.rodape{border-top:1px solid var(--borda);padding:32px 0;color:var(--suave);font-size:14px;margin-top:24px}
.migalha{font-size:14px;color:var(--suave);padding-top:22px}
.migalha a{color:var(--suave)}
.chamada{background:var(--fundo);border:1px solid var(--borda);border-radius:14px;padding:26px;text-align:center;margin:36px 0}
.chamada h2{margin:0 0 8px;font-size:22px}
.chamada p{margin:0 0 18px;color:var(--suave)}
`;

function pagina({ titulo, descricao, caminho, corpo, jsonLd }) {
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
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23059669'/><text y='64' x='50' text-anchor='middle' font-size='38' font-family='sans-serif' font-weight='bold' fill='white'>OZ</text></svg>">
<style>${CSS}</style>
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>` : ''}
</head>
<body>
<header class="topo">
  <div class="faixa">
    <a class="marca" href="${BASE}"><span>OZ</span>Orça no ZAP</a>
    <a class="btn" style="margin-left:auto;padding:9px 18px;font-size:14px" href="${BASE}app/">Abrir o app</a>
  </div>
</header>
${corpo}
<footer class="rodape">
  <div class="wrap">
    <p><strong>Orça no ZAP</strong> — orçamentos profissionais em 2 minutos, direto do celular.</p>
    <p>Os valores citados são faixas de referência de mercado para ajudar na montagem do seu orçamento. Não são cotação nem tabela oficial: quem define o preço do seu serviço é você.</p>
    <p><a href="${BASE}modelos/">Todos os modelos</a> · <a href="${BASE}precos/">Preços</a> · <a href="${BASE}app/">Abrir o app</a></p>
  </div>
</footer>
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
  <div class="heroi" style="text-align:left;padding:28px 0 32px">
    <h1>Modelo de orçamento para ${esc(p.nome.toLowerCase())}</h1>
    <p style="margin-left:0">${esc(p.intro)}</p>
    <div class="acoes" style="justify-content:flex-start">
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
      <h2>Seu próximo orçamento sai daqui</h2>
      <p>Sem instalar nada, sem criar conta, sem pagar.</p>
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
  <div class="heroi" style="text-align:left;padding:28px 0 12px">
    <h1>Modelos de orçamento por profissão</h1>
    <p style="margin-left:0">${profissoes.length} modelos prontos, com os serviços mais pedidos de cada área já cadastrados e faixas de preço de referência.</p>
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
  <div class="heroi" style="padding:34px 0 24px">
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
    <h2>Comece pelo gratuito</h2>
    <p>Sem cadastro. Se gostar, o Pro está a um PIX de distância.</p>
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
  const corpo = `
<div class="wrap">
  <div class="heroi">
    <h1>Orçamento profissional em 2 minutos, direto do celular</h1>
    <p>Pare de mandar preço solto no WhatsApp. Monte um orçamento com seus dados, itens detalhados, prazo, garantia e validade — e descubra sua margem antes de enviar.</p>
    <div class="acoes">
      <a class="btn" href="${BASE}app/">Criar meu orçamento grátis</a>
      <a class="btn vazio" href="${BASE}modelos/">Ver modelos por profissão</a>
      <a class="btn vazio" href="${BASE}precos/">Preços</a>
    </div>
    <p class="selo">Sem cadastro · sem instalar nada · seus dados ficam no seu aparelho</p>
  </div>

  <section>
    <h2>Por que quem orça por escrito cobra mais caro</h2>
    <div class="grade">
      <div class="cartao"><h3>Preço solto vira leilão</h3><p>Um número no WhatsApp só pode ser comparado por valor. Um orçamento detalhado mostra o que está incluso e tira você da guerra de preço.</p></div>
      <div class="cartao"><h3>Você enxerga sua margem</h3><p>Lance o custo de cada item e veja lucro e percentual em tempo real. Dá para descobrir na hora se o desconto pedido cabe.</p></div>
      <div class="cartao"><h3>Prazo e validade no papel</h3><p>Validade curta cria urgência e protege você de variação de preço de material. Tudo já sai impresso na proposta.</p></div>
    </div>
  </section>

  <section>
    <h2>Modelos prontos por profissão</h2>
    <p class="sub">Serviços mais pedidos já cadastrados, com faixa de preço de referência.</p>
    <ul class="lista">
      ${destaques
        .map(
          (p) =>
            `<li><a href="${BASE}modelo-de-orcamento/${esc(p.slug)}/">Orçamento para ${esc(p.nome.toLowerCase())}</a></li>`,
        )
        .join('')}
    </ul>
    <p style="margin-top:16px"><a href="${BASE}modelos/">Ver todas as ${profissoes.length} profissões →</a></p>
  </section>

  <section>
    <h2>Perguntas frequentes</h2>
    <div class="faq"><h3>Preciso pagar alguma coisa?</h3><p>Não. Você cria até 5 orçamentos por mês sem pagar nada e sem cadastro. O plano ilimitado é opcional.</p></div>
    <div class="faq"><h3>Meus dados ficam guardados onde?</h3><p>No seu próprio navegador. Nada é enviado para servidor nenhum — nem seus orçamentos, nem seus clientes. Você pode baixar um backup a qualquer momento.</p></div>
    <div class="faq"><h3>Como o cliente recebe o orçamento?</h3><p>Você gera um link e manda pelo WhatsApp, ou salva em PDF. O cliente abre no celular sem instalar nada.</p></div>
    <div class="faq"><h3>Funciona para qualquer profissão?</h3><p>Sim. Há ${profissoes.length} modelos prontos, e você pode montar um orçamento em branco com seus próprios itens.</p></div>
  </section>

  <div class="chamada">
    <h2>Comece pelo seu próximo orçamento</h2>
    <p>Leva menos tempo do que digitar o preço na conversa.</p>
    <a class="btn" href="${BASE}app/">Criar orçamento grátis</a>
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

  return { caminho: BASE, html: pagina({ titulo: 'Orça no ZAP — orçamento profissional em 2 minutos', descricao: 'Monte orçamentos profissionais e envie pelo WhatsApp em 2 minutos. Grátis, sem cadastro, com controle de custo e lucro.', caminho: BASE, corpo, jsonLd }) };
}


/**
 * Gera o service worker com a lista de arquivos daquele build.
 *
 * O nome dos assets carrega hash, então a lista precisa sair do build — não dá
 * para escrever à mão. A versão do cache também vem daí: assets novos mudam a
 * versão e o cache velho é apagado no activate.
 *
 * O código em si mora em service-worker-fonte.mjs, para poder ser testado.
 */
async function escreverServiceWorker() {
  const assets = await readdir(join(DIST, 'assets')).catch(() => []);
  const precache = [
    `${BASE}app/`,
    `${BASE}manifest.webmanifest`,
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

  const sw = await escreverServiceWorker();

  console.log(`SEO: ${paginas.length} páginas + sitemap com ${urls.length} URLs`);
  console.log(`Offline: service worker com ${sw.arquivos} arquivos no precache`);
}

principal().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
