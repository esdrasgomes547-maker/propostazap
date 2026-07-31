import { describe, expect, it } from 'vitest';
import {
  formatarCentavos,
  formatarPercentual,
  formatarQuantidade,
  parseMoedaParaCentavos,
  parseQuantidadeParaMil,
} from './money';

describe('parseMoedaParaCentavos', () => {
  it('lê o formato brasileiro com separador de milhar', () => {
    expect(parseMoedaParaCentavos('1.234,56')).toBe(123456);
    expect(parseMoedaParaCentavos('R$ 1.234,56')).toBe(123456);
    expect(parseMoedaParaCentavos('12.345.678,90')).toBe(1234567890);
  });

  it('lê o formato com ponto decimal', () => {
    expect(parseMoedaParaCentavos('1234.56')).toBe(123456);
    expect(parseMoedaParaCentavos('0.5')).toBe(50);
  });

  it('lê inteiros sem decimal', () => {
    expect(parseMoedaParaCentavos('1234')).toBe(123400);
    expect(parseMoedaParaCentavos('1.234')).toBe(123400);
    expect(parseMoedaParaCentavos('0')).toBe(0);
  });

  it('trata entrada vazia ou inválida como zero', () => {
    expect(parseMoedaParaCentavos('')).toBe(0);
    expect(parseMoedaParaCentavos('   ')).toBe(0);
    expect(parseMoedaParaCentavos('abc')).toBe(0);
    expect(parseMoedaParaCentavos('R$')).toBe(0);
  });

  it('nunca devolve negativo, NaN ou Infinity', () => {
    expect(parseMoedaParaCentavos('-50')).toBe(5000);
    expect(parseMoedaParaCentavos('Infinity')).toBe(0);
    expect(parseMoedaParaCentavos('1e309')).toBe(0);
  });

  it('trunca acima do teto de segurança', () => {
    expect(parseMoedaParaCentavos('999999999999999')).toBe(99999999999);
  });

  it('arredonda centavos excedentes', () => {
    expect(parseMoedaParaCentavos('1,005')).toBe(101);
    expect(parseMoedaParaCentavos('1,004')).toBe(100);
  });
});

describe('formatarCentavos', () => {
  it('formata no padrão brasileiro', () => {
    expect(formatarCentavos(123456)).toBe('R$ 1.234,56');
    expect(formatarCentavos(0)).toBe('R$ 0,00');
    expect(formatarCentavos(5)).toBe('R$ 0,05');
  });

  it('aceita omitir o símbolo', () => {
    expect(formatarCentavos(123456, false)).toBe('1.234,56');
  });

  it('não quebra com valor inválido', () => {
    expect(formatarCentavos(Number.NaN)).toBe('R$ 0,00');
  });
});

describe('quantidade', () => {
  it('lê fracionários', () => {
    expect(parseQuantidadeParaMil('1,5')).toBe(1500);
    expect(parseQuantidadeParaMil('2')).toBe(2000);
    expect(parseQuantidadeParaMil('0,125')).toBe(125);
  });

  it('trata vazio como zero e nunca aceita negativo', () => {
    expect(parseQuantidadeParaMil('')).toBe(0);
    expect(parseQuantidadeParaMil('-3')).toBe(3000);
  });

  it('formata sem casas desnecessárias', () => {
    expect(formatarQuantidade(2000)).toBe('2');
    expect(formatarQuantidade(1500)).toBe('1,5');
    expect(formatarQuantidade(125)).toBe('0,125');
  });
});

describe('formatarPercentual', () => {
  it('formata centésimos de por cento', () => {
    expect(formatarPercentual(2550)).toBe('25,5%');
    expect(formatarPercentual(1000)).toBe('10%');
    expect(formatarPercentual(0)).toBe('0%');
  });
});
