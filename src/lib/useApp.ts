import { useCallback, useEffect, useMemo, useState } from 'react';
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
  type Plano,
} from './storage';
import type { Empresa, Proposta } from './types';

export interface App {
  empresa: Empresa;
  propostas: Proposta[];
  plano: Plano;
  cota: ReturnType<typeof estadoCota>;
  falhaAoSalvar: boolean;
  atualizarEmpresa: (e: Empresa) => void;
  criarProposta: (profissaoSlug: string) => Proposta | null;
  atualizarProposta: (p: Proposta) => void;
  removerProposta: (id: string) => void;
  duplicarProposta: (id: string) => Proposta | null;
  definirPlano: (p: Plano) => void;
  substituirTudo: (e: Empresa, p: Proposta[]) => void;
}

export function useApp(): App {
  const [empresa, setEmpresa] = useState<Empresa>(carregarEmpresa);
  const [propostas, setPropostas] = useState<Proposta[]>(carregarPropostas);
  const [plano, setPlano] = useState<Plano>(carregarPlano);
  const [falhaAoSalvar, setFalhaAoSalvar] = useState(false);

  // Outra aba do mesmo navegador pode ter alterado os dados.
  useEffect(() => {
    const aoMudar = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith('pz.')) {
        setEmpresa(carregarEmpresa());
        setPropostas(carregarPropostas());
        setPlano(carregarPlano());
      }
    };
    globalThis.addEventListener('storage', aoMudar);
    return () => globalThis.removeEventListener('storage', aoMudar);
  }, []);

  const cota = useMemo(() => estadoCota(propostas, plano, new Date()), [propostas, plano]);

  const gravarPropostas = useCallback((lista: Proposta[]) => {
    setPropostas(lista);
    setFalhaAoSalvar(!salvarPropostas(lista));
  }, []);

  const atualizarEmpresa = useCallback((nova: Empresa) => {
    setEmpresa(nova);
    setFalhaAoSalvar(!salvarEmpresa(nova));
  }, []);

  const criarProposta = useCallback(
    (profissaoSlug: string): Proposta | null => {
      if (cota.bloqueado) return null;

      const profissao = acharProfissao(profissaoSlug);
      const nova = propostaVazia(proximoNumero(propostas), profissaoSlug);

      if (profissao) {
        nova.condicoesPagamento = profissao.condicoesPagamento;
        nova.garantiaMeses = profissao.garantiaMeses;
        nova.prazoDias = profissao.prazoDias;
      }

      gravarPropostas([nova, ...propostas]);
      return nova;
    },
    [cota.bloqueado, gravarPropostas, propostas],
  );

  const atualizarProposta = useCallback(
    (alterada: Proposta) => {
      const carimbada = { ...alterada, atualizadoEm: new Date().toISOString() };
      gravarPropostas(propostas.map((p) => (p.id === carimbada.id ? carimbada : p)));
    },
    [gravarPropostas, propostas],
  );

  const removerProposta = useCallback(
    (id: string) => gravarPropostas(propostas.filter((p) => p.id !== id)),
    [gravarPropostas, propostas],
  );

  const duplicarProposta = useCallback(
    (id: string): Proposta | null => {
      if (cota.bloqueado) return null;
      const origem = propostas.find((p) => p.id === id);
      if (!origem) return null;

      const agora = new Date().toISOString();
      const copia: Proposta = {
        ...structuredClone(origem),
        id: novoId(),
        numero: proximoNumero(propostas),
        status: 'rascunho',
        criadoEm: agora,
        atualizadoEm: agora,
      };
      gravarPropostas([copia, ...propostas]);
      return copia;
    },
    [cota.bloqueado, gravarPropostas, propostas],
  );

  const definirPlano = useCallback((novo: Plano) => {
    setPlano(novo);
    salvarPlano(novo);
  }, []);

  const substituirTudo = useCallback(
    (novaEmpresa: Empresa, novasPropostas: Proposta[]) => {
      atualizarEmpresa(novaEmpresa);
      gravarPropostas(novasPropostas);
    },
    [atualizarEmpresa, gravarPropostas],
  );

  return {
    empresa,
    propostas,
    plano,
    cota,
    falhaAoSalvar,
    atualizarEmpresa,
    criarProposta,
    atualizarProposta,
    removerProposta,
    duplicarProposta,
    definirPlano,
    substituirTudo,
  };
}
