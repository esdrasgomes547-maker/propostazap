import { useEffect, useState, type ReactNode } from 'react';
import {
  formatarCentavos,
  formatarQuantidade,
  parseMoedaParaCentavos,
  parseQuantidadeParaMil,
} from '../lib/money';

const ENTRADA =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-marca-500 focus:ring-2 focus:ring-marca-100';

export function Cartao({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      {children}
    </section>
  );
}

export function Titulo({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">{children}</h2>;
}

export function Campo({
  rotulo,
  valor,
  aoMudar,
  tipo = 'text',
  dica,
  multilinha = false,
  maximo,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  tipo?: string;
  dica?: string;
  multilinha?: boolean;
  maximo?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{rotulo}</span>
      {multilinha ? (
        <textarea
          className={`${ENTRADA} min-h-20 resize-y`}
          value={valor}
          maxLength={maximo}
          placeholder={dica}
          onChange={(e) => aoMudar(e.target.value)}
        />
      ) : (
        <input
          className={ENTRADA}
          type={tipo}
          value={valor}
          maxLength={maximo}
          placeholder={dica}
          onChange={(e) => aoMudar(e.target.value)}
        />
      )}
    </label>
  );
}

/**
 * Entrada monetária: mantém o texto cru enquanto o usuário digita e só
 * reformata ao sair do campo, para o cursor não pular no meio do número.
 */
export function CampoMoeda({
  rotulo,
  centavos,
  aoMudar,
  compacto = false,
}: {
  rotulo: string;
  centavos: number;
  aoMudar: (centavos: number) => void;
  compacto?: boolean;
}) {
  const [texto, setTexto] = useState(() => formatarCentavos(centavos, false));
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    if (!editando) setTexto(formatarCentavos(centavos, false));
  }, [centavos, editando]);

  return (
    <label className="block">
      {!compacto && <span className="mb-1 block text-xs font-medium text-slate-600">{rotulo}</span>}
      <input
        className={`${ENTRADA} text-right tabular-nums`}
        inputMode="decimal"
        aria-label={rotulo}
        value={texto}
        onFocus={() => setEditando(true)}
        onChange={(e) => {
          setTexto(e.target.value);
          aoMudar(parseMoedaParaCentavos(e.target.value));
        }}
        onBlur={() => {
          setEditando(false);
          setTexto(formatarCentavos(parseMoedaParaCentavos(texto), false));
        }}
      />
    </label>
  );
}

export function CampoQuantidade({
  rotulo,
  quantidadeMil,
  aoMudar,
}: {
  rotulo: string;
  quantidadeMil: number;
  aoMudar: (q: number) => void;
}) {
  const [texto, setTexto] = useState(() => formatarQuantidade(quantidadeMil));
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    if (!editando) setTexto(formatarQuantidade(quantidadeMil));
  }, [quantidadeMil, editando]);

  return (
    <input
      className={`${ENTRADA} text-right tabular-nums`}
      inputMode="decimal"
      aria-label={rotulo}
      value={texto}
      onFocus={() => setEditando(true)}
      onChange={(e) => {
        setTexto(e.target.value);
        aoMudar(parseQuantidadeParaMil(e.target.value));
      }}
      onBlur={() => {
        setEditando(false);
        setTexto(formatarQuantidade(parseQuantidadeParaMil(texto)));
      }}
    />
  );
}

export function CampoNumero({
  rotulo,
  valor,
  aoMudar,
  minimo = 0,
  maximo = 3650,
  sufixo,
}: {
  rotulo: string;
  valor: number;
  aoMudar: (v: number) => void;
  minimo?: number;
  maximo?: number;
  sufixo?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{rotulo}</span>
      <div className="flex items-center gap-2">
        <input
          className={ENTRADA}
          type="number"
          min={minimo}
          max={maximo}
          value={String(valor)}
          onChange={(e) => {
            const n = Number(e.target.value);
            aoMudar(Number.isFinite(n) ? Math.min(Math.max(Math.trunc(n), minimo), maximo) : minimo);
          }}
        />
        {sufixo && <span className="text-xs whitespace-nowrap text-slate-500">{sufixo}</span>}
      </div>
    </label>
  );
}

type Variante = 'primario' | 'secundario' | 'perigo' | 'fantasma';

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-marca-600 text-white hover:bg-marca-700 shadow-sm',
  secundario: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
  perigo: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
  fantasma: 'text-slate-600 hover:bg-slate-100',
};

export function Botao({
  children,
  aoClicar,
  variante = 'secundario',
  desabilitado = false,
  className = '',
  tipo = 'button',
}: {
  children: ReactNode;
  aoClicar?: () => void;
  variante?: Variante;
  desabilitado?: boolean;
  className?: string;
  tipo?: 'button' | 'submit';
}) {
  return (
    <button
      type={tipo}
      onClick={aoClicar}
      disabled={desabilitado}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTES[variante]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Aviso({ children, tom = 'info' }: { children: ReactNode; tom?: 'info' | 'alerta' }) {
  const cor =
    tom === 'alerta'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : 'border-sky-200 bg-sky-50 text-sky-900';
  return <div className={`rounded-lg border px-3 py-2 text-sm ${cor}`}>{children}</div>;
}
