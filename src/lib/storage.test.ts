import { beforeEach, describe, expect, it, vi } from 'vitest';
import { propostaVazia } from './factory';
import {
  LIMITE_MENSAL_GRATIS,
  carregarEmpresa,
  carregarPropostas,
  criadasNoMes,
  estadoCota,
  exportarBackup,
  importarBackup,
  proximoNumero,
  salvarEmpresa,
  salvarPropostas,
} from './storage';
import { PROFISSOES } from './professions';
import type { Proposta } from './types';

function propostaEm(iso: string, numero: number): Proposta {
  return { ...propostaVazia(numero), criadoEm: iso, atualizadoEm: iso };
}

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('empresa', () => {
  it('devolve empresa vazia quando não há nada salvo', () => {
    expect(carregarEmpresa().nome).toBe('');
  });

  it('salva e recarrega', () => {
    salvarEmpresa({ ...carregarEmpresa(), nome: 'Silva Serviços' });
    expect(carregarEmpresa().nome).toBe('Silva Serviços');
  });

  it('sanea o que foi adulterado direto no localStorage', () => {
    localStorage.setItem(
      'pz.empresa.v1',
      JSON.stringify({ nome: 'X', corPrimaria: 'javascript:alert(1)', logoDataUrl: 'data:image/svg+xml,<svg>' }),
    );
    const empresa = carregarEmpresa();
    expect(empresa.corPrimaria).toBe('#0f9d58');
    expect(empresa.logoDataUrl).toBe('');
  });

  it('não quebra com JSON corrompido', () => {
    localStorage.setItem('pz.empresa.v1', '{isso não é json');
    expect(carregarEmpresa().nome).toBe('');
  });

  it('não quebra quando o localStorage lança', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(salvarEmpresa(carregarEmpresa())).toBe(false);
  });
});

describe('propostas', () => {
  it('salva e recarrega a lista', () => {
    salvarPropostas([propostaEm('2026-07-01T10:00:00.000Z', 1)]);
    expect(carregarPropostas()).toHaveLength(1);
  });

  it('devolve lista vazia se o conteúdo não for array', () => {
    localStorage.setItem('pz.propostas.v1', '{"a":1}');
    expect(carregarPropostas()).toEqual([]);
  });

  it('numera sempre acima do maior existente', () => {
    expect(proximoNumero([])).toBe(1);
    expect(proximoNumero([propostaEm('2026-07-01T10:00:00.000Z', 7)])).toBe(8);
  });
});

describe('cota mensal', () => {
  const agora = new Date('2026-07-30T12:00:00.000Z');

  it('conta apenas o mês de referência', () => {
    const lista = [
      propostaEm('2026-07-02T10:00:00.000Z', 1),
      propostaEm('2026-07-20T10:00:00.000Z', 2),
      propostaEm('2026-06-28T10:00:00.000Z', 3),
    ];
    expect(criadasNoMes(lista, agora)).toBe(2);
  });

  it('bloqueia ao atingir o limite no plano gratuito', () => {
    const lista = Array.from({ length: LIMITE_MENSAL_GRATIS }, (_, i) =>
      propostaEm('2026-07-10T10:00:00.000Z', i + 1),
    );
    const cota = estadoCota(lista, 'gratis', agora);
    expect(cota.restantes).toBe(0);
    expect(cota.bloqueado).toBe(true);
  });

  it('nunca bloqueia no plano pro', () => {
    const lista = Array.from({ length: 100 }, (_, i) =>
      propostaEm('2026-07-10T10:00:00.000Z', i + 1),
    );
    expect(estadoCota(lista, 'pro', agora).bloqueado).toBe(false);
  });
});

describe('backup', () => {
  it('exporta e reimporta preservando os dados', () => {
    const empresa = { ...carregarEmpresa(), nome: 'Silva' };
    const propostas = [propostaEm('2026-07-01T10:00:00.000Z', 1)];
    const restaurado = importarBackup(exportarBackup(empresa, propostas));

    expect(restaurado?.empresa.nome).toBe('Silva');
    expect(restaurado?.propostas).toHaveLength(1);
  });

  it('recusa backup inválido ou de outra versão', () => {
    expect(importarBackup('não é json')).toBeNull();
    expect(importarBackup(JSON.stringify({ v: 9 }))).toBeNull();
    expect(importarBackup(JSON.stringify([]))).toBeNull();
  });

  it('sanea backup hostil', () => {
    const hostil = JSON.stringify({
      v: 1,
      empresa: { nome: 'A', logoDataUrl: 'data:text/html,<script>' },
      propostas: [{ numero: 1, status: 'root', itens: [{ valorUnitCentavos: -999 }] }],
    });
    const restaurado = importarBackup(hostil);
    expect(restaurado?.empresa.logoDataUrl).toBe('');
    expect(restaurado?.propostas[0].status).toBe('rascunho');
    expect(restaurado?.propostas[0].itens[0].valorUnitCentavos).toBe(0);
  });
});

describe('catálogo de profissões', () => {
  it('tem slugs únicos e válidos para URL', () => {
    const slugs = PROFISSOES.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it('toda profissão tem serviços com preço e conteúdo próprio', () => {
    for (const p of PROFISSOES) {
      expect(p.servicos.length).toBeGreaterThanOrEqual(4);
      expect(p.intro.length).toBeGreaterThan(80);
      expect(p.duvidaEspecifica.resposta.length).toBeGreaterThan(60);
      for (const servico of p.servicos) {
        expect(servico.valorSugeridoCentavos).toBeGreaterThan(0);
      }
    }
  });

  it('cobre o suficiente para o programa de SEO', () => {
    expect(PROFISSOES.length).toBeGreaterThanOrEqual(35);
  });
});
