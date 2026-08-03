import { useRef, useState } from 'react';
import { formatarVencimento } from '../lib/license';
import { irPara } from '../lib/router';
import { COR_PADRAO } from '../lib/sanitize';
import { exportarBackup, importarBackup, LIMITE_MENSAL_GRATIS } from '../lib/storage';
import { PROFISSOES } from '../lib/professions';
import { COBRANCA_CONFIGURADA } from '../lib/plano';
import type { App } from '../lib/useApp';
import { Aviso, Botao, Campo, Cartao, Titulo } from './base';

/** Tipos aceitos no upload de logo. SVG fica de fora: pode conter script. */
const TIPOS_LOGO = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_ARQUIVO_BYTES = 3 * 1024 * 1024;
const LADO_MAXIMO = 512;

/**
 * Redesenha a imagem em canvas antes de guardar. Isso normaliza o formato,
 * descarta metadados e garante que só pixels — nunca o arquivo original —
 * entram no localStorage e no link compartilhado.
 */
function redesenharComoPng(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const escala = Math.min(1, LADO_MAXIMO / Math.max(img.width, img.height));
      const largura = Math.max(1, Math.round(img.width * escala));
      const altura = Math.max(1, Math.round(img.height * escala));

      const canvas = document.createElement('canvas');
      canvas.width = largura;
      canvas.height = altura;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('canvas indisponível'));
        return;
      }
      ctx.drawImage(img, 0, 0, largura, altura);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('imagem inválida'));
    };

    img.src = url;
  });
}

