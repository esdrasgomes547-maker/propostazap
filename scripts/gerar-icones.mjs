/**
 * Gera os ícones PNG do app sem depender de biblioteca de imagem.
 *
 * PNG é simples o bastante para escrever à mão: assinatura, IHDR, IDAT com as
 * linhas comprimidas em zlib, IEND — cada bloco com seu CRC32. Fazer assim
 * evita somar uma dependência de imagem à cadeia de suprimentos por causa de
 * dois arquivos que nunca mudam.
 */
import { deflateSync } from 'node:zlib';

const VERDE = [5, 150, 105];
const BRANCO = [255, 255, 255];

const TABELA_CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (const b of buf) c = TABELA_CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function bloco(tipo, dados) {
  const tamanho = Buffer.alloc(4);
  tamanho.writeUInt32BE(dados.length);
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([tamanho, corpo, crc]);
}

/** Letra P em blocos, em coordenadas relativas ao lado do ícone. */
const TRACOS = [
  [0.30, 0.24, 0.42, 0.78], // haste
  [0.30, 0.24, 0.66, 0.36], // barra de cima
  [0.56, 0.24, 0.68, 0.58], // lateral direita
  [0.30, 0.46, 0.66, 0.58], // barra do meio
];

function pintar(lado) {
  const linhas = [];

  for (let y = 0; y < lado; y += 1) {
    const linha = Buffer.alloc(1 + lado * 3); // byte de filtro + pixels RGB
    for (let x = 0; x < lado; x += 1) {
      const rx = x / lado;
      const ry = y / lado;
      const naLetra = TRACOS.some(([x0, y0, x1, y1]) => rx >= x0 && rx < x1 && ry >= y0 && ry < y1);
      const [r, g, b] = naLetra ? BRANCO : VERDE;
      linha[1 + x * 3] = r;
      linha[2 + x * 3] = g;
      linha[3 + x * 3] = b;
    }
    linhas.push(linha);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(lado, 0);
  ihdr.writeUInt32BE(lado, 4);
  ihdr[8] = 8; // 8 bits por canal
  ihdr[9] = 2; // truecolor RGB
  // 10..12 ficam em zero: compressão, filtro e entrelaçamento padrão.

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloco('IHDR', ihdr),
    bloco('IDAT', deflateSync(Buffer.concat(linhas), { level: 9 })),
    bloco('IEND', Buffer.alloc(0)),
  ]);
}

export function gerarIcones() {
  return [192, 512].map((lado) => ({ lado, png: pintar(lado) }));
}
