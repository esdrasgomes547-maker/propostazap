/**
 * Aritmética monetária em inteiros. Nenhum valor em reais circula como float:
 * dinheiro é sempre centavos e quantidade é sempre milésimos de unidade.
 */

/** R$ 999.999.999,99 — teto que mantém todo cálculo dentro de Number.MAX_SAFE_INTEGER. */
export const MAX_CENTAVOS = 99_999_999_999;
/** 9.999.999 unidades. */
export const MAX_QUANTIDADE_MIL = 9_999_999_000;

const APENAS_NUMERO = /^[0-9.,]+$/;

/**
 * Separa a entrada em parte inteira e fracionária, resolvendo a ambiguidade
 * entre ponto decimal e separador de milhar do jeito que o brasileiro digita.
 */
function separarPartes(bruto: string): { inteiro: string; fracao: string } | null {
  const limpo = bruto
    .replace(/R\$/gi, '')
    .replace(/\s/g, '')
    .replace(/-/g, '');

  if (!limpo || !APENAS_NUMERO.test(limpo)) return null;

  const temVirgula = limpo.includes(',');
  const temPonto = limpo.includes('.');

  let separadorDecimal: ',' | '.' | null = null;

  if (temVirgula) {
    // Vírgula sempre vence: em pt-BR ela é o separador decimal.
    separadorDecimal = ',';
  } else if (temPonto) {
    // Só ponto: é milhar apenas se todos os grupos após o primeiro tiverem 3 dígitos.
    const grupos = limpo.split('.');
    const todosMilhar = grupos.slice(1).every((g) => g.length === 3);
    separadorDecimal = todosMilhar ? null : '.';
  }

  if (separadorDecimal === null) {
    return { inteiro: limpo.replace(/[.,]/g, ''), fracao: '' };
  }

  const corte = limpo.lastIndexOf(separadorDecimal);
  const inteiro = limpo.slice(0, corte).replace(/[.,]/g, '');
  const fracao = limpo.slice(corte + 1).replace(/[.,]/g, '');
  return { inteiro, fracao };
}

/** Converte partes em inteiro escalado, arredondando meio para cima. */
function escalar(inteiro: string, fracao: string, casas: number, teto: number): number {
  const base = inteiro === '' ? 0 : Number(inteiro);
  if (!Number.isFinite(base)) return teto;

  const preenchida = fracao.padEnd(casas + 1, '0');
  const mantidas = preenchida.slice(0, casas);
  const proxima = preenchida.charCodeAt(casas) - 48;

  let escalado = base * 10 ** casas + (mantidas === '' ? 0 : Number(mantidas));
  if (proxima >= 5) escalado += 1;

  if (!Number.isFinite(escalado)) return teto;
  return Math.min(escalado, teto);
}

/** "R$ 1.234,56" -> 123456. Entrada inválida, vazia ou negativa vira 0 / valor absoluto. */
export function parseMoedaParaCentavos(entrada: string): number {
  const partes = separarPartes(entrada ?? '');
  if (!partes) return 0;
  return escalar(partes.inteiro, partes.fracao, 2, MAX_CENTAVOS);
}

/** "1,5" -> 1500 (milésimos de unidade). */
export function parseQuantidadeParaMil(entrada: string): number {
  const partes = separarPartes(entrada ?? '');
  if (!partes) return 0;
  return escalar(partes.inteiro, partes.fracao, 3, MAX_QUANTIDADE_MIL);
}

function agruparMilhar(digitos: string): string {
  return digitos.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** 123456 -> "R$ 1.234,56". */
export function formatarCentavos(centavos: number, comSimbolo = true): string {
  const seguro = Number.isFinite(centavos) ? Math.trunc(centavos) : 0;
  const negativo = seguro < 0;
  const absoluto = Math.abs(seguro);
  const inteiro = agruparMilhar(String(Math.floor(absoluto / 100)));
  const decimal = String(absoluto % 100).padStart(2, '0');
  const numero = `${negativo ? '-' : ''}${inteiro},${decimal}`;
  return comSimbolo ? `R$ ${numero}` : numero;
}

/** 1500 -> "1,5". Remove zeros decimais desnecessários. */
export function formatarQuantidade(quantidadeMil: number): string {
  const seguro = Number.isFinite(quantidadeMil) ? Math.trunc(Math.abs(quantidadeMil)) : 0;
  const inteiro = Math.floor(seguro / 1000);
  const fracao = String(seguro % 1000).padStart(3, '0').replace(/0+$/, '');
  return fracao ? `${agruparMilhar(String(inteiro))},${fracao}` : agruparMilhar(String(inteiro));
}

/** 2550 -> "25,5%". */
export function formatarPercentual(centesimos: number): string {
  const seguro = Number.isFinite(centesimos) ? Math.trunc(centesimos) : 0;
  const negativo = seguro < 0;
  const absoluto = Math.abs(seguro);
  const inteiro = Math.floor(absoluto / 100);
  const fracao = String(absoluto % 100).padStart(2, '0').replace(/0+$/, '');
  const numero = fracao ? `${inteiro},${fracao}` : String(inteiro);
  return `${negativo ? '-' : ''}${numero}%`;
}
