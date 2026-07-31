import { calcularTotais, valorItemCentavos } from '../lib/calc';
import { formatarCentavos, formatarQuantidade } from '../lib/money';
import { corHex } from '../lib/sanitize';
import type { Empresa, Proposta } from '../lib/types';

function dataBr(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const d = new Date(t);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function validoAte(criadoEm: string, dias: number): string {
  const t = Date.parse(criadoEm);
  if (!Number.isFinite(t) || dias <= 0) return '';
  return dataBr(new Date(t + dias * 86_400_000).toISOString());
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  if (!valor) return null;
  return (
    <p className="text-sm text-slate-600">
      <span className="text-slate-400">{rotulo}: </span>
      {valor}
    </p>
  );
}

/**
 * Render do documento. Todo dado aqui pode ter vindo de um link público, então
 * nada é injetado como HTML: só texto (React escapa) e atributos já validados.
 */
export function Documento({ empresa, proposta }: { empresa: Empresa; proposta: Proposta }) {
  const totais = calcularTotais(proposta);
  const cor = corHex(empresa.corPrimaria);
  const validade = validoAte(proposta.criadoEm, proposta.validadeDias);

  return (
    <article className="folha mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b-4 pb-5" style={{ borderColor: cor }}>
        <div className="flex items-center gap-4">
          {empresa.logoDataUrl && (
            <img
              src={empresa.logoDataUrl}
              alt=""
              className="h-16 w-16 rounded-lg object-contain"
            />
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900">{empresa.nome || 'Sua empresa'}</h1>
            <Linha rotulo="CNPJ/CPF" valor={empresa.documento} />
            <Linha rotulo="Telefone" valor={empresa.telefone} />
            <Linha rotulo="E-mail" valor={empresa.email} />
            <Linha rotulo="Endereço" valor={empresa.endereco} />
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: cor }}>
            Orçamento
          </p>
          <p className="text-2xl font-bold tabular-nums text-slate-900">
            Nº {String(proposta.numero).padStart(4, '0')}
          </p>
          <p className="text-xs text-slate-500">Emitido em {dataBr(proposta.criadoEm)}</p>
          {validade && <p className="text-xs text-slate-500">Válido até {validade}</p>}
        </div>
      </header>

      {proposta.titulo && (
        <h2 className="mt-6 text-lg font-semibold text-slate-900">{proposta.titulo}</h2>
      )}

      <section className="mt-4 rounded-lg bg-slate-50 p-4">
        <p className="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">Cliente</p>
        <p className="font-medium text-slate-900">{proposta.cliente.nome || '—'}</p>
        <Linha rotulo="CPF/CNPJ" valor={proposta.cliente.documento} />
        <Linha rotulo="Telefone" valor={proposta.cliente.telefone} />
        <Linha rotulo="E-mail" valor={proposta.cliente.email} />
        <Linha rotulo="Endereço" valor={proposta.cliente.endereco} />
      </section>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs tracking-wide text-slate-500 uppercase">
              <th className="py-2 pr-2">Descrição</th>
              <th className="py-2 px-2 text-right whitespace-nowrap">Qtd.</th>
              <th className="py-2 px-2 text-left">Un.</th>
              <th className="py-2 px-2 text-right whitespace-nowrap">Valor unit.</th>
              <th className="py-2 pl-2 text-right whitespace-nowrap">Total</th>
            </tr>
          </thead>
          <tbody>
            {proposta.itens.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400">
                  Nenhum item adicionado ainda.
                </td>
              </tr>
            )}
            {proposta.itens.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 align-top">
                <td className="py-2 pr-2">{item.descricao || '—'}</td>
                <td className="py-2 px-2 text-right tabular-nums">
                  {formatarQuantidade(item.quantidadeMil)}
                </td>
                <td className="py-2 px-2 text-slate-500">{item.unidade}</td>
                <td className="py-2 px-2 text-right tabular-nums">
                  {formatarCentavos(item.valorUnitCentavos, false)}
                </td>
                <td className="py-2 pl-2 text-right font-medium tabular-nums">
                  {formatarCentavos(valorItemCentavos(item), false)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <dl className="w-full max-w-xs space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Subtotal</dt>
            <dd className="tabular-nums">{formatarCentavos(totais.subtotalCentavos)}</dd>
          </div>
          {totais.descontoCentavos > 0 && (
            <div className="flex justify-between text-slate-500">
              <dt>Desconto</dt>
              <dd className="tabular-nums">− {formatarCentavos(totais.descontoCentavos)}</dd>
            </div>
          )}
          <div
            className="mt-2 flex justify-between border-t-2 pt-2 text-base font-bold"
            style={{ borderColor: cor }}
          >
            <dt>Total</dt>
            <dd className="tabular-nums" style={{ color: cor }}>
              {formatarCentavos(totais.totalCentavos)}
            </dd>
          </div>
        </dl>
      </div>

      <section className="mt-8 grid gap-4 border-t border-slate-200 pt-5 text-sm sm:grid-cols-2">
        {proposta.prazoDias > 0 && (
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Prazo de execução</p>
            <p>{proposta.prazoDias} dia(s) após a aprovação</p>
          </div>
        )}
        {proposta.garantiaMeses > 0 && (
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Garantia</p>
            <p>{proposta.garantiaMeses} mês(es)</p>
          </div>
        )}
        {proposta.condicoesPagamento && (
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Condições de pagamento</p>
            <p className="whitespace-pre-line">{proposta.condicoesPagamento}</p>
          </div>
        )}
        {empresa.chavePix && (
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Chave PIX</p>
            <p className="break-all">{empresa.chavePix}</p>
          </div>
        )}
        {proposta.observacoes && (
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Observações</p>
            <p className="whitespace-pre-line">{proposta.observacoes}</p>
          </div>
        )}
      </section>

      <footer className="mt-10 grid gap-8 border-t border-slate-200 pt-8 sm:grid-cols-2">
        <div className="text-center">
          <div className="mx-auto mb-1 h-px w-full max-w-56 bg-slate-300" />
          <p className="text-xs text-slate-500">{empresa.nome || 'Prestador'}</p>
        </div>
        <div className="text-center">
          <div className="mx-auto mb-1 h-px w-full max-w-56 bg-slate-300" />
          <p className="text-xs text-slate-500">{proposta.cliente.nome || 'Cliente'}</p>
        </div>
      </footer>
    </article>
  );
}
