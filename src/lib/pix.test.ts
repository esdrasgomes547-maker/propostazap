import { describe, expect, it } from 'vitest';
import { crc16, gerarBrCode } from './pix';

/**
 * Parser TLV independente do gerador. Conferir o código montando-o de novo do
 * mesmo jeito não prova nada; decodificar e olhar campo a campo prova.
 */
function decodificar(payload: string): Map<string, string> {
  const campos = new Map<string, string>();
  let i = 0;

  while (i + 4 <= payload.length) {
    const tag = payload.slice(i, i + 2);
    const tamanho = Number(payload.slice(i + 2, i + 4));
    if (!Number.isInteger(tamanho)) break;

    campos.set(tag, payload.slice(i + 4, i + 4 + tamanho));
    i += 4 + tamanho;
  }

  return campos;
}

function crcConfere(codigo: string): boolean {
  const corpo = codigo.slice(0, -4);
  return codigo.slice(-4) === crc16(corpo).toString(16).toUpperCase().padStart(4, '0');
}

describe('crc16', () => {
  it('bate com o vetor de referencia do CRC-16/CCITT-FALSE', () => {
    expect(crc16('123456789')).toBe(0x29b1);
  });

  it('muda quando qualquer byte muda', () => {
    expect(crc16('123456789')).not.toBe(crc16('123456780'));
  });
});

describe('gerarBrCode', () => {
  const base = {
    chave: 'esdrasgomes547@gmail.com',
    nomeRecebedor: 'Esdras Gomes',
    cidade: 'Belo Horizonte',
  };

  it('monta todos os campos obrigatorios da especificacao', () => {
    const codigo = gerarBrCode({ ...base, valorCentavos: 12345 });
    const campos = decodificar(codigo);

    expect(campos.get('00')).toBe('01');
    expect(campos.get('52')).toBe('0000');
    expect(campos.get('53')).toBe('986');
    expect(campos.get('54')).toBe('123.45');
    expect(campos.get('58')).toBe('BR');
    expect(campos.get('59')).toBe('Esdras Gomes');
    expect(campos.get('60')).toBe('Belo Horizonte');

    const merchant = decodificar(campos.get('26') ?? '');
    expect(merchant.get('00')).toBe('br.gov.bcb.pix');
    expect(merchant.get('01')).toBe('esdrasgomes547@gmail.com');
  });

  it('fecha com um CRC valido', () => {
    expect(crcConfere(gerarBrCode({ ...base, valorCentavos: 2900 }))).toBe(true);
  });

  it('quebra o CRC se alguem editar o valor no meio do codigo', () => {
    const codigo = gerarBrCode({ ...base, valorCentavos: 19700 });
    const adulterado = codigo.replace('197.00', '001.00');

    expect(adulterado).not.toBe(codigo);
    expect(crcConfere(adulterado)).toBe(false);
  });

  it('omite o campo de valor quando o pagador escolhe quanto pagar', () => {
    expect(decodificar(gerarBrCode({ ...base, valorCentavos: 0 })).has('54')).toBe(false);
    expect(decodificar(gerarBrCode({ ...base, valorCentavos: 19700 })).get('54')).toBe('197.00');
  });

  it('remove acento de nome e cidade', () => {
    const campos = decodificar(
      gerarBrCode({ ...base, nomeRecebedor: 'Jose\u0301 Anto\u0302nio', cidade: 'Ana\u0301polis' }),
    );

    expect(campos.get('59')).toBe('Jose Antonio');
    expect(campos.get('60')).toBe('Anapolis');
  });

  it('respeita os limites de tamanho da especificacao', () => {
    const campos = decodificar(
      gerarBrCode({ ...base, nomeRecebedor: 'N'.repeat(60), cidade: 'C'.repeat(40) }),
    );

    expect(campos.get('59')).toHaveLength(25);
    expect(campos.get('60')).toHaveLength(15);
  });

  it('usa *** quando nao ha identificador e limpa o que vier', () => {
    expect(decodificar(decodificar(gerarBrCode(base)).get('62') ?? '').get('05')).toBe('***');

    const comId = decodificar(gerarBrCode({ ...base, identificador: 'pix #44/17' }));
    expect(decodificar(comId.get('62') ?? '').get('05')).toBe('pix4417');
  });

  it('devolve vazio sem chave PIX, para a tela poder avisar', () => {
    expect(gerarBrCode({ ...base, chave: '' })).toBe('');
    expect(gerarBrCode({ ...base, chave: '   ' })).toBe('');
  });

  it('nao deixa caractere de controle entrar no codigo', () => {
    const codigo = gerarBrCode({ ...base, nomeRecebedor: 'Nome\u0000X\u001f' });

    expect(decodificar(codigo).get('59')).toBe('NomeX');
    expect(/[\u0000-\u001f\u007f]/.test(codigo)).toBe(false);
  });
});
