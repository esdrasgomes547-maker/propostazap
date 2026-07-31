import { useEffect, useMemo, useState } from 'react';
import { calcularTotais, valorItemCentavos } from '../lib/calc';
import { itemVazio, novoId } from '../lib/factory';
import { formatarCentavos, formatarPercentual } from '../lib/money';
import { acharProfissao, PROFISSOES } from '../lib/professions';
import { irPara } from '../lib/router';
import { codificarProposta } from '../lib/share';
import { STATUS_LABEL, UNIDADES, type Item, type Proposta, type StatusProposta } from '../lib/types';
import type { App } from '../lib/useApp';
import { linkWhatsApp, mensagemProposta } from '../lib/whatsapp';
import { Aviso, Botao, Campo, CampoMoeda, CampoNumero, CampoQuantidade, Cartao, Titulo } from './base';
import { Documento } from './Documento';

function baseDaAplicacao(): string {
  const { origin, pathname } = globalThis.location;
  return `${origin}${pathname}`;
}

export function Editor({ app, id }: { app: App; id: string }) {
  const proposta = app.propostas.find((p) => p.id === id);
  const [aba, setAba] = useState<'editar' | 'visualizar'>('editar');
  const [link, setLink] = useState('');
  const [gerandoLink, setGerandoLink] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const totais = useMemo(
    () => (proposta ? calcularTotais(proposta) : null),
    [proposta],
  );

  // O link carrega o documento inteiro; precisa ser refeito a cada alteração.
  useEffect(() => {
    setLink('');
    setCopiado(false);
  }, [proposta?.atualizadoEm]);

  if (!proposta || !totais) {
    return (
      <Cartao className="text-center">
        <p className="text-sm text-slate-500">Este orçamento não existe mais.</p>
        <div className="mt-3 flex justify-center">
          <Botao aoClicar={() => irPara('/')}>Voltar ao painel</Botao>
        </div>
      </Cartao>
    );
  }

  const profissao = acharProfissao(proposta.profissaoSlug);

  function mudar(campos: Partial<Proposta>) {
    app.atualizarProposta({ ...proposta!, ...campos });
  }

  function mudarItem(itemId: string, campos: Partial<Item>) {
    mudar({ itens: proposta!.itens.map((i) => (i.id === itemId ? { ...i, ...campos } : i)) });
  }

  function adicionarDoCatalogo(indice: number) {
    const modelo = profissao?.servicos[indice];
    if (!modelo) return;
    mudar({
      itens: [
        ...proposta!.itens,
        {
          id: novoId(),
          descricao: modelo.descricao,
          quantidadeMil: 1000,
          unidade: modelo.unidade,
          valorUnitCentavos: modelo.valorSugeridoCentavos,
          custoUnitCentavos: 0,
        },
      ],
    });
  }

  async function gerarLink(): Promise<string> {
    if (link) return link;
    setGerandoLink(true);
    try {
      const token = await codificarProposta({ v: 1, empresa: app.empresa, proposta: proposta! });
      const url = `${baseDaAplicacao()}#/ver/${token}`;
      setLink(url);
      return url;
    } finally {
      setGerandoLink(false);
    }
  }

  async function enviarWhatsApp() {
    const url = await gerarLink();
    const texto = mensagemProposta(app.empresa, proposta!, url);
    globalThis.open(linkWhatsApp(proposta!.cliente.telefone, texto), '_blank', 'noopener,noreferrer');
    if (proposta!.status === 'rascunho') mudar({ status: 'enviado' });
  }

  async function copiarLink() {
    const url = await gerarLink();
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="sem-impressao flex flex-wrap items-center gap-2">
        <Botao variante="fantasma" aoClicar={() => irPara('/')}>
          ← Painel
        </Botao>
        <div className="ml-auto flex gap-1 rounded-lg bg-slate-200 p-1">
          {(['editar', 'visualizar'] as const).map((chave) => (
            <button
              key={chave}
              type="button"
              onClick={() => setAba(chave)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition ${
                aba === chave ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              {chave === 'editar' ? 'Editar' : 'Visualizar'}
            </button>
          ))}
        </div>
      </div>

      {aba === 'visualizar' ? (
        <>
          <div className="sem-impressao flex flex-wrap gap-2">
            <Botao variante="primario" aoClicar={enviarWhatsApp} desabilitado={gerandoLink}>
              Enviar no WhatsApp
            </Botao>
            <Botao aoClicar={() => globalThis.print()}>Salvar em PDF / imprimir</Botao>
            <Botao aoClicar={copiarLink} desabilitado={gerandoLink}>
              {copiado ? 'Link copiado!' : 'Copiar link do orçamento'}
            </Botao>
          </div>
          {link && (
            <div className="sem-impressao">
              <Aviso>
                O link carrega o orçamento inteiro dentro do próprio endereço — funciona sem cadastro
                e sem servidor. Quem tiver o link vê a proposta, então mande só para o cliente.
              </Aviso>
            </div>
          )}
          <Documento empresa={app.empresa} proposta={proposta} />
        </>
      ) : (
        <>
          <Cartao>
            <Titulo>Identificação</Titulo>
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo
                rotulo="Título do orçamento"
                valor={proposta.titulo}
                aoMudar={(v) => mudar({ titulo: v })}
                dica="Ex.: Instalação de quadro elétrico"
                maximo={160}
              />
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Situação</span>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-100"
                  value={proposta.status}
                  onChange={(e) => mudar({ status: e.target.value as StatusProposta })}
                >
                  {(Object.keys(STATUS_LABEL) as StatusProposta[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </Cartao>

          <Cartao>
            <Titulo>Cliente</Titulo>
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo
                rotulo="Nome"
                valor={proposta.cliente.nome}
                aoMudar={(v) => mudar({ cliente: { ...proposta.cliente, nome: v } })}
                maximo={120}
              />
              <Campo
                rotulo="WhatsApp"
                valor={proposta.cliente.telefone}
                aoMudar={(v) => mudar({ cliente: { ...proposta.cliente, telefone: v } })}
                dica="(11) 99999-9999"
                maximo={32}
              />
              <Campo
                rotulo="CPF/CNPJ"
                valor={proposta.cliente.documento}
                aoMudar={(v) => mudar({ cliente: { ...proposta.cliente, documento: v } })}
                maximo={32}
              />
              <Campo
                rotulo="E-mail"
                valor={proposta.cliente.email}
                aoMudar={(v) => mudar({ cliente: { ...proposta.cliente, email: v } })}
                tipo="email"
                maximo={160}
              />
              <div className="sm:col-span-2">
                <Campo
                  rotulo="Endereço do serviço"
                  valor={proposta.cliente.endereco}
                  aoMudar={(v) => mudar({ cliente: { ...proposta.cliente, endereco: v } })}
                  maximo={240}
                />
              </div>
            </div>
          </Cartao>

          <Cartao>
            <div className="mb-3 flex items-center justify-between">
              <Titulo>Itens</Titulo>
              <Botao aoClicar={() => mudar({ itens: [...proposta.itens, itemVazio()] })}>
                + Item
              </Botao>
            </div>

            {profissao && (
              <div className="mb-4">
                <p className="mb-2 text-xs text-slate-500">
                  Serviços comuns de {profissao.nome.toLowerCase()} — clique para adicionar:
                </p>
                <div className="flex flex-wrap gap-2">
                  {profissao.servicos.map((s, i) => (
                    <button
                      key={s.descricao}
                      type="button"
                      onClick={() => adicionarDoCatalogo(i)}
                      className="rounded-full bg-marca-50 px-3 py-1 text-xs font-medium text-marca-700 ring-1 ring-marca-100 transition hover:bg-marca-100"
                    >
                      + {s.descricao}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {proposta.itens.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                Nenhum item ainda. Use os atalhos acima ou adicione um item em branco.
              </p>
            ) : (
              <ul className="space-y-3">
                {proposta.itens.map((item) => (
                  <li key={item.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="mb-2 flex gap-2">
                      <input
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-100"
                        placeholder="Descrição do serviço ou material"
                        aria-label="Descrição do item"
                        value={item.descricao}
                        maxLength={400}
                        onChange={(e) => mudarItem(item.id, { descricao: e.target.value })}
                      />
                      <Botao
                        variante="perigo"
                        aoClicar={() =>
                          mudar({ itens: proposta.itens.filter((i) => i.id !== item.id) })
                        }
                      >
                        ✕
                      </Botao>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                      <div>
                        <span className="mb-1 block text-xs text-slate-500">Qtd.</span>
                        <CampoQuantidade
                          rotulo="Quantidade"
                          quantidadeMil={item.quantidadeMil}
                          aoMudar={(q) => mudarItem(item.id, { quantidadeMil: q })}
                        />
                      </div>
                      <div>
                        <span className="mb-1 block text-xs text-slate-500">Unidade</span>
                        <select
                          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm outline-none focus:border-marca-500"
                          aria-label="Unidade"
                          value={item.unidade}
                          onChange={(e) =>
                            mudarItem(item.id, { unidade: e.target.value as Item['unidade'] })
                          }
                        >
                          {UNIDADES.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <span className="mb-1 block text-xs text-slate-500">Venda unit.</span>
                        <CampoMoeda
                          rotulo="Valor unitário"
                          centavos={item.valorUnitCentavos}
                          aoMudar={(c) => mudarItem(item.id, { valorUnitCentavos: c })}
                          compacto
                        />
                      </div>
                      <div>
                        <span className="mb-1 block text-xs text-slate-500">Custo unit.</span>
                        <CampoMoeda
                          rotulo="Custo unitário"
                          centavos={item.custoUnitCentavos}
                          aoMudar={(c) => mudarItem(item.id, { custoUnitCentavos: c })}
                          compacto
                        />
                      </div>
                      <div className="flex flex-col justify-end">
                        <span className="mb-1 block text-xs text-slate-500">Total</span>
                        <p className="py-2 text-right text-sm font-semibold tabular-nums">
                          {formatarCentavos(valorItemCentavos(item), false)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>

          <Cartao>
            <Titulo>Desconto e resultado</Titulo>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Tipo de desconto</span>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-marca-500"
                  value={proposta.descontoTipo}
                  onChange={(e) =>
                    mudar({
                      descontoTipo: e.target.value as Proposta['descontoTipo'],
                      descontoValor: 0,
                    })
                  }
                >
                  <option value="valor">Valor em reais</option>
                  <option value="percentual">Percentual</option>
                </select>
              </label>
              {proposta.descontoTipo === 'valor' ? (
                <CampoMoeda
                  rotulo="Desconto (R$)"
                  centavos={proposta.descontoValor}
                  aoMudar={(c) => mudar({ descontoValor: c })}
                />
              ) : (
                <CampoNumero
                  rotulo="Desconto (%)"
                  valor={Math.round(proposta.descontoValor / 100)}
                  aoMudar={(v) => mudar({ descontoValor: v * 100 })}
                  maximo={100}
                  sufixo="%"
                />
              )}
            </div>

            <dl className="mt-4 space-y-1 border-t border-slate-200 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Subtotal</dt>
                <dd className="tabular-nums">{formatarCentavos(totais.subtotalCentavos)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Desconto</dt>
                <dd className="tabular-nums">− {formatarCentavos(totais.descontoCentavos)}</dd>
              </div>
              <div className="flex justify-between text-base font-bold">
                <dt>Total ao cliente</dt>
                <dd className="tabular-nums text-marca-600">
                  {formatarCentavos(totais.totalCentavos)}
                </dd>
              </div>
              <div className="mt-2 flex justify-between border-t border-dashed border-slate-200 pt-2">
                <dt className="text-slate-500">Custo declarado</dt>
                <dd className="tabular-nums">{formatarCentavos(totais.custoCentavos)}</dd>
              </div>
              <div className="flex justify-between font-semibold">
                <dt className="text-slate-500">Seu lucro</dt>
                <dd
                  className={`tabular-nums ${totais.lucroCentavos < 0 ? 'text-red-600' : 'text-slate-900'}`}
                >
                  {formatarCentavos(totais.lucroCentavos)} ({formatarPercentual(totais.margemCentesimos)})
                </dd>
              </div>
            </dl>

            {totais.lucroCentavos < 0 && (
              <div className="mt-3">
                <Aviso tom="alerta">
                  O custo declarado está acima do total cobrado. Do jeito que está, esse serviço dá
                  prejuízo.
                </Aviso>
              </div>
            )}
          </Cartao>

          <Cartao>
            <Titulo>Condições</Titulo>
            <div className="grid gap-3 sm:grid-cols-3">
              <CampoNumero
                rotulo="Prazo de execução"
                valor={proposta.prazoDias}
                aoMudar={(v) => mudar({ prazoDias: v })}
                sufixo="dias"
              />
              <CampoNumero
                rotulo="Validade da proposta"
                valor={proposta.validadeDias}
                aoMudar={(v) => mudar({ validadeDias: v })}
                sufixo="dias"
              />
              <CampoNumero
                rotulo="Garantia"
                valor={proposta.garantiaMeses}
                aoMudar={(v) => mudar({ garantiaMeses: v })}
                maximo={600}
                sufixo="meses"
              />
            </div>
            <div className="mt-3 grid gap-3">
              <Campo
                rotulo="Condições de pagamento"
                valor={proposta.condicoesPagamento}
                aoMudar={(v) => mudar({ condicoesPagamento: v })}
                multilinha
                maximo={1000}
              />
              <Campo
                rotulo="Observações"
                valor={proposta.observacoes}
                aoMudar={(v) => mudar({ observacoes: v })}
                multilinha
                maximo={4000}
                dica="O que não está incluso, responsabilidades do cliente, condições especiais…"
              />
            </div>
          </Cartao>

          <Cartao>
            <Titulo>Modelo de profissão</Titulo>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-marca-500"
              aria-label="Modelo de profissão"
              value={proposta.profissaoSlug}
              onChange={(e) => mudar({ profissaoSlug: e.target.value })}
            >
              <option value="">Nenhum</option>
              {PROFISSOES.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.nome}
                </option>
              ))}
            </select>
          </Cartao>

          <div className="flex flex-wrap gap-2">
            <Botao
              aoClicar={() => {
                const copia = app.duplicarProposta(proposta.id);
                if (copia) irPara(`/p/${copia.id}`);
              }}
              desabilitado={app.cota.bloqueado}
            >
              Duplicar
            </Botao>
            <Botao
              variante="perigo"
              aoClicar={() => {
                if (globalThis.confirm('Excluir este orçamento? Não dá para desfazer.')) {
                  app.removerProposta(proposta.id);
                  irPara('/');
                }
              }}
            >
              Excluir
            </Botao>
            <Botao variante="primario" className="ml-auto" aoClicar={() => setAba('visualizar')}>
              Ver e enviar →
            </Botao>
          </div>
        </>
      )}
    </div>
  );
}
