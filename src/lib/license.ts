import { base64UrlParaBytes, bytesParaBase64Url } from './base64';
import { CHAVE_PUBLICA_LICENCA } from './chave-publica';
import { texto } from './sanitize';

/**
 * Licença Pro assinada com ECDSA P-256.
 *
 * O app carrega apenas a chave pública, então só sabe **verificar**. Emitir
 * licença exige a chave privada, que vive fora do repositório na máquina do
 * dono do negócio. Sem ela, uma licença não pode ser forjada nem editada —
 * mudar um único caractere invalida a assinatura.
 *
 * O que isto NÃO resolve, e não tem como resolver sem servidor: a mesma licença
 * pode ser passada de uma pessoa para outra, e alguém com conhecimento técnico
 * pode alterar o JavaScript no próprio navegador. Serve para cobrar de gente
 * honesta, que é a esmagadora maioria — não para deter quem quer burlar.
 */

export interface Licenca {
  /** Nome de quem comprou, mostrado na tela para o dono se reconhecer. */
  nome: string;
  /** Vencimento em epoch ms. 0 significa licença sem prazo. */
  expiraEm: number;
  /** Identificador da emissão, útil para o dono rastrear o pagamento. */
  id: string;
}

export type ResultadoLicenca =
  | { situacao: 'valida'; licenca: Licenca }
  | { situacao: 'vencida'; licenca: Licenca }
  | { situacao: 'invalida' };

/** Licença maior que isto não é licença; é alguém colando outra coisa. */
const MAX_TOKEN = 4096;

const ALGORITMO = { name: 'ECDSA', namedCurve: 'P-256' } as const;
const ASSINATURA = { name: 'ECDSA', hash: 'SHA-256' } as const;

export type ChavePublicaJwk = { kty: string; crv: string; x: string; y: string };

let chavePadraoImportada: Promise<CryptoKey> | null = null;

function importar(jwk: ChavePublicaJwk): Promise<CryptoKey> {
  return crypto.subtle.importKey('jwk', jwk, ALGORITMO, false, ['verify']);
}

function obterChave(jwk: ChavePublicaJwk): Promise<CryptoKey> {
  // A chave do app é importada uma vez só; qualquer outra (teste) vai direto.
  if (jwk !== (CHAVE_PUBLICA_LICENCA as ChavePublicaJwk)) return importar(jwk);
  chavePadraoImportada ??= importar(jwk);
  return chavePadraoImportada;
}

function lerCorpo(bruto: unknown): Licenca | null {
  if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) return null;

  const o = bruto as Record<string, unknown>;
  if (o.v !== 1) return null;

  const expiraEm =
    typeof o.exp === 'number' && Number.isFinite(o.exp) ? Math.trunc(o.exp) : Number.NaN;
  if (!Number.isFinite(expiraEm) || expiraEm < 0) return null;

  return {
    nome: texto(o.n, 120),
    expiraEm,
    id: texto(o.id, 64),
  };
}

/**
 * Verifica a assinatura e o prazo. `agora` é injetável para o teste não
 * depender do relógio da máquina.
 */
export async function verificarLicenca(
  token: string,
  agora: number = Date.now(),
  chaveJwk: ChavePublicaJwk = CHAVE_PUBLICA_LICENCA as ChavePublicaJwk,
): Promise<ResultadoLicenca> {
  if (typeof token !== 'string') return { situacao: 'invalida' };

  const limpo = token.trim();
  if (!limpo || limpo.length > MAX_TOKEN) return { situacao: 'invalida' };

  const partes = limpo.split('.');
  if (partes.length !== 2) return { situacao: 'invalida' };

  const [corpoB64, assinaturaB64] = partes;
  const assinatura = base64UrlParaBytes(assinaturaB64);
  const corpoBytes = base64UrlParaBytes(corpoB64);
  if (!assinatura || !corpoBytes) return { situacao: 'invalida' };

  let confere: boolean;
  try {
    confere = await crypto.subtle.verify(
      ASSINATURA,
      await obterChave(chaveJwk),
      assinatura as BufferSource,
      new TextEncoder().encode(corpoB64) as BufferSource,
    );
  } catch {
    return { situacao: 'invalida' };
  }
  if (!confere) return { situacao: 'invalida' };

  let corpo: Licenca | null;
  try {
    corpo = lerCorpo(JSON.parse(new TextDecoder().decode(corpoBytes)));
  } catch {
    return { situacao: 'invalida' };
  }
  if (!corpo) return { situacao: 'invalida' };

  if (corpo.expiraEm !== 0 && corpo.expiraEm < agora) {
    return { situacao: 'vencida', licenca: corpo };
  }
  return { situacao: 'valida', licenca: corpo };
}

/** Usado pelo script de emissão; exportado aqui para o teste assinar de verdade. */
export function montarCorpo(nome: string, expiraEm: number, id: string): string {
  return bytesParaBase64Url(
    new TextEncoder().encode(JSON.stringify({ v: 1, n: nome, exp: expiraEm, id })),
  );
}

export function formatarVencimento(licenca: Licenca): string {
  if (licenca.expiraEm === 0) return 'sem prazo de validade';
  const d = new Date(licenca.expiraEm);
  return `válida até ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
