import { describe, expect, it } from 'vitest';
import { calcularTotais, valorItemCentavos } from './calc';
import { propostaVazia } from './factory';
import type { Item, Proposta } from './types';

function item(parcial: Partial<Item>): Item {
  return {
    id: 'i1',
    descricao: 'Serviço',
    quantidadeMil: 1000,
    unidade: 'un',
    valorUnitCentavos: 0,
    custoUnitCentavos: 0,
    ...parcial,
  };
}

function proposta(parcial: Partial<Proposta>): Proposta {
  return { ...propostaVazia(1), ...parcial };
}

describe('valorItemCentavos', () => {
  it('multiplica quantidade fracionária pelo valor unitário', () => {
    expect(valorItemCentavos(item({ quantidadeMil: 2500, valorUnitCentavos: 1000 }))).toBe(2500);
  });

  it('arredonda meio para cima', () => {
    expect(valorItemCentavos(item({ quantidadeMil: 1, valorUnitCentavos: 500 }))).toBe(1);
    expect(valorItemCentavos(item({ quantidadeMil: 1, valorUnitCentavos: 499 }))).toBe(0);
  });

  it('não estoura precisão com valores absurdos', () => {
    const v = valorItemCentavos(
      item({ quantidadeMil: 9_999_999_000, valorUnitCentavos: 99_999_999_999 }),
    );
    expect(Number.isSafeInteger(v)).toBe(true);
  });
});

describe('calcularTotais', () => {
  it('soma itens sem desconto', () => {
    const t = calcularTotais(
      proposta({
        itens: [
          item({ id: 'a', quantidadeMil: 2000, valorUnitCentavos: 5000 }),
          item({ id: 'b', quantidadeMil: 1000, valorUnitCentavos: 12345 }),
        ],
      }),
    );
    expect(t.subtotalCentavos).toBe(22345);
    expect(t.descontoCentavos).toBe(0);
    expect(t.totalCentavos).toBe(22345);
  });

  it('aplica desconto em valor', () => {
    const t = calcularTotais(
      proposta({
        itens: [item({ valorUnitCentavos: 10000 })],
        descontoTipo: 'valor',
        descontoValor: 2500,
      }),
    );
    expect(t.descontoCentavos).toBe(2500);
    expect(t.totalCentavos).toBe(7500);
  });

  it('aplica desconto percentual', () => {
    const t = calcularTotais(
      proposta({
        itens: [item({ valorUnitCentavos: 10000 })],
        descontoTipo: 'percentual',
        descontoValor: 1050, // 10,5%
      }),
    );
    expect(t.descontoCentavos).toBe(1050);
    expect(t.totalCentavos).toBe(8950);
  });

  it('nunca deixa o total ficar negativo', () => {
    const t = calcularTotais(
      proposta({
        itens: [item({ valorUnitCentavos: 10000 })],
        descontoTipo: 'valor',
        descontoValor: 999999,
      }),
    );
    expect(t.descontoCentavos).toBe(10000);
    expect(t.totalCentavos).toBe(0);
  });

  it('limita desconto percentual acima de 100%', () => {
    const t = calcularTotais(
      proposta({
        itens: [item({ valorUnitCentavos: 10000 })],
        descontoTipo: 'percentual',
        descontoValor: 50000,
      }),
    );
    expect(t.totalCentavos).toBe(0);
  });

  it('calcula custo, lucro e margem sobre a venda', () => {
    const t = calcularTotais(
      proposta({
        itens: [item({ quantidadeMil: 1000, valorUnitCentavos: 20000, custoUnitCentavos: 15000 })],
      }),
    );
    expect(t.custoCentavos).toBe(15000);
    expect(t.lucroCentavos).toBe(5000);
    expect(t.margemCentesimos).toBe(2500); // 25%
  });

  it('reduz a margem quando há desconto', () => {
    const t = calcularTotais(
      proposta({
        itens: [item({ valorUnitCentavos: 20000, custoUnitCentavos: 15000 })],
        descontoTipo: 'valor',
        descontoValor: 2000,
      }),
    );
    expect(t.totalCentavos).toBe(18000);
    expect(t.lucroCentavos).toBe(3000);
    expect(t.margemCentesimos).toBe(1667);
  });

  it('devolve margem zero quando o total é zero', () => {
    const t = calcularTotais(proposta({ itens: [] }));
    expect(t.totalCentavos).toBe(0);
    expect(t.margemCentesimos).toBe(0);
  });

  it('aceita margem negativa quando o custo supera a venda', () => {
    const t = calcularTotais(
      proposta({
        itens: [item({ valorUnitCentavos: 10000, custoUnitCentavos: 12000 })],
      }),
    );
    expect(t.lucroCentavos).toBe(-2000);
    expect(t.margemCentesimos).toBe(-2000);
  });

  it('ignora itens corrompidos sem quebrar', () => {
    const t = calcularTotais(
      proposta({
        itens: [
          item({ quantidadeMil: Number.NaN, valorUnitCentavos: 100 }),
          item({ id: 'b', valorUnitCentavos: 100 }),
        ],
      }),
    );
    expect(t.subtotalCentavos).toBe(100);
  });
});
