import { beforeEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error módulo de build em JS, sem tipos
import { fonteDoServiceWorker } from '../../scripts/service-worker-fonte.mjs';

/**
 * O service worker roda num escopo que o jsdom não fornece, então aqui ele é
 * executado dentro de um `self` de mentira, com Cache API e fetch falsos.
 *
 * Vale o trabalho porque service worker quebrado é grudento: fica instalado no
 * aparelho e continua servindo o que aprendeu, mesmo depois de um deploy novo.
 */

const BASE = '/propostazap/';
const CACHE = 'propostazap-teste';
const PRECACHE = [`${BASE}app/`, `${BASE}manifest.webmanifest`, `${BASE}assets/index-abc123.js`];

interface Escopo {
  disparar: (tipo: string, evento: unknown) => Promise<void>;
  caches: Map<string, Map<string, string>>;
  pulouEspera: boolean;
  assumiuClientes: boolean;
  fetchChamado: string[];
}

/** Monta um `self` mínimo e executa o código do service worker dentro dele. */
function montarEscopo(
  respostaDaRede: (url: string) => Promise<{ ok: boolean; type: string; corpo: string }>,
): Escopo {
  const armazens = new Map<string, Map<string, string>>();
  const ouvintes = new Map<string, (e: unknown) => void>();
  const estado = { pulouEspera: false, assumiuClientes: false, fetchChamado: [] as string[] };

  function abrir(nome: string) {
    if (!armazens.has(nome)) armazens.set(nome, new Map());
    const armazem = armazens.get(nome)!;
    return Promise.resolve({
      add: async (url: string) => {
        const r = await respostaDaRede(url);
        if (!r.ok) throw new Error('falhou');
        armazem.set(url, r.corpo);
      },
      put: async (req: { url: string }, resp: { corpo: string }) => {
        armazem.set(new URL(req.url).pathname, resp.corpo);
      },
    });
  }

  const caches = {
    open: abrir,
    keys: () => Promise.resolve([...armazens.keys()]),
    delete: (nome: string) => Promise.resolve(armazens.delete(nome)),
    match: (alvo: { url: string } | string) => {
      const caminho = typeof alvo === 'string' ? alvo : new URL(alvo.url).pathname;
      for (const armazem of armazens.values()) {
        if (armazem.has(caminho)) {
          return Promise.resolve({ corpo: armazem.get(caminho), clone: () => ({ corpo: armazem.get(caminho) }) });
        }
      }
      return Promise.resolve(undefined);
    },
  };

  const self = {
    location: { origin: 'https://exemplo.com' },
    addEventListener: (tipo: string, fn: (e: unknown) => void) => ouvintes.set(tipo, fn),
    skipWaiting: () => {
      estado.pulouEspera = true;
    },
    clients: {
      claim: () => {
        estado.assumiuClientes = true;
        return Promise.resolve();
      },
    },
  };

  const fetchFalso = async (req: { url: string }) => {
    estado.fetchChamado.push(new URL(req.url).pathname);
    const r = await respostaDaRede(new URL(req.url).pathname);
    return { ...r, clone: () => ({ corpo: r.corpo }) };
  };

  const codigo = fonteDoServiceWorker({ cache: CACHE, precache: PRECACHE, base: BASE });
  new Function('self', 'caches', 'fetch', 'URL', codigo)(self, caches, fetchFalso, URL);

  return {
    disparar: async (tipo, evento) => {
      const fn = ouvintes.get(tipo);
      if (!fn) throw new Error(`sem ouvinte para ${tipo}`);
      fn(evento);
    },
    caches: armazens,
    get pulouEspera() {
      return estado.pulouEspera;
    },
    get assumiuClientes() {
      return estado.assumiuClientes;
    },
    get fetchChamado() {
      return estado.fetchChamado;
    },
  };
}

function eventoDeInstalacao() {
  const esperas: Promise<unknown>[] = [];
  return { evento: { waitUntil: (p: Promise<unknown>) => esperas.push(p) }, esperas };
}

function eventoDeBusca(caminho: string, modo = 'no-cors', metodo = 'GET') {
  let resposta: Promise<unknown> | undefined;
  return {
    evento: {
      request: { url: `https://exemplo.com${caminho}`, method: metodo, mode: modo },
      respondWith: (p: Promise<unknown>) => {
        resposta = p;
      },
    },
    get resposta() {
      return resposta;
    },
  };
}

const REDE_OK = async (url: string) => ({ ok: true, type: 'basic', corpo: `rede:${url}` });
const REDE_FORA = async () => {
  throw new Error('offline');
};

let escopo: Escopo;

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('instalação', () => {
  it('guarda todos os arquivos do precache e assume o controle', async () => {
    escopo = montarEscopo(REDE_OK);
    const { evento, esperas } = eventoDeInstalacao();

    await escopo.disparar('install', evento);
    await Promise.all(esperas);

    expect(escopo.pulouEspera).toBe(true);
    expect([...escopo.caches.get(CACHE)!.keys()]).toEqual(PRECACHE);
  });

  it('não aborta a instalação quando um arquivo falha', async () => {
    escopo = montarEscopo(async (url) =>
      url.endsWith('.js')
        ? { ok: false, type: 'basic', corpo: '' }
        : { ok: true, type: 'basic', corpo: 'ok' },
    );
    const { evento, esperas } = eventoDeInstalacao();

    await escopo.disparar('install', evento);
    await expect(Promise.all(esperas)).resolves.toBeDefined();

    // Os que deram certo continuam no cache; só o que falhou ficou de fora.
    expect(escopo.caches.get(CACHE)!.size).toBe(PRECACHE.length - 1);
  });
});

describe('ativação', () => {
  it('apaga cache de versão antiga e mantém o atual', async () => {
    escopo = montarEscopo(REDE_OK);
    escopo.caches.set('propostazap-versao-velha', new Map([['/x', 'y']]));
    escopo.caches.set(CACHE, new Map());

    const { evento, esperas } = eventoDeInstalacao();
    await escopo.disparar('activate', evento);
    await Promise.all(esperas);

    expect([...escopo.caches.keys()]).toEqual([CACHE]);
    expect(escopo.assumiuClientes).toBe(true);
  });
});

describe('navegação — rede primeiro', () => {
  it('serve da rede quando há internet', async () => {
    escopo = montarEscopo(REDE_OK);
    const busca = eventoDeBusca(`${BASE}app/`, 'navigate');

    await escopo.disparar('fetch', busca.evento);
    const r = (await busca.resposta) as { corpo: string };

    expect(r.corpo).toBe(`rede:${BASE}app/`);
    expect(escopo.fetchChamado).toContain(`${BASE}app/`);
  });

  it('cai para o cache quando a rede morre — é o ponto do offline', async () => {
    escopo = montarEscopo(REDE_FORA);
    escopo.caches.set(CACHE, new Map([[`${BASE}app/`, 'guardado']]));

    const busca = eventoDeBusca(`${BASE}app/`, 'navigate');
    await escopo.disparar('fetch', busca.evento);
    const r = (await busca.resposta) as { corpo: string };

    expect(r.corpo).toBe('guardado');
  });

  it('offline em rota interna cai na casca do app', async () => {
    escopo = montarEscopo(REDE_FORA);
    escopo.caches.set(CACHE, new Map([[`${BASE}app/`, 'casca']]));

    const busca = eventoDeBusca(`${BASE}app/`, 'navigate');
    await escopo.disparar('fetch', busca.evento);

    expect(((await busca.resposta) as { corpo: string }).corpo).toBe('casca');
  });
});

describe('assets — cache primeiro', () => {
  it('serve do cache sem tocar na rede', async () => {
    escopo = montarEscopo(REDE_OK);
    escopo.caches.set(CACHE, new Map([[`${BASE}assets/index-abc123.js`, 'do cache']]));

    const busca = eventoDeBusca(`${BASE}assets/index-abc123.js`);
    await escopo.disparar('fetch', busca.evento);

    expect(((await busca.resposta) as { corpo: string }).corpo).toBe('do cache');
    expect(escopo.fetchChamado).toHaveLength(0);
  });

  it('busca na rede e guarda quando não está no cache', async () => {
    escopo = montarEscopo(REDE_OK);
    const caminho = `${BASE}assets/novo-xyz.js`;

    const busca = eventoDeBusca(caminho);
    await escopo.disparar('fetch', busca.evento);
    await busca.resposta;

    expect(escopo.fetchChamado).toContain(caminho);
  });
});

describe('o que o service worker deixa passar direto', () => {
  it('ignora requisição que não é GET', async () => {
    escopo = montarEscopo(REDE_OK);
    const busca = eventoDeBusca(`${BASE}app/`, 'navigate', 'POST');

    await escopo.disparar('fetch', busca.evento);
    expect(busca.resposta).toBeUndefined();
  });

  it('ignora outra origem', async () => {
    escopo = montarEscopo(REDE_OK);
    const busca = {
      evento: {
        request: { url: 'https://wa.me/5511999999999', method: 'GET', mode: 'navigate' },
        respondWith: () => {
          throw new Error('não deveria interceptar outra origem');
        },
      },
    };

    await expect(escopo.disparar('fetch', busca.evento)).resolves.toBeUndefined();
  });

  it('ignora caminho fora do escopo do app', async () => {
    escopo = montarEscopo(REDE_OK);
    const busca = eventoDeBusca('/outro-projeto/index.html', 'navigate');

    await escopo.disparar('fetch', busca.evento);
    expect(busca.resposta).toBeUndefined();
  });
});
