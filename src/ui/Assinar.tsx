import { useMemo, useState } from 'react';
import { formatarVencimento } from '../lib/license';
import { formatarCentavos } from '../lib/money';
import { gerarBrCode } from '../lib/pix';
import { ASAAS, ASAAS_PRONTO, COBRANCA_CONFIGURADA, PIX, PLANOS, WHATSAPP_SUPORTE, type Plano } from '../lib/plano';
import { irPara } from '../lib/router';
import type { App } from '../lib/useApp';
import { linkWhatsApp } from '../lib/whatsapp';
import { Aviso, Botao, Cartao, Titulo } from './base';

function Passo({ numero, titulo, children }: { numero: number; titulo: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-marca-600 text-sm font-bold text-white">
        {numero}
      </span>
      <div className="pt-0.5">
        <p className="font-medium text-slate-900">{titulo}</p>
        <div className="text-sm text-slate-600">{children}</div>
      </div>
    </li>
  );
}

export function Assinar({ app }: { app: App }) {
  const [escolhido, setEscolhido] = useState<Plano>(PLANOS[0]);
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [verificando, setVerificando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const brCode = useMemo(
    () =>
      gerarBrCode({
        chave: PIX.chave,
        nomeRecebedor: PIX.nome,
        cidade: PIX.cidade,
        valorCentavos: escolhido.precoCentavos,
        identificador: escolhido.id,
      }),
    [escolhido],
  );

  async function copiarPix() {
    try {
      await navigator.clipboard.writeText(brCode);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

  async function ativar() {
    setErro('');
    setVerificando(true);
    try {
      const r = await app.ativarLicenca(codigo);
      if (r.situacao === 'valida') {
        setCodigo('');
        irPara('/config');
      } else if (r.situacao === 'vencida') {
        setErro('Este código já venceu. Renove a assinatura para gerar um novo.');
      } else {
        setErro('Código inválido. Confira se copiou a mensagem inteira, sem cortar o final.');
      }
    } finally {
      setVerificando(false);
    }
  }

  const mensagemComprovante = [
    'Olá! Acabei de pagar o Orça no ZAP Pro.',
    '',
    `Plano: ${escolhido.nome} (${formatarCentavos(escolhido.precoCentavos)})`,
    'Segue o comprovante do PIX em anexo.',
    '',
    'Nome para a licença: ',
  ].join('\n');

  if (app.licenca) {
    return (
      <div className="space-y-5">
        <Botao variante="fantasma" aoClicar={() => irPara('/config')}>
          ← Voltar
        </Botao>
        <Cartao>
          <Titulo>Plano Pro ativo</Titulo>
          <p className="text-sm text-slate-600">
            Licença de <strong>{app.licenca.nome || 'sem nome'}</strong>, {formatarVencimento(app.licenca)}.
            Orçamentos ilimitados.
          </p>
        </Cartao>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Botao variante="fantasma" aoClicar={() => irPara('/config')}>
        ← Voltar
      </Botao>

      {app.licencaVencida && (
        <Aviso tom="alerta">
          Sua licença Pro venceu. Renove abaixo para voltar a ter orçamentos ilimitados — seus
          orçamentos continuam todos aqui.
        </Aviso>
      )}

      <div>
        <h1 className="text-xl font-bold text-slate-900">
          {COBRANCA_CONFIGURADA || ASAAS_PRONTO ? 'Assinar o Pro' : 'Ativar o Pro'}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {COBRANCA_CONFIGURADA || ASAAS_PRONTO
            ? 'Orçamentos ilimitados. Escolha o plano e pague em um minuto.'
            : 'Cole abaixo o código de ativação que você recebeu.'}
        </p>
      </div>

      {/* O seletor precisa aparecer sempre que existir algum meio de pagar —
          antes ele dependia só da chave PIX, e sem ela o cliente ficava preso
          ao primeiro plano da lista, sem conseguir escolher o mensal. */}
      {(COBRANCA_CONFIGURADA || ASAAS_PRONTO) && (
      <div className="grid gap-3 sm:grid-cols-2">
        {PLANOS.map((plano) => {
          const ativo = plano.id === escolhido.id;
          return (
            <button
              key={plano.id}
              type="button"
              onClick={() => {
                setEscolhido(plano);
                setCopiado(false);
              }}
              className={`rounded-xl border p-4 text-left transition ${
                ativo
                  ? 'border-marca-600 bg-marca-50 ring-2 ring-marca-100'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">{plano.nome}</span>
                {plano.destaque && (
                  <span className="rounded-full bg-marca-600 px-2 py-0.5 text-xs font-medium text-white">
                    melhor preço
                  </span>
                )}
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                {formatarCentavos(plano.precoCentavos)}
              </p>
              <p className="mt-1 text-xs text-slate-600">{plano.descricao}</p>
            </button>
          );
        })}
      </div>
      )}

      {/* Caminho automático primeiro: assinatura pelo Asaas cobra sozinha todo
          mês e libera sem ninguém conferir comprovante à mão. O PIX avulso fica
          abaixo, para quem prefere pagar de uma vez. */}
      {ASAAS_PRONTO && ASAAS[escolhido.id] && (
        <Cartao>
          <Titulo>Assinar agora</Titulo>
          <p className="mb-3 text-sm text-slate-600">
            Pagamento pelo Asaas — boleto ou cartão, cobrado automaticamente a cada
            renovação. Você recebe a cobrança por e-mail antes de vencer, e o acesso
            libera sozinho.
          </p>
          <Botao
            variante="primario"
            aoClicar={() =>
              globalThis.open(ASAAS[escolhido.id], '_blank', 'noopener,noreferrer')
            }
          >
            Assinar {escolhido.nome} · {formatarCentavos(escolhido.precoCentavos)}
          </Botao>
        </Cartao>
      )}

      {COBRANCA_CONFIGURADA && (
        <Cartao>
          <Titulo>{ASAAS_PRONTO ? 'Ou pague avulso no PIX' : 'Como pagar'}</Titulo>
          <ol className="space-y-4">
            <Passo numero={1} titulo="Copie o código PIX">
              <p className="mb-2">
                Abra o app do seu banco, escolha PIX &rsaquo; Copia e Cola e cole o código.
              </p>
              <p className="mb-2 rounded-lg border border-slate-200 bg-slate-50 p-2 font-mono text-xs break-all text-slate-700">
                {brCode}
              </p>
              <Botao variante="primario" aoClicar={copiarPix}>
                {copiado ? 'Código copiado!' : `Copiar código PIX de ${formatarCentavos(escolhido.precoCentavos)}`}
              </Botao>
            </Passo>

            <Passo numero={2} titulo="Mande o comprovante">
              {WHATSAPP_SUPORTE ? (
                <>
                  <p className="mb-2">Envie o comprovante e o nome que deve constar na licença.</p>
                  <Botao
                    aoClicar={() =>
                      globalThis.open(
                        linkWhatsApp(WHATSAPP_SUPORTE, mensagemComprovante),
                        '_blank',
                        'noopener,noreferrer',
                      )
                    }
                  >
                    Abrir WhatsApp
                  </Botao>
                </>
              ) : (
                <p>Envie o comprovante pelo canal de atendimento informado na compra.</p>
              )}
            </Passo>

            <Passo numero={3} titulo="Receba e cole o código de ativação">
              <p>
                Assim que o PIX for confirmado, você recebe um código de ativação. Cole abaixo e o
                Pro libera na hora.
              </p>
            </Passo>
          </ol>
        </Cartao>
      )}

      <Cartao>
        <Titulo>Já tem um código de ativação?</Titulo>
        <textarea
          className="min-h-24 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-100"
          placeholder="Cole aqui o código que você recebeu"
          aria-label="Código de ativação"
          value={codigo}
          maxLength={4096}
          onChange={(e) => {
            setCodigo(e.target.value);
            setErro('');
          }}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Botao
            variante="primario"
            aoClicar={ativar}
            desabilitado={verificando || codigo.trim().length === 0}
          >
            {verificando ? 'Verificando…' : 'Ativar Pro'}
          </Botao>
          <p className="text-xs text-slate-500">
            O código é verificado por assinatura digital, direto no seu aparelho.
          </p>
        </div>
        {erro && (
          <div className="mt-3">
            <Aviso tom="alerta">{erro}</Aviso>
          </div>
        )}
      </Cartao>

      <p className="text-xs text-slate-500">
        Sem assinatura você continua criando 5 orçamentos por mês, para sempre. O Pro tira o limite.
      </p>
    </div>
  );
}
