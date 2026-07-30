/**
 * Reenvia todas as URLs do sitemap ao IndexNow (Bing, Yandex e parceiros).
 *
 * A chave é pública por definição: o protocolo exige que ela esteja acessível
 * em https://<host>/<chave>.txt para provar que quem submete controla o site.
 *
 * Uso: node scripts/indexnow.mjs
 */
const CHAVE = 'f133f79d259957a1d38e2f1bd767c923';
const HOST = process.env.INDEXNOW_HOST ?? 'esdrasgomes547-maker.github.io';
const BASE = process.env.BASE_PATH ?? '/propostazap/';

const sitemap = await (await fetch(`https://${HOST}${BASE}sitemap.xml`)).text();
const urlList = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);

if (urlList.length === 0) {
  console.error('Sitemap vazio ou inacessível — nada a submeter.');
  process.exit(1);
}

const corpo = JSON.stringify({
  host: HOST,
  key: CHAVE,
  keyLocation: `https://${HOST}${BASE}${CHAVE}.txt`,
  urlList,
});

for (const destino of ['https://api.indexnow.org/indexnow', 'https://www.bing.com/indexnow']) {
  const resposta = await fetch(destino, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: corpo,
  });
  console.log(`${destino}: HTTP ${resposta.status} (${urlList.length} URLs)`);
}
