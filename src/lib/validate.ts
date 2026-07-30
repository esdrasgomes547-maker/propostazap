import { MAX_CENTAVOS, MAX_QUANTIDADE_MIL } from './money';
import {
  COR_PADRAO,
  corHex,
  dataIso,
  dataUrlImagem,
  inteiroEntre,
  telefoneDigitos,
  texto,
  textoMultilinha,
  umDentre,
  urlSegura,
} from './sanitize';
import type {
  Cliente,
  DescontoTipo,
  Empresa,
  Item,
  Proposta,
  PropostaPublica,
  StatusProposta,
  Unidade,
} from './types';
import { UNIDADES } from './types';

/** Tetos que impedem um documento hostil de travar a renderização. */
export const LIMITES = {
  itens: 200,
  nome: 120,
  documento: 32,
  telefone: 32,
  email: 160,
  endereco: 240,
  titulo: 160,
  descricao: 400,
  observacoes: 4000,
  condicoes: 1000,
  pix: 160,
  numero: 999_999,
  dias: 3650,
  meses: 600,
} as const;

const STATUS: readonly StatusProposta[] = ['rascunho', 'enviado', 'aceito', 'recusado'];
const DESCONTOS: readonly DescontoTipo[] = ['valor', 'percentual'];

function objeto(valor: unknown): Record<string, unknown> {
  return valor && typeof valor === 'object' && !Array.isArray(valor)
    ? (valor as Record<string, unknown>)
    : {};
}

/** Slug de profissão: só minúsculas, dígitos e hífen. */
export function slugSeguro(valor: unknown): string {
  if (typeof valor !== 'string') return '';
  return /^[a-z0-9-]{1,60}$/.test(valor) ? valor : '';
}

/**
 * E-mail é só texto: nunca vira href nem é usado como identidade. Validar o
 * formato aqui zeraria o campo a cada tecla, já que "a", "a@" e "a@b" são
 * estados intermediários legítimos de quem está digitando.
 */
function emailSeguro(valor: unknown): string {
  return texto(valor, LIMITES.email);
}

export function validarCliente(bruto: unknown): Cliente {
  const o = objeto(bruto);
  return {
    nome: texto(o.nome, LIMITES.nome),
    telefone: texto(o.telefone, LIMITES.telefone),
    email: emailSeguro(o.email),
    endereco: texto(o.endereco, LIMITES.endereco),
    documento: texto(o.documento, LIMITES.documento),
  };
}

export function validarEmpresa(bruto: unknown): Empresa {
  const o = objeto(bruto);
  return {
    nome: texto(o.nome, LIMITES.nome),
    documento: texto(o.documento, LIMITES.documento),
    telefone: texto(o.telefone, LIMITES.telefone),
    email: emailSeguro(o.email),
    endereco: texto(o.endereco, LIMITES.endereco),
    logoDataUrl: dataUrlImagem(o.logoDataUrl),
    chavePix: texto(o.chavePix, LIMITES.pix),
    corPrimaria: typeof o.corPrimaria === 'string' ? corHex(o.corPrimaria) : COR_PADRAO,
    profissaoSlug: slugSeguro(o.profissaoSlug),
  };
}

export function validarItem(bruto: unknown, indice: number): Item {
  const o = objeto(bruto);
  return {
    id: texto(o.id, 64) || `item-${indice}`,
    descricao: texto(o.descricao, LIMITES.descricao),
    quantidadeMil: inteiroEntre(o.quantidadeMil, 0, MAX_QUANTIDADE_MIL),
    unidade: umDentre<Unidade>(o.unidade, UNIDADES, 'un'),
    valorUnitCentavos: inteiroEntre(o.valorUnitCentavos, 0, MAX_CENTAVOS),
    custoUnitCentavos: inteiroEntre(o.custoUnitCentavos, 0, MAX_CENTAVOS),
  };
}

export function validarProposta(bruto: unknown): Proposta {
  const o = objeto(bruto);
  const itensBrutos = Array.isArray(o.itens) ? o.itens.slice(0, LIMITES.itens) : [];
  const descontoTipo = umDentre<DescontoTipo>(o.descontoTipo, DESCONTOS, 'valor');

  return {
    id: texto(o.id, 64) || `prop-${inteiroEntre(o.numero, 1, LIMITES.numero)}`,
    numero: inteiroEntre(o.numero, 1, LIMITES.numero),
    criadoEm: dataIso(o.criadoEm),
    atualizadoEm: dataIso(o.atualizadoEm),
    status: umDentre<StatusProposta>(o.status, STATUS, 'rascunho'),
    titulo: texto(o.titulo, LIMITES.titulo),
    cliente: validarCliente(o.cliente),
    itens: itensBrutos.map(validarItem),
    descontoTipo,
    descontoValor: inteiroEntre(
      o.descontoValor,
      0,
      descontoTipo === 'percentual' ? 10_000 : MAX_CENTAVOS,
    ),
    prazoDias: inteiroEntre(o.prazoDias, 0, LIMITES.dias),
    validadeDias: inteiroEntre(o.validadeDias, 0, LIMITES.dias),
    condicoesPagamento: textoMultilinha(o.condicoesPagamento, LIMITES.condicoes),
    garantiaMeses: inteiroEntre(o.garantiaMeses, 0, LIMITES.meses),
    observacoes: textoMultilinha(o.observacoes, LIMITES.observacoes),
    profissaoSlug: slugSeguro(o.profissaoSlug),
  };
}

/** Aceita apenas documentos na versão conhecida; o resto vira null. */
export function validarPropostaPublica(bruto: unknown): PropostaPublica | null {
  const o = objeto(bruto);
  if (o.v !== 1) return null;
  if (!o.proposta || typeof o.proposta !== 'object') return null;

  return {
    v: 1,
    empresa: validarEmpresa(o.empresa),
    proposta: validarProposta(o.proposta),
  };
}

/** Reexportado para as telas montarem links de contato sem repetir a checagem. */
export { urlSegura, telefoneDigitos };
