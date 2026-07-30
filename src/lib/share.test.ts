import { describe, expect, it } from 'vitest';
import { codificarProposta, decodificarProposta } from './share';
import { empresaVazia, propostaVazia } from './factory';
import type { PropostaPublica } from './types';

function doc(): PropostaPublica {
  return {
    v: 1,
    empresa: { ...empresaVazia(), nome: 'Elétrica Silva', profissaoSlug: 'eletricista' },
    proposta: {
      ...propostaVazia(7, 'eletricista'),
      titulo: 'Instalação de quadro',
      cliente: { ...propostaVazia(7).cliente, nome: 'João', telefone: '(11) 99999-9999' },
      itens: [
        {
          id: 'a',
          descricao: 'Disjuntor 40A',
          quantidadeMil: 3000,
          unidade: 'un',
          valorUnitCentavos: 4500,
          custoUnitCentavos: 2800,
        },
      ],
    },
  };
}

describe('ida e volta', () => {
  it('preserva o documento', async () => {
    const original = doc();
    const token = await codificarProposta(original);
    const voltou = await decodificarProposta(token);

    expect(voltou).not.toBeNull();
    expect(voltou?.empresa.nome).toBe('Elétrica Silva');
    expect(voltou?.proposta.titulo).toBe('Instalação de quadro');
    expect(voltou?.proposta.itens).toHaveLength(1);
    expect(voltou?.proposta.itens[0].valorUnitCentavos).toBe(4500);
  });

  it('gera token seguro para URL', async () => {
    const token = await codificarProposta(doc());
    expect(token.slice(1)).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(encodeURIComponent(token)).toBe(token);
  });

  it('comprime documentos repetitivos', async () => {
    const grande = doc();
    grande.proposta.observacoes = 'texto repetido '.repeat(200);
    const token = await codificarProposta(grande);
    expect(token.length).toBeLessThan(grande.proposta.observacoes.length);
  });
});

describe('entrada hostil', () => {
  it('recusa token vazio, curto ou não-string', async () => {
    expect(await decodificarProposta('')).toBeNull();
    expect(await decodificarProposta('c')).toBeNull();
    expect(await decodificarProposta(undefined as unknown as string)).toBeNull();
  });

  it('recusa marca desconhecida', async () => {
    const token = await codificarProposta(doc());
    expect(await decodificarProposta(`x${token.slice(1)}`)).toBeNull();
  });

  it('recusa base64 inválido', async () => {
    expect(await decodificarProposta('c!!!!!')).toBeNull();
    expect(await decodificarProposta('c@@@@@')).toBeNull();
  });

  it('recusa payload que não descompacta', async () => {
    expect(await decodificarProposta('cAAAAAAAAAAAAAAA')).toBeNull();
  });

  it('recusa token acima do limite de tamanho', async () => {
    expect(await decodificarProposta(`c${'A'.repeat(400_001)}`)).toBeNull();
  });

  it('recusa JSON válido que não é uma proposta', async () => {
    const bytes = new TextEncoder().encode(JSON.stringify({ v: 2, proposta: {} }));
    const origem = new ReadableStream<BufferSource>({
      start(c) {
        c.enqueue(bytes as BufferSource);
        c.close();
      },
    });
    const leitor = origem.pipeThrough(new CompressionStream('deflate-raw')).getReader();
    let bruto = '';
    for (;;) {
      const { done, value } = await leitor.read();
      if (done) break;
      for (const b of value) bruto += String.fromCharCode(b);
    }
    const token = `c${btoa(bruto).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
    expect(await decodificarProposta(token)).toBeNull();
  });

  it('neutraliza campos perigosos vindos do link', async () => {
    const hostil = doc();
    hostil.empresa.logoDataUrl = 'data:image/svg+xml,<svg onload=alert(1)>';
    hostil.empresa.corPrimaria = 'red; background:url(//evil)';
    (hostil.proposta as { status: string }).status = 'admin';

    const voltou = await decodificarProposta(await codificarProposta(hostil));
    expect(voltou?.empresa.logoDataUrl).toBe('');
    expect(voltou?.empresa.corPrimaria).toBe('#0f9d58');
    expect(voltou?.proposta.status).toBe('rascunho');
  });

  it('corta lista de itens gigante', async () => {
    const hostil = doc();
    hostil.proposta.itens = Array.from({ length: 5000 }, (_, i) => ({
      id: `i${i}`,
      descricao: 'x',
      quantidadeMil: 1000,
      unidade: 'un' as const,
      valorUnitCentavos: 100,
      custoUnitCentavos: 0,
    }));

    const voltou = await decodificarProposta(await codificarProposta(hostil));
    expect(voltou?.proposta.itens).toHaveLength(200);
  });
});
