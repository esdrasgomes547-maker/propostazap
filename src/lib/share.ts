import { validarPropostaPublica } from './validate';
import type { PropostaPublica } from './types';

/** Token maior que isso já não cabe em URL de navegador nem em mensagem. */
export const MAX_TOKEN_CARACTERES = 400_000;

/** Teto de bytes após descompactar — trava contra bomba de descompressão. */
export const MAX_BYTES_DESCOMPACTADOS = 3_000_000;

const MARCA_COMPACTADO = 'c';
const MARCA_SIMPLES = 'u';

function bytesParaBase64Url(bytes: Uint8Array): string {
  let bruto = '';
  const passo = 0x8000;
  for (let i = 0; i < bytes.length; i += passo) {
    bruto += String.fromCharCode(...bytes.subarray(i, i + passo));
  }
  return btoa(bruto).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlParaBytes(texto: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*$/.test(texto)) return null;
  const padded = texto.replace(/-/g, '+').replace(/_/g, '/');
  const resto = padded.length % 4;
  const completo = resto === 0 ? padded : padded + '='.repeat(4 - resto);
  try {
    const bruto = atob(completo);
    const bytes = new Uint8Array(bruto.length);
    for (let i = 0; i < bruto.length; i += 1) bytes[i] = bruto.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

function temCompressao(): boolean {
  return (
    typeof globalThis.CompressionStream === 'function' &&
    typeof globalThis.DecompressionStream === 'function'
  );
}

/** Blob.stream() não existe em todo runtime; um ReadableStream cru existe. */
function streamDeBytes(bytes: Uint8Array): ReadableStream<BufferSource> {
  return new ReadableStream<BufferSource>({
    start(controlador) {
      controlador.enqueue(bytes as BufferSource);
      controlador.close();
    },
  });
}

/**
 * Consome o stream abortando assim que passar do teto de bytes — é isso que
 * impede um token pequeno de virar centenas de MB na memória.
 */
async function lerStream(
  stream: ReadableStream<Uint8Array>,
  maximoBytes: number,
): Promise<Uint8Array | null> {
  const leitor = stream.getReader();
  const pedacos: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await leitor.read();
      if (done) break;
      total += value.length;
      if (total > maximoBytes) {
        await leitor.cancel();
        return null;
      }
      pedacos.push(value);
    }
  } catch {
    return null;
  }

  const saida = new Uint8Array(total);
  let deslocamento = 0;
  for (const pedaco of pedacos) {
    saida.set(pedaco, deslocamento);
    deslocamento += pedaco.length;
  }
  return saida;
}

async function compactar(bytes: Uint8Array): Promise<Uint8Array | null> {
  return lerStream(
    streamDeBytes(bytes).pipeThrough(new CompressionStream('deflate-raw')),
    MAX_BYTES_DESCOMPACTADOS,
  );
}

async function descompactar(bytes: Uint8Array): Promise<Uint8Array | null> {
  return lerStream(
    streamDeBytes(bytes).pipeThrough(new DecompressionStream('deflate-raw')),
    MAX_BYTES_DESCOMPACTADOS,
  );
}

/** Serializa a proposta em um token seguro para colocar no fragmento da URL. */
export async function codificarProposta(doc: PropostaPublica): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(doc));
  if (!temCompressao()) return MARCA_SIMPLES + bytesParaBase64Url(bytes);

  const compactado = await compactar(bytes);
  if (!compactado) return MARCA_SIMPLES + bytesParaBase64Url(bytes);
  return MARCA_COMPACTADO + bytesParaBase64Url(compactado);
}

/**
 * Caminho inverso. Todo passo pode falhar com dado hostil, então o retorno é
 * `null` em vez de exceção, e o resultado sempre passa pelo validador.
 */
export async function decodificarProposta(token: string): Promise<PropostaPublica | null> {
  if (typeof token !== 'string' || token.length < 2) return null;
  if (token.length > MAX_TOKEN_CARACTERES) return null;

  const marca = token[0];
  const bytes = base64UrlParaBytes(token.slice(1));
  if (!bytes) return null;

  let json: Uint8Array | null;
  if (marca === MARCA_COMPACTADO) {
    if (!temCompressao()) return null;
    json = await descompactar(bytes);
  } else if (marca === MARCA_SIMPLES) {
    json = bytes.length > MAX_BYTES_DESCOMPACTADOS ? null : bytes;
  } else {
    return null;
  }
  if (!json) return null;

  try {
    return validarPropostaPublica(JSON.parse(new TextDecoder().decode(json)));
  } catch {
    return null;
  }
}
