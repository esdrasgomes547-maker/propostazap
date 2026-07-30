import { useMemo, useState } from 'react';
import { calcularTotais } from '../lib/calc';
import { formatarCentavos } from '../lib/money';
import { PROFISSOES } from '../lib/professions';
import { irPara } from '../lib/router';
import { STATUS_LABEL, type StatusProposta } from '../lib/types';
import type { App } from '../lib/useApp';
import { Aviso, Botao, Cartao } from './base';

const CORES_STATUS: Record<StatusProposta, string> = {
  rascunho: 'bg-slate-100 text-slate-600',
  enviado: 'bg-sky-100 text-sky-700',
  aceito: 'bg-marca-100 text-marca-700',
  recusado: 'bg-red-100 text-red-700',
};

function Metrica({ rotulo, valor, destaque = false }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{rotulo}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${destaque ? 'text-marca-600' : 'text-slate-900'}`}>
        {valor}
      </p>
    </div>
  );
}

export function Painel({ app }: { app: App }) {
  const [filtro, setFiltro] = useState<'todos' | StatusProposta>('todos');
  const [profissao, setProfissao] = useState(app.empresa.profissaoSlug);

  const resumo = useMemo(() => {
    let aberto = 0;
    let ganho = 0;
    for (const p of app.propostas) {
      const total = calcularTotais(p).totalCentavos;
      if (p.status === 'aceito') ganho += total;
      if (p.status === 'enviado') aberto += total;
    }
    const enviadas = app.propostas.filter((p) => p.status !== 'rascunho').length;
    const aceitas = app.propostas.filter((p) => p.status === 'aceito').length;
    return {
      aberto,
      ganho,
      conversao: enviadas === 0 ? 0 : Math.round((aceitas / enviadas) * 100),
    };
  }, [app.propostas]);

  const lista = useMemo(
    () =>
      app.propostas
        .filter((p) => filtro === 'todos' || p.status === filtro)
        .slice()
        .sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm)),
    [app.propostas, filtro],
  );

  function criar() {
    const nova = app.criarProposta(profissao);
    if (nova) irPara(`/p/${nova.id}`);
  }

  return (
    <div className="space-y-5">
      {app.falhaAoSalvar && (
        <Aviso tom="alerta">
          Não foi possível gravar no navegador. Se estiver em aba anônima, os dados somem ao fechar —
          exporte um backup em Configurações.
        </Aviso>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Metrica rotulo="Aguardando resposta" valor={formatarCentavos(resumo.aberto)} />
        <Metrica rotulo="Fechado" valor={formatarCentavos(resumo.ganho)} destaque />
        <Metrica rotulo="Taxa de conversão" valor={`${resumo.conversao}%`} />
      </div>

      <Cartao>
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-52 flex-1">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Novo orçamento — escolha o modelo
            </span>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-100"
              value={profissao}
              onChange={(e) => setProfissao(e.target.value)}
            >
              <option value="">Em branco</option>
              {PROFISSOES.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.nome}
                </option>
              ))}
            </select>
          </label>
          <Botao variante="primario" aoClicar={criar} desabilitado={app.cota.bloqueado}>
            Criar orçamento
          </Botao>
        </div>

        {app.cota.bloqueado ? (
          <div className="mt-3">
            <Aviso tom="alerta">
              Você usou os {app.cota.limite} orçamentos gratuitos deste mês. Ative o Pro em
              Configurações para continuar criando sem limite.
            </Aviso>
          </div>
        ) : (
          app.plano === 'gratis' && (
            <p className="mt-2 text-xs text-slate-500">
              Restam {app.cota.restantes} de {app.cota.limite} orçamentos gratuitos neste mês.
            </p>
          )
        )}
      </Cartao>

      <div className="flex flex-wrap gap-2">
        {(['todos', 'rascunho', 'enviado', 'aceito', 'recusado'] as const).map((chave) => (
          <button
            key={chave}
            type="button"
            onClick={() => setFiltro(chave)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              filtro === chave
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {chave === 'todos' ? 'Todos' : STATUS_LABEL[chave]}
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <Cartao className="text-center">
          <p className="text-sm text-slate-500">
            Nenhum orçamento por aqui ainda. Escolha um modelo acima e crie o primeiro.
          </p>
        </Cartao>
      ) : (
        <ul className="space-y-2">
          {lista.map((p) => {
            const totais = calcularTotais(p);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => irPara(`/p/${p.id}`)}
                  className="flex w-full flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-marca-500 hover:shadow-sm"
                >
                  <span className="w-14 shrink-0 text-xs font-semibold tabular-nums text-slate-400">
                    #{String(p.numero).padStart(4, '0')}
                  </span>
                  <span className="min-w-40 flex-1">
                    <span className="block font-medium text-slate-900">
                      {p.titulo || 'Orçamento sem título'}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {p.cliente.nome || 'Cliente não informado'}
                    </span>
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CORES_STATUS[p.status]}`}>
                    {STATUS_LABEL[p.status]}
                  </span>
                  <span className="font-semibold tabular-nums text-slate-900">
                    {formatarCentavos(totais.totalCentavos)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
