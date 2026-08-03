import { useEffect, useRef, useState } from 'react';
import { irPara, useRota } from './lib/router';
import { useApp } from './lib/useApp';
import { Assinar } from './ui/Assinar';
import { Config } from './ui/Config';
import { Editor } from './ui/Editor';
import { Painel } from './ui/Painel';
import { Publico } from './ui/Publico';

function Cabecalho({ mostrarConfig }: { mostrarConfig: boolean }) {
  const [tema, setTema] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (tema === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    localStorage.setItem('theme', tema);
  }, [tema]);

  const toggleTema = () => {
    setTema((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <header className="sem-impressao sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur transition-colors">
      <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => irPara('/')}
          className="flex items-center gap-2 text-left cursor-pointer"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-marca-600 text-xs font-bold tracking-tight text-white">
            OZ
          </span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">Orça no ZAP</span>
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTema}
            title={tema === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
            aria-label="Alternar tema"
            className="min-h-[44px] min-w-[44px] rounded-lg px-3 py-2 text-slate-600 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 cursor-pointer flex items-center justify-center gap-1.5 text-xs font-medium border border-slate-200 dark:border-slate-800"
          >
            {tema === 'dark' ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                <span className="hidden xs:inline sm:inline">Claro</span>
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                <span className="hidden xs:inline sm:inline">Escuro</span>
              </>
            )}
          </button>
          {mostrarConfig && (
            <button
              type="button"
              onClick={() => irPara('/config')}
              className="rounded-lg px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Configurações
            </button>
          )}
        </div>
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
