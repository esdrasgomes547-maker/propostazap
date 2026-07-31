/**
 * Gera o par de chaves que assina as licenças Pro. Rodar UMA vez.
 *
 * A chave privada nunca entra no repositório nem no bundle: ela fica em
 * chaves/licenca-privada.json, que está no .gitignore. Quem tiver esse arquivo
 * consegue emitir licenças válidas — trate como senha do negócio.
 *
 * A chave pública é gravada em src/lib/chave-publica.ts e vai para dentro do
 * app. Ela só verifica assinatura; não permite emitir nada.
 *
 * Uso: node scripts/gerar-chaves.mjs
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO_PRIVADA = join(RAIZ, 'chaves', 'licenca-privada.json');
const DESTINO_PUBLICA = join(RAIZ, 'src', 'lib', 'chave-publica.ts');

async function existe(caminho) {
  try {
    await access(caminho);
    return true;
  } catch {
    return false;
  }
}

if (await existe(DESTINO_PRIVADA)) {
  console.error(
    'chaves/licenca-privada.json já existe.\n' +
      'Gerar de novo invalida TODAS as licenças já emitidas aos seus clientes.\n' +
      'Se é mesmo isso que você quer, apague o arquivo antes.',
  );
  process.exit(1);
}

const par = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
  'sign',
  'verify',
]);

const privada = await crypto.subtle.exportKey('jwk', par.privateKey);
const publica = await crypto.subtle.exportKey('jwk', par.publicKey);

await mkdir(dirname(DESTINO_PRIVADA), { recursive: true });
await writeFile(DESTINO_PRIVADA, JSON.stringify(privada, null, 2), { mode: 0o600 });

await writeFile(
  DESTINO_PUBLICA,
  `// GERADO POR scripts/gerar-chaves.mjs — não edite à mão.
//
// Chave pública que verifica a assinatura das licenças Pro. Pode ser lida por
// qualquer um: só serve para verificar, nunca para emitir.
export const CHAVE_PUBLICA_LICENCA = ${JSON.stringify(
    { kty: publica.kty, crv: publica.crv, x: publica.x, y: publica.y },
    null,
    2,
  )} as const;
`,
  'utf8',
);

console.log('Chave privada: chaves/licenca-privada.json  (fora do git — faça backup!)');
console.log('Chave pública: src/lib/chave-publica.ts     (vai para o app)');
