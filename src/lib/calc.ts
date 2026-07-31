import { MAX_CENTAVOS } from './money';
import type { Item, Proposta, Totais } from './types';

const TOTAIS_ZERADOS: Totais = {
  subtotalCentavos: 0,
  descontoCentavos: 0,
  totalCentavos: 0,
  custoCentavos: 0,
  lucroCentavos: 0,
  margemCentesimos: 0,
};

function inteiroSeguro(valor: unknown): number {
  return typeof valor === 'number' && Number.isFinite(valor) ? Math.trunc(valor) : 0;
}

/**
 * quantidadeMil * valorUnitCentavos / 1000, arredondado meio para cima.
 * Satura em MAX_CENTAVOS em vez de perder precisão silenciosamente.
 */
function multiplicarPorQuantidade(quantidadeMil: number, unitarioCentavos: number): number {
  const q = Math.max(0, inteiroSeguro(quantidadeMil));
  const u = Math.max(0, inteiroSeguro(unitarioCentavos));
  if (q === 0 || u === 0) return 0;

  const bruto = q * u;
  if (!Number.isSafeInteger(bruto)) return MAX_CENTAVOS;

  return Math.min(Math.round(bruto / 1000), MAX_CENTAVOS);
}

export function valorItemCentavos(item: Item): number {
  return multiplicarPorQuantidade(item?.quantidadeMil, item?.valorUnitCentavos);
}

export function custoItemCentavos(item: Item): number {
  return multiplicarPorQuantidade(item?.quantidadeMil, item?.custoUnitCentavos);
}

export function calcularTotais(proposta: Proposta): Totais {
  const itens = Array.isArray(proposta?.itens) ? proposta.itens : [];
  if (itens.length === 0) return { ...TOTAIS_ZERADOS };

  let subtotalCentavos = 0;
  let custoCentavos = 0;

  for (const item of itens) {
    subtotalCentavos = Math.min(subtotalCentavos + valorItemCentavos(item), MAX_CENTAVOS);
    custoCentavos = Math.min(custoCentavos + custoItemCentavos(item), MAX_CENTAVOS);
  }

  const descontoBruto = Math.max(0, inteiroSeguro(proposta?.descontoValor));
  const descontoCalculado =
    proposta?.descontoTipo === 'percentual'
      ? Math.round((subtotalCentavos * descontoBruto) / 10_000)
      : descontoBruto;

  const descontoCentavos = Math.min(descontoCalculado, subtotalCentavos);
  const totalCentavos = subtotalCentavos - descontoCentavos;
  const lucroCentavos = totalCentavos - custoCentavos;
  const margemCentesimos =
    totalCentavos > 0 ? Math.round((lucroCentavos * 10_000) / totalCentavos) : 0;

  return {
    subtotalCentavos,
    descontoCentavos,
    totalCentavos,
    custoCentavos,
    lucroCentavos,
    margemCentesimos,
  };
}
