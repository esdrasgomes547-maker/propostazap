/**
 * Código do service worker, como texto, para o build materializar em dist/sw.js.
 *
 * Fica separado porque service worker quebrado é grudento: ele vive no
 * aparelho do usuário e continua servindo o que aprendeu. Sair daqui como
 * função pura deixa o comportamento testável antes de chegar em alguém.
 *
 * Estratégia:
 * - navegação (HTML): rede primeiro, cache como reserva. Deploy novo sempre
 *   aparece; sem isso o service worker congelaria a versão antiga para sempre.
 * - assets com hash no nome: cache primeiro. O nome muda quando o conteúdo
 *   muda, então servir do cache nunca entrega conteúdo velho.
 * - outra origem, ou fora do escopo: nem passa pelo service worker.
 */
export function fonteDoServiceWorker({ cache, precache, base }) {
  return `// GERADO NO BUILD — não edite à mão.
const CACHE = ${JSON.stringify(cache)};
const PRECACHE = ${JSON.stringify(precache)};
const BASE = ${JSON.stringify(base)};

self.addEventListener('install', (evento) => {
  self.skipWaiting();
  evento.waitUntil(
    caches.open(CACHE).then((cache) =>
      // Um arquivo indisponível não pode abortar a instalação inteira.
      Promise.allSettled(PRECACHE.map((url) => cache.add(url))),
    ),
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evento) => {
  const requisicao = evento.request;
  if (requisicao.method !== 'GET') return;

  const url = new URL(requisicao.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;

  if (requisicao.mode === 'navigate') {
    evento.respondWith(
      fetch(requisicao)
        .then((resposta) => {
          const copia = resposta.clone();
          caches.open(CACHE).then((c) => c.put(requisicao, copia));
          return resposta;
        })
        .catch(async () => (await caches.match(requisicao)) ?? (await caches.match(BASE + 'app/'))),
    );
    return;
  }

  evento.respondWith(
    caches.match(requisicao).then(
      (achado) =>
        achado ??
        fetch(requisicao).then((resposta) => {
          if (resposta.ok && resposta.type === 'basic') {
            const copia = resposta.clone();
            caches.open(CACHE).then((c) => c.put(requisicao, copia));
          }
          return resposta;
        }),
    ),
  );
});
`;
}
