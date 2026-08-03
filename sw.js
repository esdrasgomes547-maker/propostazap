// GERADO NO BUILD — não edite à mão.
const CACHE = "propostazap-cda84bcf";
const PRECACHE = ["/propostazap/app/","/propostazap/manifest.webmanifest","/propostazap/assets/index-Ct5-CBuo.js","/propostazap/assets/index-Dd1mVEeM.css"];
const BASE = "/propostazap/";

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
