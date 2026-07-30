import { useEffect, useState } from 'react';

export type Rota =
  | { nome: 'painel' }
  | { nome: 'nova'; profissao: string }
  | { nome: 'editar'; id: string }
  | { nome: 'config' }
  | { nome: 'publico'; token: string };

/** IDs internos são UUID; qualquer outra coisa na URL não vira consulta. */
const ID_VALIDO = /^[A-Za-z0-9_-]{1,64}$/;
const SLUG_VALIDO = /^[a-z0-9-]{1,60}$/;
const TOKEN_VALIDO = /^[A-Za-z0-9_-]{2,400000}$/;

export function lerRota(hash: string): Rota {
  const cru = hash.replace(/^#\/?/, '');
  const [secao, ...resto] = cru.split('/');
  const argumento = resto.join('/');

  switch (secao) {
    case 'nova':
      return { nome: 'nova', profissao: SLUG_VALIDO.test(argumento) ? argumento : '' };
    case 'p':
      return ID_VALIDO.test(argumento) ? { nome: 'editar', id: argumento } : { nome: 'painel' };
    case 'config':
      return { nome: 'config' };
    case 'ver':
      return TOKEN_VALIDO.test(argumento)
        ? { nome: 'publico', token: argumento }
        : { nome: 'painel' };
    default:
      return { nome: 'painel' };
  }
}

export function irPara(caminho: string): void {
  globalThis.location.hash = caminho;
}

export function useRota(): Rota {
  const [rota, setRota] = useState<Rota>(() => lerRota(globalThis.location?.hash ?? ''));

  useEffect(() => {
    const aoMudar = () => setRota(lerRota(globalThis.location.hash));
    globalThis.addEventListener('hashchange', aoMudar);
    return () => globalThis.removeEventListener('hashchange', aoMudar);
  }, []);

  return rota;
}
