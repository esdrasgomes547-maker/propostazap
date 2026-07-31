/** base64url sem padding — seguro para URL e para colar em campo de texto. */

export function bytesParaBase64Url(bytes: Uint8Array): string {
  let bruto = '';
  const passo = 0x8000;
  for (let i = 0; i < bytes.length; i += passo) {
    bruto += String.fromCharCode(...bytes.subarray(i, i + passo));
  }
  return btoa(bruto).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Devolve null em vez de lançar: a entrada quase sempre vem de fora. */
export function base64UrlParaBytes(texto: string): Uint8Array | null {
  if (typeof texto !== 'string' || !/^[A-Za-z0-9_-]*$/.test(texto)) return null;

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
