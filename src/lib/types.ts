export type Unidade = 'un' | 'm' | 'm²' | 'm³' | 'h' | 'dia' | 'kg' | 'vb';

export const UNIDADES: Unidade[] = ['un', 'm', 'm²', 'm³', 'h', 'dia', 'kg', 'vb'];

export type StatusProposta = 'rascunho' | 'enviado' | 'aceito' | 'recusado';

export const STATUS_LABEL: Record<StatusProposta, string> = {
  rascunho: 'Rascunho',
  enviado: 'Enviado',
  aceito: 'Aceito',
  recusado: 'Recusado',
};

export type DescontoTipo = 'valor' | 'percentual';

export interface Item {
  id: string;
  descricao: string;
  /** Milésimos de unidade, para evitar erro de ponto flutuante. 1 un = 1000. */
  quantidadeMil: number;
  unidade: Unidade;
  /** Preço de venda unitário, em centavos. */
  valorUnitCentavos: number;
  /** Custo unitário, em centavos. Alimenta o cálculo de margem. */
  custoUnitCentavos: number;
}

export interface Cliente {
  nome: string;
  telefone: string;
  email: string;
  endereco: string;
  documento: string;
}

export interface Empresa {
  nome: string;
  documento: string;
  telefone: string;
  email: string;
  endereco: string;
  /** Data URL de imagem, validada antes de salvar. */
  logoDataUrl: string;
  chavePix: string;
  corPrimaria: string;
  profissaoSlug: string;
}

export interface Proposta {
  id: string;
  numero: number;
  criadoEm: string;
  atualizadoEm: string;
  status: StatusProposta;
  titulo: string;
  cliente: Cliente;
  itens: Item[];
  descontoTipo: DescontoTipo;
  /** Centavos quando tipo 'valor'; centésimos de % quando 'percentual' (10% = 1000). */
  descontoValor: number;
  prazoDias: number;
  validadeDias: number;
  condicoesPagamento: string;
  garantiaMeses: number;
  observacoes: string;
  profissaoSlug: string;
}

export interface Totais {
  subtotalCentavos: number;
  descontoCentavos: number;
  totalCentavos: number;
  custoCentavos: number;
  lucroCentavos: number;
  /** Margem sobre a venda, em centésimos de % (25,5% = 2550). */
  margemCentesimos: number;
}

/** Documento completo que viaja no link público — empresa + proposta. */
export interface PropostaPublica {
  v: 1;
  empresa: Empresa;
  proposta: Proposta;
}