export function Config({ app }: { app: App }) {
  const [erroLogo, setErroLogo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const entradaBackup = useRef<HTMLInputElement>(null);

  const empresa = app.empresa;

  function mudar(campos: Partial<typeof empresa>) {
    app.atualizarEmpresa({ ...empresa, ...campos });
  }

  async function aoEscolherLogo(arquivo: File | undefined) {
    setErroLogo('');
    if (!arquivo) return;

    if (!TIPOS_LOGO.includes(arquivo.type)) {
      setErroLogo('Use PNG, JPG ou WEBP. SVG não é aceito por segurança.');
      return;
    }
    if (arquivo.size > MAX_ARQUIVO_BYTES) {
      setErroLogo('Arquivo maior que 3 MB.');
      return;
    }

    try {
      mudar({ logoDataUrl: await redesenharComoPng(arquivo) });
    } catch {
      setErroLogo('Não foi possível ler essa imagem.');
    }
  }

  function baixarBackup() {
    const conteudo = exportarBackup(empresa, app.propostas);
    const url = URL.createObjectURL(new Blob([conteudo], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `orca-no-zap-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function restaurarBackup(arquivo: File | undefined) {
    setMensagem('');
    if (!arquivo) return;

    const restaurado = importarBackup(await arquivo.text());
    if (!restaurado) {
      setMensagem('Arquivo de backup inválido.');
      return;
    }
    if (
      !globalThis.confirm(
        `Restaurar ${restaurado.propostas.length} orçamento(s)? Isso substitui todos os dados atuais deste navegador.`,
      )
    ) {
      return;
    }
    app.substituirTudo(restaurado.empresa, restaurado.propostas);
    setMensagem('Backup restaurado.');
  }

  return (
    <div className="space-y-5">
      <Botao variante="fantasma" aoClicar={() => globalThis.history.back()}>
        ← Voltar
      </Botao>

      <Cartao>
        <Titulo>Seus dados</Titulo>
        <p className="mb-3 text-xs text-slate-500">
          Aparecem no cabeçalho de todo orçamento que você enviar.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Nome ou empresa" valor={empresa.nome} aoMudar={(v) => mudar({ nome: v })} maximo={120} />
          <Campo rotulo="CNPJ ou CPF" valor={empresa.documento} aoMudar={(v) => mudar({ documento: v })} maximo={32} />
          <Campo rotulo="Telefone" valor={empresa.telefone} aoMudar={(v) => mudar({ telefone: v })} maximo={32} />
          <Campo rotulo="E-mail" valor={empresa.email} aoMudar={(v) => mudar({ email: v })} tipo="email" maximo={160} />
          <div className="sm:col-span-2">
            <Campo rotulo="Endereço" valor={empresa.endereco} aoMudar={(v) => mudar({ endereco: v })} maximo={240} />
          </div>
          <div className="sm:col-span-2">
            <Campo
              rotulo="Chave PIX"
              valor={empresa.chavePix}
              aoMudar={(v) => mudar({ chavePix: v })}
              dica="Aparece no rodapé do orçamento para o cliente pagar"
              maximo={160}
            />
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Sua profissão</span>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-marca-500"
              value={empresa.profissaoSlug}
              onChange={(e) => mudar({ profissaoSlug: e.target.value })}
            >
              <option value="">Não informada</option>
              {PROFISSOES.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Cor do orçamento</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="h-10 w-16 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
                value={empresa.corPrimaria || COR_PADRAO}
                onChange={(e) => mudar({ corPrimaria: e.target.value })}
              />
              <span className="text-xs text-slate-500">{empresa.corPrimaria}</span>
            </div>
          </label>
        </div>
      </Cartao>

      <Cartao>
        <Titulo>Logo</Titulo>
        <div className="flex flex-wrap items-center gap-4">
          {empresa.logoDataUrl ? (
            <img src={empresa.logoDataUrl} alt="Logo atual" className="h-20 w-20 rounded-lg border border-slate-200 object-contain" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">
              sem logo
            </div>
          )}
          <div className="space-y-2">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="block text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
              onChange={(e) => void aoEscolherLogo(e.target.files?.[0])}
            />
            {empresa.logoDataUrl && (
              <Botao variante="perigo" aoClicar={() => mudar({ logoDataUrl: '' })}>
                Remover logo
              </Botao>
            )}
            <p className="text-xs text-slate-500">PNG, JPG ou WEBP até 3 MB. A imagem é reduzida a 512px.</p>
          </div>
        </div>
        {erroLogo && (
          <div className="mt-3">
            <Aviso tom="alerta">{erroLogo}</Aviso>
          </div>
        )}
      </Cartao>

      <Cartao>
        <Titulo>Plano</Titulo>
        {app.licenca ? (
          <div className="space-y-3">
            <Aviso>
              Pro ativo — licença de <strong>{app.licenca.nome || 'sem nome'}</strong>,{' '}
              {formatarVencimento(app.licenca)}. Orçamentos ilimitados.
            </Aviso>
            <Botao
              variante="perigo"
              aoClicar={() => {
                if (globalThis.confirm('Remover a licença deste aparelho? Você volta ao plano gratuito.')) {
                  app.removerLicenca();
                }
              }}
            >
              Remover licença deste aparelho
            </Botao>
          </div>
        ) : (
          <div className="space-y-3">
            {app.licencaVencida && (
              <Aviso tom="alerta">Sua licença Pro venceu. Renove para tirar o limite de novo.</Aviso>
            )}
            <p className="text-sm text-slate-600">
              No plano gratuito você cria {LIMITE_MENSAL_GRATIS} orçamentos por mês. Usados neste mês:{' '}
              <strong className="tabular-nums">{app.cota.usadas}</strong>.
            </p>
            <Botao
              variante={COBRANCA_CONFIGURADA ? 'primario' : 'secundario'}
              aoClicar={() => irPara('/assinar')}
            >
              {COBRANCA_CONFIGURADA
                ? app.licencaVencida
                  ? 'Renovar o Pro'
                  : 'Assinar o Pro'
                : 'Tenho um código de ativação'}
            </Botao>
          </div>
        )}
      </Cartao>

      <Cartao>
        <Titulo>Backup</Titulo>
        <p className="mb-3 text-xs text-slate-500">
          Seus orçamentos ficam guardados apenas neste navegador. Limpar o histórico apaga tudo —
          baixe um backup de vez em quando.
        </p>
        <div className="flex flex-wrap gap-2">
          <Botao aoClicar={baixarBackup}>Baixar backup</Botao>
          <Botao aoClicar={() => entradaBackup.current?.click()}>Restaurar backup</Botao>
          <input
            ref={entradaBackup}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => void restaurarBackup(e.target.files?.[0])}
          />
        </div>
        {mensagem && (
          <div className="mt-3">
            <Aviso>{mensagem}</Aviso>
          </div>
        )}
      </Cartao>
    </div>
  );
}
