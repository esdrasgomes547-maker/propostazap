import { empresaVazia } from './factory';
import { validarEmpresa, validarProposta } from './validate';
import type { Empresa, Proposta } from './types';

const CHAVE_EMPRESA = 'pz.empresa.v1';
const CHAVE_PROPOSTAS = 'pz.propostas.v1';
const CHAVE_PLANO = 'pz.plano.v1';

/** Teto de propostas guardadas — o localStorage tem ~5 MB por origem. */
export const MAX_PROPOSTAS_ARMAZENADAS = 500;

export type Plano = 'gratis' | 'pro';

/** Propostas novas por mês no plano gratuito. */
export const LIMITE_MENSAL_GRATIS = 5;

export interface Armazenamento {
  getItem(chave: string): string | null;
  setItem(chave: string, valor: string): void;
  removeItem(chave: string): void;
}

/** localStorage pode lançar (modo privado, cota cheia); nunca deixe subir. */
function deposito(): Armazenamento | null {
  try {
    const ls = globalThis.localStorage;
    if (!ls) return null;
    const sonda = '__pz__';
    ls.setItem(sonda, '1');
    ls.removeItem(sonda);
    return ls;
  } catch {
    return null;
  }
}

function ler(chave: string): unknown {
  const alvo = deposito();
  if (!alvo) return null;
  try {
    const cru = alvo.getItem(chave);
    return cru === null ? null : JSON.parse(cru);
  } catch {
    return null;
  }
}

function gravar(chave: string, valor: unknown): boolean {
  const alvo = deposito();
  if (!alvo) return false;
  try {
    alvo.setItem(chave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

export function carregarEmpresa(): Empresa {
  const bruto = ler(CHAVE_EMPRESA);
  return bruto === null ? empresaVazia() : validarEmpresa(bruto);
}

export function salvarEmpresa(empresa: Empresa): boolean {
  return gravar(CHAVE_EMPRESA, validarEmpresa(empresa));
}

export function carregarPropostas(): Proposta[] {
  const bruto = ler(CHAVE_PROPOSTAS);
  if (!Array.isArray(bruto)) return [];
  return bruto.slice(0, MAX_PROPOSTAS_ARMAZENADAS).map(validarProposta);
}

export function salvarPropostas(propostas: Proposta[]): boolean {
  const seguras = propostas.slice(0, MAX_PROPOSTAS_ARMAZENADAS).map(validarProposta);
  return gravar(CHAVE_PROPOSTAS, seguras);
}

export function carregarPlano(): Plano {
  return ler(CHAVE_PLANO) === 'pro' ? 'pro' : 'gratis';
}

export function salvarPlano(plano: Plano): boolean {
  return gravar(CHAVE_PLANO, plano === 'pro' ? 'pro' : 'gratis');
}

/** Próximo número sequencial, sempre acima do maior já usado. */
export function proximoNumero(propostas: Proposta[]): number {
  return propostas.reduce((maior, p) => Math.max(maior, p.numero), 0) + 1;
}

function chaveDoMes(iso: string): string {
  return iso.slice(0, 7);
}

/** Quantas propostas foram criadas no mês de `referencia`. */
export function criadasNoMes(propostas: Proposta[], referencia: Date): number {
  const mes = chaveDoMes(referencia.toISOString());
  return propostas.filter((p) => chaveDoMes(p.criadoEm) === mes).length;
}

export interface EstadoCota {
  usadas: number;
  limite: number;
  restantes: number;
  bloqueado: boolean;
}

export function estadoCota(propostas: Proposta[], plano: Plano, agora: Date): EstadoCota {
  if (plano === 'pro') {
    return { usadas: 0, limite: Number.POSITIVE_INFINITY, restantes: Number.POSITIVE_INFINITY, bloqueado: false };
  }
  const usadas = criadasNoMes(propostas, agora);
  const restantes = Math.max(0, LIMITE_MENSAL_GRATIS - usadas);
  return { usadas, limite: LIMITE_MENSAL_GRATIS, restantes, bloqueado: restantes === 0 };
}

/** Backup completo em JSON, para o usuário não ficar refém do navegador. */
export function exportarBackup(empresa: Empresa, propostas: Proposta[]): string {
  return JSON.stringify({ v: 1, exportadoEm: new Date().toISOString(), empresa, propostas }, null, 2);
}

export interface Backup {
  empresa: Empresa;
  propostas: Proposta[];
}

export function importarBackup(json: string): Backup | null {
  let bruto: unknown;
  try {
    bruto = JSON.parse(json);
  } catch {
    return null;
  }
  if (!bruto || typeof bruto !== 'object') return null;

  const o = bruto as Record<string, unknown>;
  if (o.v !== 1) return null;

  return {
    empresa: validarEmpresa(o.empresa),
    propostas: Array.isArray(o.propostas)
      ? o.propostas.slice(0, MAX_PROPOSTAS_ARMAZENADAS).map(validarProposta)
      : [],
  };
}
