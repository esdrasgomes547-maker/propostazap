import { beforeAll, describe, expect, it } from 'vitest';
import { bytesParaBase64Url } from './base64';
import { CHAVE_PUBLICA_LICENCA } from './chave-publica';
import {
  formatarVencimento,
  montarCorpo,
  verificarLicenca,
  type ChavePublicaJwk,
} from './license';

/**
 * Os testes usam um par efêmero em vez da chave privada real: ela é gitignored,
 * então depender dela quebraria a suíte em qualquer outro clone. O que importa
 * validar é o protocolo — assinar, verificar, recusar adulteração — e isso não
 * depende de qual par foi usado.
 */
let privada: CryptoKey;
let publicaJwk: ChavePublicaJwk;

async function emitir(nome: string, expiraEm: number, id = 'teste-1'): Promise<string> {
  const corpo = montarCorpo(nome, expiraEm, id);
  const assinatura = new Uint8Array(
    await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      privada,
      new TextEncoder().encode(corpo) as BufferSource,
    ),
  );
  return `${corpo}.${bytesParaBase64Url(assinatura)}`;
}

beforeAll(async () => {
  const par = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
    'sign',
    'verify',
  ]);
  privada = par.privateKey;
  publicaJwk = (await crypto.subtle.exportKey('jwk', par.publicKey)) as ChavePublicaJwk;
});

const AGORA = Date.parse('2026-08-01T12:00:00.000Z');
const UM_ANO = 365 * 86_400_000;

describe('chave pública embutida no app', () => {
  it('é um JWK P-256 que o navegador consegue importar', async () => {
    expect(CHAVE_PUBLICA_LICENCA.kty).toBe('EC');
    expect(CHAVE_PUBLICA_LICENCA.crv).toBe('P-256');

    await expect(
      crypto.subtle.importKey(
        'jwk',
        CHAVE_PUBLICA_LICENCA,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['verify'],
      ),
    ).resolves.toBeDefined();
  });

  it('não carrega material privado junto', () => {
    expect(CHAVE_PUBLICA_LICENCA).not.toHaveProperty('d');
  });
});

describe('licença emitida com a chave certa', () => {
  it('é aceita e traz os dados de quem comprou', async () => {
    const r = await verificarLicenca(
      await emitir('Elétrica Silva', AGORA + UM_ANO, 'pix-4417'),
      AGORA,
      publicaJwk,
    );

    expect(r.situacao).toBe('valida');
    if (r.situacao !== 'valida') return;
    expect(r.licenca.nome).toBe('Elétrica Silva');
    expect(r.licenca.id).toBe('pix-4417');
  });

  it('aceita licença sem prazo', async () => {
    expect((await verificarLicenca(await emitir('Vitalícia', 0), AGORA, publicaJwk)).situacao).toBe(
      'valida',
    );
  });

  it('marca como vencida depois do prazo, sem dizer que é falsa', async () => {
    const r = await verificarLicenca(await emitir('Expirado', AGORA - 1), AGORA, publicaJwk);

    expect(r.situacao).toBe('vencida');
    if (r.situacao !== 'vencida') return;
    expect(r.licenca.nome).toBe('Expirado');
  });

  it('vale até o último instante do prazo', async () => {
    expect((await verificarLicenca(await emitir('Limite', AGORA), AGORA, publicaJwk)).situacao).toBe(
      'valida',
    );
  });

  it('ignora espaço em volta ao colar', async () => {
    const token = await emitir('Colado', AGORA + UM_ANO);
    expect((await verificarLicenca(`\n  ${token}  \n`, AGORA, publicaJwk)).situacao).toBe('valida');
  });
});

describe('licença adulterada ou forjada', () => {
  it('recusa quando o corpo é alterado', async () => {
    const [, assinatura] = (await emitir('Cliente', AGORA + UM_ANO)).split('.');
    const outroCorpo = montarCorpo('Cliente', 0, 'teste-1');

    expect(
      (await verificarLicenca(`${outroCorpo}.${assinatura}`, AGORA, publicaJwk)).situacao,
    ).toBe('invalida');
  });

  it('recusa quando a assinatura é alterada', async () => {
    const [corpo, assinatura] = (await emitir('Cliente', AGORA + UM_ANO)).split('.');
    const trocado = assinatura[0] === 'A' ? `B${assinatura.slice(1)}` : `A${assinatura.slice(1)}`;

    expect((await verificarLicenca(`${corpo}.${trocado}`, AGORA, publicaJwk)).situacao).toBe(
      'invalida',
    );
  });

  it('recusa licença assinada por outra chave', async () => {
    const token = await emitir('Pirata', 0);

    // Mesma licença, verificada contra a chave que o app realmente carrega.
    expect((await verificarLicenca(token, AGORA)).situacao).toBe('invalida');
  });

  it('recusa corpo sem assinatura nenhuma', async () => {
    expect(
      (await verificarLicenca(montarCorpo('Sem assinatura', 0, 'x'), AGORA, publicaJwk)).situacao,
    ).toBe('invalida');
  });

  it('recusa lixo, vazio e tamanho absurdo', async () => {
    for (const entrada of ['', 'não é licença', 'a.b.c', '!!!.???', 'A'.repeat(5000)]) {
      expect((await verificarLicenca(entrada, AGORA, publicaJwk)).situacao).toBe('invalida');
    }
    expect(
      (await verificarLicenca(undefined as unknown as string, AGORA, publicaJwk)).situacao,
    ).toBe('invalida');
  });
});

describe('formatarVencimento', () => {
  it('descreve o prazo em português', () => {
    expect(formatarVencimento({ nome: 'x', id: 'y', expiraEm: 0 })).toBe('sem prazo de validade');
    expect(
      formatarVencimento({ nome: 'x', id: 'y', expiraEm: Date.parse('2027-03-09T12:00:00Z') }),
    ).toBe('válida até 09/03/2027');
  });
});
