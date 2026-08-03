import { useEffect, useRef } from 'react';
import { irPara, useRota } from './lib/router';
import { useApp } from './lib/useApp';
import { Assinar } from './ui/Assinar';
import { Config } from './ui/Config';
import { Editor } from './ui/Editor';
import { Painel } from './ui/Painel';
import { Publico } from './ui/Publico';

function Cabecalho({ mostrarConfig }: { mostrarConfig: boolean }) {
  return (
    <header className="sem-impressao sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => irPara('/')}
          className="flex items-center gap-2 text-left"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-marca-600 text-xs font-bold tracking-tight text-white">
            OZ
          </span>
          <span className="font-semibold text-slate-900">Orça no ZAP</span>
        </button>
        {mostrarConfig && (
          <button
            type="button"
            onClick={() => irPara('/config')}
            className="ml-auto rounded-lg px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100"
          >
            Configurações
          </button>
        )}
      </div>
    </header>
  );
}

export default function App() {
  const rota = useRota();
  const app = useApp();

  // A rota "nova" só existe para as páginas de SEO: cria e redireciona.
  // O ref evita recriar a cada render — `app` muda de identidade toda vez.
  const jaCriou = useRef('');
  useEffect(() => {
    if (rota.nome !== 'nova') return;

    const marca = `nova:${rota.profissao}`;
    if (jaCriou.current === marca) return;
    jaCriou.current = marca;

    const criada = app.criarProposta(rota.profissao);
    irPara(criada ? `/p/${criada.id}` : '/');
  }, [rota, app]);

  return (
    <div className="min-h-screen">
      <Cabecalho mostrarConfig={rota.nome !== 'publico'} />
      <main className="mx-auto max-w-4xl px-4 py-5">
        {rota.nome === 'painel' && <Painel app={app} />}
        {rota.nome === 'nova' && <p className="py-16 text-center text-sm text-slate-500">Criando…</p>}
        {rota.nome === 'editar' && <Editor app={app} id={rota.id} />}
        {rota.nome === 'config' && <Config app={app} />}
        {rota.nome === 'assinar' && <Assinar app={app} />}
        {rota.nome === 'publico' && <Publico token={rota.token} />}
      </main>
    </div>
  );
}
