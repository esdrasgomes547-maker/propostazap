import { useEffect, useState } from 'react';
import { decodificarProposta } from '../lib/share';
import type { PropostaPublica } from '../lib/types';
import { Botao, Cartao } from './base';
import { Documento } from './Documento';

type Estado = { fase: 'carregando' } | { fase: 'erro' } | { fase: 'ok'; doc: PropostaPublica };

/**
 * Visão somente leitura de um orçamento recebido por link. Não toca no
 * localStorage: o que o cliente abre nunca vira dado do prestador.
 */
export function Publico({ token }: { token: string }) {
  const [estado, setEstado] = useState<Estado>({ fase: 'carregando' });

  useEffect(() => {
    let cancelado = false;

    decodificarProposta(token)
      .then((doc) => {
        if (cancelado) return;
        setEstado(doc ? { fase: 'ok', doc } : { fase: 'erro' });
      })
      .catch(() => {
        if (!cancelado) setEstado({ fase: 'erro' });
      });

    return () => {
      cancelado = true;
    };
  }, [token]);

  if (estado.fase === 'carregando') {
    return <p className="py-16 text-center text-sm text-slate-500">Abrindo orçamento…</p>;
  }

  if (estado.fase === 'erro') {
    return (
      <Cartao className="text-center">
        <p className="text-sm text-slate-600">
          Não foi possível abrir este orçamento. O link pode estar incompleto — links longos às vezes
          são cortados pelo aplicativo de mensagem.
        </p>
        <p className="mt-2 text-xs text-slate-500">Peça para quem enviou gerar o link novamente.</p>
      </Cartao>
    );
  }

  return (
    <div className="space-y-4">
      <div className="sem-impressao flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500">Orçamento recebido — somente leitura.</p>
        <div className="flex gap-2">
          <Botao aoClicar={() => globalThis.print()}>Salvar em PDF</Botao>
          <Botao
            variante="primario"
            aoClicar={() => {
              globalThis.location.hash = '';
            }}
          >
            Criar meus orçamentos
          </Botao>
        </div>
      </div>
      <Documento empresa={estado.doc.empresa} proposta={estado.doc.proposta} />
      <p className="sem-impressao pb-8 text-center text-xs text-slate-400">
        Feito com PropostaZap — orçamento profissional em 2 minutos, grátis.
      </p>
    </div>
  );
}
