/**
 * Configuração comercial. Tudo aqui vem de variável de ambiente no build, para
 * o preço e a chave PIX mudarem sem mexer no código.
 *
 * Defina no .env (ou no painel do host):
 *   VITE_PIX_CHAVE, VITE_PIX_NOME, VITE_PIX_CIDADE, VITE_WHATSAPP_SUPORTE
 */

function env(nome: string, padrao = ''): string {
  const valor = import.meta.env?.[nome];
  return typeof valor === 'string' ? valor.trim() : padrao;
}

export interface Plano {
  id: 'anual' | 'mensal';
  nome: string;
  precoCentavos: number;
  descricao: string;
  /** Meses de validade da licença emitida. */
  meses: number;
  destaque: boolean;
}

export const PLANOS: Plano[] = [
  {
    id: 'anual',
    nome: 'Pro anual',
    precoCentavos: 19_700,
    descricao: 'Um pagamento por ano. Sai por menos de R$ 17 por mês.',
    meses: 12,
    destaque: true,
  },
  {
    id: 'mensal',
    nome: 'Pro mensal',
    precoCentavos: 2_900,
    descricao: 'Renova quando quiser, sem fidelidade.',
    meses: 1,
    destaque: false,
  },
];

export const PIX = {
  chave: env('VITE_PIX_CHAVE'),
  nome: env('VITE_PIX_NOME', 'PropostaZap'),
  cidade: env('VITE_PIX_CIDADE', 'BRASIL'),
};

/** WhatsApp para onde o cliente manda o comprovante. Só dígitos. */
export const WHATSAPP_SUPORTE = env('VITE_WHATSAPP_SUPORTE').replace(/\D/g, '');

/** Sem chave PIX configurada não há como cobrar; a tela avisa em vez de fingir. */
export const COBRANCA_CONFIGURADA = PIX.chave.length > 0;
