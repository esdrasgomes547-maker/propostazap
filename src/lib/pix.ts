/**
 * Gera o "PIX Copia e Cola" (BR Code) do jeito que o Banco Central especifica.
 *
 * É montagem de string e um CRC — nenhuma chamada de rede, nenhuma conta de
 * gateway, nenhuma taxa. O dinheiro cai direto na chave PIX informada.
 */

/** Campos do BR Code aceitam apenas ASCII imprimível; acento quebra o QR. */
function semAcento(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7e]/g, '')
    .trim();
}

/** Tag + tamanho em 2 dígitos + valor. */
function campo(tag: string, valor: string): string {
  return `${tag}${String(valor.length).padStart(2, '0')}${valor}`;
}

/**
 * CRC-16/CCITT-FALSE: polinômio 0x1021, valor inicial 0xFFFF, sem reflexão.
 * Vetor de referência: crc16("123456789") === 0x29B1.
 */
export function crc16(entrada: string): number {
  let crc = 0xffff;

  for (let i = 0; i < entrada.length; i += 1) {
    crc ^= (entrada.charCodeAt(i) & 0xff) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }

  return crc;
}

export interface DadosPix {
  chave: string;
  nomeRecebedor: string;
  cidade: string;
  /** Em centavos. 0 deixa o pagador escolher o valor. */
  valorCentavos?: number;
  /** Identificador da cobrança; vira o campo txid. */
  identificador?: string;
}

/**
 * Monta o payload completo. Devolve string vazia quando falta chave PIX —
 * assim a interface consegue avisar em vez de mostrar um código que não paga.
 */
export function gerarBrCode({
  chave,
  nomeRecebedor,
  cidade,
  valorCentavos = 0,
  identificador = '',
}: DadosPix): string {
  const chaveLimpa = semAcento(chave);
  if (!chaveLimpa) return '';

  // Limites de tamanho vêm da especificação do BR Code.
  const nome = semAcento(nomeRecebedor).slice(0, 25) || 'RECEBEDOR';
  const municipio = semAcento(cidade).slice(0, 15) || 'BRASIL';
  const txid = semAcento(identificador).replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***';

  const contaMerchant =
    campo('00', 'br.gov.bcb.pix') + campo('01', chaveLimpa);

  let payload =
    campo('00', '01') +
    campo('26', contaMerchant) +
    campo('52', '0000') +
    campo('53', '986');

  if (valorCentavos > 0) {
    payload += campo('54', (valorCentavos / 100).toFixed(2));
  }

  payload +=
    campo('58', 'BR') +
    campo('59', nome) +
    campo('60', municipio) +
    campo('62', campo('05', txid));

  // O CRC é calculado sobre o payload já contendo "6304".
  const comMarcador = `${payload}6304`;
  return comMarcador + crc16(comMarcador).toString(16).toUpperCase().padStart(4, '0');
}
