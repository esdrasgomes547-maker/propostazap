import type { Cliente, Empresa, Item, Proposta } from './types';

/** UUID v4 com fallback para navegadores sem crypto.randomUUID. */
export function novoId(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();

  const bytes = new Uint8Array(16);
  if (c?.getRandomValues) {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function clienteVazio(): Cliente {
  return { nome: '', telefone: '', email: '', endereco: '', documento: '' };
}

export function empresaVazia(): Empresa {
  return {
    nome: '',
    documento: '',
    telefone: '',
    email: '',
    endereco: '',
    logoDataUrl: '',
    chavePix: '',
    corPrimaria: '#0f9d58',
    profissaoSlug: '',
  };
}

export function itemVazio(): Item {
  return {
    id: novoId(),
    descricao: '',
    quantidadeMil: 1000,
    unidade: 'un',
    valorUnitCentavos: 0,
    custoUnitCentavos: 0,
  };
}

export function propostaVazia(numero: number, profissaoSlug = ''): Proposta {
  const agora = new Date().toISOString();
  return {
    id: novoId(),
    numero,
    criadoEm: agora,
    atualizadoEm: agora,
    status: 'rascunho',
    titulo: '',
    cliente: clienteVazio(),
    itens: [],
    descontoTipo: 'valor',
    descontoValor: 0,
    prazoDias: 0,
    validadeDias: 15,
    condicoesPagamento: '50% na aprovação e 50% na entrega.',
    garantiaMeses: 3,
    observacoes: '',
    profissaoSlug,
  };
}
