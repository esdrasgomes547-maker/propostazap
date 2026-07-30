import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { novoId, propostaVazia } from './factory';
import { acharProfissao } from './professions';
import {
  carregarEmpresa,
  carregarPlano,
  carregarPropostas,
  estadoCota,
  proximoNumero,
  salvarEmpresa,
  salvarPlano,
  salvarPropostas,
  type EstadoCota,
  type Plano,
} from './storage';
import { validarEmpresa, validarProposta } from './validate';
import type { Empresa, Proposta } from './types';

export interface App {
  empresa: Empresa;
  propostas: Proposta[];
  plano: Plano;
  cota: EstadoCota;
  falhaAoSalvar: boolean;
  atualizarEmpresa: (e: Empresa) => void;
  criarProposta: (profissaoSlug: string) => Proposta | null;
  atualizarProposta: (p: Proposta) => void;
  removerProposta: (id: string) => void;
  duplicarProposta: (id: string) => Proposta | null;
  definirPlano: (p: Plano) => void;
  substituirTudo: (e: Empresa, p: Proposta[]) => void;
}

/**
 * Estado da aplicação espelhado em refs.
 *
 * Duas razões para as refs, e as duas já custaram bug:
 * 1. Os callbacks precisam enxergar a lista mais recente. Lendo do estado,
 *    duas criações no mesmo tick partem da mesma lista antiga e a segunda
 *    apaga a primeira.
 * 2. Sem elas os callbacks mudam de identidade a cada render, e todo efeito
 *    que depende do app volta a rodar sem necessidade.
 */
export function useApp(): App {
  const [empresa, setEmpresa] = useState<Empresa>(carregarEmpresa);
  const [propostas, setPropostas] = useState<Proposta[]>(carregarPropostas);
  const [plano, setPlano] = useState<Plano>(carregarPlano);
  const [falhaAoSalvar, setFalhaAoSalvar] = useState(false);

  const empresaRef = useRef(empresa);
  const propostasRef = useRef(propostas);
  const planoRef = useRef(plano);

  const gravarEmpresa = useCallback((nova: Empresa) => {
    // Sanear antes de exibir mantém tela e armazenamento contando a mesma história.
    const segura = validarEmpresa(nova);
    empresaRef.current = segura;
    setEmpresa(segura);
    setFalhaAoSalvar(!salvarEmpresa(segura));
  }, []);

  const gravarPropostas = useCallback((lista: Proposta[]) => {
    const seguras = lista.map(validarProposta);
    propostasRef.current = seguras;
    setPropostas(seguras);
    setFalhaAoSalvar(!salvarPropostas(seguras));
  }, []);

  const recarregar = useCallback(() => {
    empresaRef.current = carregarEmpresa();
    propostasRef.current = carregarPropostas();
    planoRef.current = carregarPlano();
    setEmpresa(empresaRef.current);
    setPropostas(propostasRef.current);
    setPlano(planoRef.current);
  }, []);

  // Outra aba do mesmo navegador pode ter alterado os dados.
  useEffect(() => {
    const aoMudar = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith('pz.')) recarregar();
    };
    globalThis.addEventListener('storage', aoMudar);
    return () => globalThis.removeEventListener('storage', aoMudar);
  }, [recarregar]);

  const cota = useMemo(() => estadoCota(propostas, plano, new Date()), [propostas, plano]);

  const criarProposta = useCallback(
    (profissaoSlug: string): Proposta | null => {
      const atuais = propostasRef.current;
      if (estadoCota(atuais, planoRef.current, new Date()).bloqueado) return null;

      const nova = propostaVazia(proximoNumero(atuais), profissaoSlug);
      const profissao = acharProfissao(profissaoSlug);
      if (profissao) {
        nova.condicoesPagamento = profissao.condicoesPagamento;
        nova.garantiaMeses = profissao.garantiaMeses;
        nova.prazoDias = profissao.prazoDias;
      }

      gravarPropostas([nova, ...atuais]);
      return nova;
    },
    [gravarPropostas],
  );

  const atualizarProposta = useCallback(
    (alterada: Proposta) => {
      const carimbada = { ...alterada, atualizadoEm: new Date().toISOString() };
      gravarPropostas(
        propostasRef.current.map((p) => (p.id === carimbada.id ? carimbada : p)),
      );
    },
    [gravarPropostas],
  );

  const removerProposta = useCallback(
    (id: string) => gravarPropostas(propostasRef.current.filter((p) => p.id !== id)),
    [gravarPropostas],
  );

  const duplicarProposta = useCallback(
    (id: string): Proposta | null => {
      const atuais = propostasRef.current;
      if (estadoCota(atuais, planoRef.current, new Date()).bloqueado) return null;

      const origem = atuais.find((p) => p.id === id);
      if (!origem) return null;

      const agora = new Date().toISOString();
      const copia: Proposta = {
        ...structuredClone(origem),
        id: novoId(),
        numero: proximoNumero(atuais),
        status: 'rascunho',
        criadoEm: agora,
        atualizadoEm: agora,
      };
      gravarPropostas([copia, ...atuais]);
      return copia;
    },
    [gravarPropostas],
  );

  const definirPlano = useCallback((novo: Plano) => {
    const seguro: Plano = novo === 'pro' ? 'pro' : 'gratis';
    planoRef.current = seguro;
    setPlano(seguro);
    salvarPlano(seguro);
  }, []);

  const substituirTudo = useCallback(
    (novaEmpresa: Empresa, novasPropostas: Proposta[]) => {
      gravarEmpresa(novaEmpresa);
      gravarPropostas(novasPropostas);
    },
    [gravarEmpresa, gravarPropostas],
  );

  return {
    empresa,
    propostas,
    plano,
    cota,
    falhaAoSalvar,
    atualizarEmpresa: gravarEmpresa,
    criarProposta,
    atualizarProposta,
    removerProposta,
    duplicarProposta,
    definirPlano,
    substituirTudo,
  };
}
