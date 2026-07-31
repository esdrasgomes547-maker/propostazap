import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { novoId, propostaVazia } from './factory';
import { acharProfissao } from './professions';
import { verificarLicenca, type Licenca, type ResultadoLicenca } from './license';
import {
  carregarEmpresa,
  carregarLicencaToken,
  carregarPropostas,
  estadoCota,
  proximoNumero,
  salvarEmpresa,
  salvarLicencaToken,
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
  /** Dados da licença ativa, quando há uma válida. */
  licenca: Licenca | null;
  /** Verdadeiro quando existe licença guardada mas o prazo já passou. */
  licencaVencida: boolean;
  cota: EstadoCota;
  falhaAoSalvar: boolean;
  atualizarEmpresa: (e: Empresa) => void;
  criarProposta: (profissaoSlug: string) => Proposta | null;
  atualizarProposta: (p: Proposta) => void;
  removerProposta: (id: string) => void;
  duplicarProposta: (id: string) => Proposta | null;
  ativarLicenca: (token: string) => Promise<ResultadoLicenca>;
  removerLicenca: () => void;
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
  const [licenca, setLicenca] = useState<Licenca | null>(null);
  const [licencaVencida, setLicencaVencida] = useState(false);
  const [falhaAoSalvar, setFalhaAoSalvar] = useState(false);

  const plano: Plano = licenca ? 'pro' : 'gratis';

  const empresaRef = useRef(empresa);
  const propostasRef = useRef(propostas);
  const planoRef = useRef<Plano>('gratis');
  planoRef.current = plano;

  // A licença guardada só vira plano depois de a assinatura ser verificada.
  // Enquanto isso o usuário fica no gratuito: nunca liberamos com base na
  // simples presença de um valor no localStorage.
  useEffect(() => {
    const guardada = carregarLicencaToken();
    if (!guardada) return;

    let cancelado = false;
    verificarLicenca(guardada).then((r) => {
      if (cancelado) return;
      setLicenca(r.situacao === 'valida' ? r.licenca : null);
      setLicencaVencida(r.situacao === 'vencida');
    });

    return () => {
      cancelado = true;
    };
  }, []);

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
    setEmpresa(empresaRef.current);
    setPropostas(propostasRef.current);
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

  const ativarLicenca = useCallback(async (token: string): Promise<ResultadoLicenca> => {
    const resultado = await verificarLicenca(token);

    if (resultado.situacao === 'valida') {
      salvarLicencaToken(token.trim());
      setLicenca(resultado.licenca);
      setLicencaVencida(false);
    }
    return resultado;
  }, []);

  const removerLicenca = useCallback(() => {
    salvarLicencaToken('');
    setLicenca(null);
    setLicencaVencida(false);
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
    licenca,
    licencaVencida,
    cota,
    falhaAoSalvar,
    atualizarEmpresa: gravarEmpresa,
    criarProposta,
    atualizarProposta,
    removerProposta,
    duplicarProposta,
    ativarLicenca,
    removerLicenca,
    substituirTudo,
  };
}
