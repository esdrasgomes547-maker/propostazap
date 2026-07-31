import { describe, expect, it } from 'vitest';
import { empresaVazia, propostaVazia } from './factory';
import { linkWhatsApp, mensagemProposta } from './whatsapp';

describe('linkWhatsApp', () => {
  it('acrescenta DDI 55 em número nacional', () => {
    expect(linkWhatsApp('(11) 99999-9999', 'oi')).toBe('https://wa.me/5511999999999?text=oi');
  });

  it('preserva número que já tem DDI', () => {
    expect(linkWhatsApp('+351 912 345 678', 'oi')).toBe('https://wa.me/351912345678?text=oi');
  });

  it('cai para link sem destinatário quando não há número', () => {
    expect(linkWhatsApp('', 'oi')).toBe('https://wa.me/?text=oi');
  });

  it('não deixa o texto escapar para outro parâmetro', () => {
    const link = linkWhatsApp('11999999999', 'a&phone=5599999999999#x');
    expect(link).toBe('https://wa.me/5511999999999?text=a%26phone%3D5599999999999%23x');
    expect(new URL(link).searchParams.get('phone')).toBeNull();
  });

  it('sempre produz uma URL https válida', () => {
    const link = linkWhatsApp('javascript:alert(1)', 'x');
    expect(new URL(link).protocol).toBe('https:');
  });
});

describe('mensagemProposta', () => {
  it('monta a mensagem com total, prazo e link', () => {
    const proposta = {
      ...propostaVazia(12),
      titulo: 'Troca de quadro',
      prazoDias: 3,
      itens: [
        {
          id: 'a',
          descricao: 'Quadro',
          quantidadeMil: 1000,
          unidade: 'un' as const,
          valorUnitCentavos: 95000,
          custoUnitCentavos: 0,
        },
      ],
    };
    proposta.cliente.nome = 'João';

    const texto = mensagemProposta(
      { ...empresaVazia(), nome: 'Elétrica Silva' },
      proposta,
      'https://exemplo.com/#/ver/abc',
    );

    expect(texto).toContain('Olá, João!');
    expect(texto).toContain('Troca de quadro');
    expect(texto).toContain('nº 12');
    expect(texto).toContain('R$ 950,00');
    expect(texto).toContain('Prazo de execução: 3 dia(s)');
    expect(texto).toContain('https://exemplo.com/#/ver/abc');
  });

  it('funciona sem nome de cliente e sem link', () => {
    const texto = mensagemProposta(empresaVazia(), propostaVazia(1), '');
    expect(texto).toContain('Olá!');
    expect(texto).not.toContain('Ver proposta completa');
  });
});
