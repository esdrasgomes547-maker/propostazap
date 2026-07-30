import { calcularTotais } from './calc';
import { formatarCentavos } from './money';
import { telefoneDigitos } from './sanitize';
import type { Empresa, Proposta } from './types';

/** Códigos de país não são adivinháveis; assumimos Brasil quando vier sem DDI. */
function normalizarBrasil(numero: string): string {
  const digitos = telefoneDigitos(numero);
  if (!digitos) return '';
  if (digitos.length <= 11) return `55${digitos}`;
  return digitos;
}

export function mensagemProposta(
  empresa: Empresa,
  proposta: Proposta,
  linkPublico: string,
): string {
  const totais = calcularTotais(proposta);
  const remetente = empresa.nome || 'seu prestador de serviço';
  const titulo = proposta.titulo || 'Orçamento';
  const saudacao = proposta.cliente.nome ? `Olá, ${proposta.cliente.nome}!` : 'Olá!';

  const linhas = [
    saudacao,
    '',
    `Segue o orçamento *${titulo}* (nº ${proposta.numero}) de ${remetente}.`,
    '',
    `Valor total: *${formatarCentavos(totais.totalCentavos)}*`,
  ];

  if (proposta.prazoDias > 0) linhas.push(`Prazo de execução: ${proposta.prazoDias} dia(s)`);
  if (proposta.validadeDias > 0) linhas.push(`Validade da proposta: ${proposta.validadeDias} dia(s)`);
  if (proposta.condicoesPagamento) linhas.push(`Pagamento: ${proposta.condicoesPagamento}`);
  if (linkPublico) linhas.push('', `Ver proposta completa: ${linkPublico}`);

  return linhas.join('\n');
}

/**
 * Monta o link do WhatsApp. O texto vai sempre por encodeURIComponent, então
 * conteúdo do usuário não consegue escapar para outro parâmetro da query.
 */
export function linkWhatsApp(telefone: string, mensagem: string): string {
  const numero = normalizarBrasil(telefone);
  const texto = encodeURIComponent(mensagem);
  return numero
    ? `https://wa.me/${numero}?text=${texto}`
    : `https://wa.me/?text=${texto}`;
}
