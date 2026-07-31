/**
 * Emite uma licença Pro assinada. Roda na SUA máquina, depois de confirmar o
 * PIX na conta — é este comando que transforma pagamento em acesso.
 *
 * Uso:
 *   node scripts/emitir-licenca.mjs --nome "Eletrica Silva" --meses 12
 *   node scripts/emitir-licenca.mjs --nome "Joao" --meses 1 --id pix-4417
 *   node scripts/emitir-licenca.mjs --nome "Socio" --meses 0        (sem prazo)
 *
 * Registra cada emissão em chaves/licencas-emitidas.csv para você saber quem
 * comprou o quê e quando vence.
 */
import { appendFile, readFile, writeFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const PRIVADA = join(RAIZ, 'chaves', 'licenca-privada.json');
const REGISTRO = join(RAIZ, 'chaves', 'licencas-emitidas.csv');

function argumento(nome, padrao) {
  const i = process.argv.indexOf(`--${nome}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
}

const nome = argumento('nome', '').trim();
const meses = Number(argumento('meses', '12'));
const id = argumento('id', `emissao-${Date.now().toString(36)}`).trim();

if (!nome) {
  console.error('Faltou --nome "Nome do cliente"');
  process.exit(1);
}
if (!Number.isInteger(meses) || meses < 0 || meses > 600) {
  console.error('--meses precisa ser inteiro entre 0 (sem prazo) e 600');
  process.exit(1);
}

try {
  await access(PRIVADA);
} catch {
  console.error('chaves/licenca-privada.json não encontrado. Rode: node scripts/gerar-chaves.mjs');
  process.exit(1);
}

const jwk = JSON.parse(await readFile(PRIVADA, 'utf8'));
const chave = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, [
  'sign',
]);

/** Mesmo cálculo do app: 0 significa licença sem prazo. */
const expiraEm = meses === 0 ? 0 : Date.now() + meses * 30 * 86_400_000;

function paraBase64Url(bytes) {
  return Buffer.from(bytes).toString('base64url');
}

const corpo = paraBase64Url(Buffer.from(JSON.stringify({ v: 1, n: nome, exp: expiraEm, id })));
const assinatura = new Uint8Array(
  await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, chave, Buffer.from(corpo, 'utf8')),
);

const licenca = `${corpo}.${paraBase64Url(assinatura)}`;
const vencimento = expiraEm === 0 ? 'sem prazo' : new Date(expiraEm).toLocaleDateString('pt-BR');

try {
  await access(REGISTRO);
} catch {
  await writeFile(REGISTRO, 'emitida_em,nome,id,vence_em,licenca\n', 'utf8');
}
await appendFile(
  REGISTRO,
  `${new Date().toISOString()},"${nome.replace(/"/g, "'")}",${id},${vencimento},${licenca}\n`,
  'utf8',
);

console.log(`\nCliente:   ${nome}`);
console.log(`Identific: ${id}`);
console.log(`Vence em:  ${vencimento}`);
console.log(`\nMensagem pronta para enviar no WhatsApp:\n`);
console.log(`Pagamento confirmado, obrigado! Seu PropostaZap Pro está liberado.

Abra o app, vá em Configurações > Plano e cole este código de ativação:

${licenca}

Guarde esta mensagem: se trocar de celular, é só colar o código de novo.`);
console.log(`\n(registrado em chaves/licencas-emitidas.csv)`);
