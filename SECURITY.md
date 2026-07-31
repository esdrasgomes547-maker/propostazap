# Auditoria de segurança — PropostaZap

Data: 30/07/2026 · Versão auditada: commit inicial do MVP · Revisor: Claude (Opus 5)

## 1. Escopo e modelo de ameaça

O PropostaZap é uma aplicação **inteiramente client-side**. Não há backend, banco de
dados, sessão, autenticação nem endpoint de API. Isso remove de partida classes inteiras
de vulnerabilidade (SQL injection, SSRF, IDOR, falha de autorização, exposição de
credencial no servidor) e concentra o risco em três superfícies:

| # | Superfície | Fonte de dado não confiável |
|---|---|---|
| A | Link público `#/ver/<token>` | Qualquer pessoa pode forjar o token e enviá-lo à vítima |
| B | Importação de backup JSON | Arquivo escolhido pelo usuário, possivelmente adulterado |
| C | `localStorage` | Adulterável por qualquer script na origem ou pelo DevTools |

Atacante considerado: alguém que consegue fazer a vítima abrir um link ou importar um
arquivo. O objetivo dele seria executar script na origem (XSS), travar o navegador
(negação de serviço) ou corromper os dados do prestador.

## 2. Achados

Todos os itens abaixo foram **corrigidos** nesta versão, com teste de regressão.

### A-1 · Média · Estado da tela divergia do que foi persistido

`useApp` gravava no estado React o valor bruto vindo do formulário e só saneava na hora de
escrever no `localStorage`. Um valor recusado pelo saneador (logo SVG, cor inválida)
continuava aparecendo na interface e no documento renderizado, mas sumia ao recarregar a
página — o usuário via um estado que não existia.

Correção: `validarEmpresa` / `validarProposta` passaram a rodar **antes** do `setState`.
Tela e armazenamento agora contam a mesma história.
Teste: `src/lib/useApp.test.ts` › “mantém o estado igual ao que foi persistido”.

### A-2 · Alta · Perda de dados em criações sucessivas

Os callbacks de `useApp` liam a lista de propostas pelo closure do render. Duas criações
no mesmo tick partiam da mesma lista antiga, e a segunda gravava por cima da primeira —
perda silenciosa de dados do usuário, e numeração duplicada.

Correção: o estado passou a ser espelhado em `useRef`, e toda operação lê a ref.
Teste: `src/lib/useApp.test.ts` › “recusa criar acima da cota gratuita” (cria 5 em
sequência e confere que as 5 sobreviveram).

### A-3 · Média · Saneamento agressivo mutilava a digitação

O saneador aparava e colapsava espaço em branco, e validava formato de e-mail, no mesmo
caminho por onde passa cada tecla digitada. Consequências: o espaço recém-digitado era
apagado (impossível escrever “Maria Souza”), e o campo de e-mail era zerado a cada
caractere, porque `a`, `a@` e `a@b` não passam no regex.

Causa raiz: confundir **normalização** com **controle de segurança**. Aparar espaço não
protege de nada; validar formato de e-mail também não, já que o e-mail só é renderizado
como texto e nunca vira `href`.

Correção: `texto`/`textoMultilinha` mantêm apenas o que é controle de segurança
(remoção de caracteres invisíveis e teto de tamanho). A validação de formato de e-mail
saiu do caminho de escrita.
Teste: `src/App.test.tsx` › “não mutila o texto enquanto o usuário digita”.

### A-4 · Média · Campos multilinha perdiam todas as quebras de linha

A faixa de caracteres de controle removida (`\u0000-\u001f`) inclui `\n` (U+000A). Com
isso, “Condições de pagamento” e “Observações” viravam um parágrafo único.

Correção: regex separada para campos multilinha, preservando U+000A.
Teste: `src/lib/sanitize.test.ts` › bloco `textoMultilinha`.

### A-5 · Baixa · Ausência de CSP e cabeçalhos de segurança

Correção: `Content-Security-Policy` restritiva aplicada em duas camadas — meta tag em
todas as páginas (funciona até no GitHub Pages, que não deixa configurar cabeçalho) e
cabeçalho HTTP real via `public/_headers` (Cloudflare Pages) e `vercel.json` (Vercel).

```
default-src 'self'; base-uri 'none'; object-src 'none';
img-src 'self' data: blob:; style-src 'self' 'unsafe-inline';
script-src 'self'; connect-src 'self'; font-src 'self';
form-action 'none'; frame-ancestors 'none'
```

Acompanham: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
`Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` negando câmera,
microfone e geolocalização, `Cross-Origin-Opener-Policy: same-origin` e HSTS de 1 ano.

`'unsafe-inline'` permanece em `style-src` porque o React aplica cor da marca via atributo
`style`. O valor injetado passa por `corHex`, que só aceita `#rrggbb` — não há caminho
para injeção de CSS.

## 3. Controles implementados

**Contra XSS.** Nenhuma ocorrência de `dangerouslySetInnerHTML`, `innerHTML`, `eval`,
`new Function` ou `document.write` no código (verificado por varredura). Os dois únicos
atributos dinâmicos perigosos são cobertos:

- `img src` recebe apenas data URL de imagem **rasterizada** validada por regex
  (`dataUrlImagem`). SVG é recusado de propósito: SVG carrega `<script>` e executa mesmo
  dentro de `<img>` em alguns contextos.
- `style` recebe apenas `#rrggbb` validado (`corHex`), com queda para a cor padrão.

O gerador de páginas estáticas escapa `& < > " '` em todo texto interpolado, e o JSON-LD
escapa `<` para impedir fechamento prematuro da tag `<script>`.

Teste: `src/App.test.tsx` › “não executa conteúdo hostil que venha no link” injeta
`<img src=x onerror=…>` e `<script>` pelo link e confirma que aparecem como texto literal,
que nenhum elemento `img[src="x"]` é criado e que o payload não executou.

**Contra negação de serviço.** O link comprime o documento com `deflate-raw`, o que abre
espaço para bomba de descompressão. Trava em três camadas: teto de 400 000 caracteres no
token de entrada, leitura do stream **abortada** ao ultrapassar 3 MB descompactados (não
se materializa o conteúdo antes de medir), e teto de 200 itens por proposta.
Testes: `src/lib/share.test.ts`, bloco “entrada hostil”.

**Contra poluição de protótipo.** O validador nunca faz spread do payload: constrói
objetos novos lendo apenas as chaves conhecidas. Um payload com `__proto__` é ignorado.
Teste: `src/lib/share.test.ts` › bloco “poluição de protótipo”.

**Contra corrupção de dados.** Todo valor numérico passa por `inteiroEntre` com faixa
declarada; toda enumeração (`status`, `unidade`, `descontoTipo`) por lista de permissão;
toda data por `Date.parse` com queda para “agora”. JSON malformado e `localStorage`
indisponível (aba anônima, cota cheia) são tratados sem exceção, e a interface avisa o
usuário quando a gravação falha.

**Aritmética financeira.** Nenhum valor monetário circula como ponto flutuante: dinheiro é
inteiro em centavos, quantidade é inteiro em milésimos. Multiplicações verificam
`Number.isSafeInteger` e saturam no teto em vez de perder precisão em silêncio.

**Redirecionamento e janelas.** O único `window.open` aponta para `https://wa.me/` com
host fixo e usa `noopener,noreferrer`. O texto da mensagem passa por
`encodeURIComponent`, então conteúdo do usuário não escapa para outro parâmetro da query.
Teste: `src/lib/whatsapp.test.ts` › “não deixa o texto escapar para outro parâmetro”.

**Cadeia de suprimentos.** Dependências de produção: apenas `react` e `react-dom`.
`npm audit` reporta 0 vulnerabilidades, tanto em produção quanto incluindo desenvolvimento.
Nenhum recurso de terceiros é carregado em tempo de execução — sem CDN, sem fonte externa,
sem analytics, sem pixel de rastreamento. A CSP `default-src 'self'` torna isso obrigatório,
não apenas convencional.

**Licenciamento.** A licença Pro é um par corpo/assinatura em base64url, assinado com
ECDSA P-256 (SHA-256). O app importa somente a chave pública e chama
`crypto.subtle.verify` — verificar não permite emitir. O plano nunca é lido do
`localStorage` como um booleano: o que fica gravado é o código, e ele só vira "Pro" depois
que a assinatura confere. Um valor plantado à mão no `localStorage` não libera nada.
Testes: `src/lib/license.test.ts` (13 casos, incluindo corpo trocado, assinatura trocada e
licença assinada por outra chave) e `src/ui/Assinar.test.tsx`.

**Cobrança por PIX.** O código "copia e cola" é gerado localmente conforme a especificação
do BR Code do Banco Central — montagem de string mais CRC-16/CCITT-FALSE. Não há gateway,
chamada de rede nem chave de API envolvida, e portanto nenhuma superfície nova de ataque
nem custo por transação. Testes: `src/lib/pix.test.ts`, que decodifica o TLV gerado com um
parser independente em vez de comparar com a própria saída.

**Upload de logo.** O arquivo escolhido nunca é usado diretamente. É redesenhado em
`<canvas>` e reexportado como PNG, o que descarta metadados (EXIF, geolocalização da foto)
e qualquer payload anexado ao arquivo original. Tipo restrito a PNG/JPEG/WEBP, tamanho a
3 MB, lado máximo a 512 px.

## 4. Riscos residuais — aceitos e documentados

Estes **não** são defeitos a corrigir: são consequências diretas da decisão de não ter
servidor. Estão listados para que a decisão seja consciente.

**R-1 · O link público não tem autenticação.** Quem tiver o link vê o orçamento. Não há
como revogar. É o modelo de um link do Google Drive “qualquer pessoa com o link”, e está
avisado na interface antes de o usuário copiar. Restringir acesso exigiria servidor e
cadastro.

**R-2 · A licença é verificada no cliente.** Desde a introdução do plano Pro, o acesso
depende de uma licença assinada com ECDSA P-256: o app carrega só a chave pública, então
**não é possível forjar nem editar uma licença** — mudar um caractere invalida a
assinatura, e emitir exige a chave privada, que fica fora do repositório. O que continua
possível, e não tem solução sem servidor: repassar a mesma licença para outra pessoa, e
alterar o JavaScript no próprio navegador. Mitigações já aplicadas: a licença tem prazo,
carrega o nome do comprador (repasse fica visível) e o `id` da emissão permite rastrear
qual pagamento gerou qual licença, pelo registro em `chaves/licencas-emitidas.csv`.

Consequência operacional: a chave privada **é** o negócio. Perdê-la impede novas emissões;
vazá-la permite que qualquer um emita licenças. Backup offline é obrigatório.

**R-3 · Dados pessoais viajam dentro da URL.** O orçamento carrega nome, telefone, CPF e
endereço do cliente. Ponto a favor: o conteúdo fica no **fragmento** da URL, que os
navegadores não enviam ao servidor — a hospedagem nunca vê esses dados. Pontos de atenção:
o link fica no histórico do navegador e no corpo da mensagem enviada, então o aplicativo de
mensagem (WhatsApp) trafega esse conteúdo. Para a LGPD, o prestador é o controlador dos
dados dos clientes dele; o app é ferramenta local e não coleta nada.

**R-4 · Perder o navegador é perder os dados.** Não há cópia remota. Mitigado com
exportação e importação de backup em JSON e com aviso explícito na tela de configurações.

**R-5 · O orçamento não é assinado.** Quem recebe o link pode editar o token e reencaminhar
uma versão com valores alterados. Só importa se a proposta for tratada como documento
vinculante — assinatura criptográfica exigiria uma chave que não pode viver no cliente,
ou seja, exigiria servidor.

## 5. Verificação executada

| Verificação | Resultado |
|---|---|
| `bunx tsc -b --noEmit` | sem erros |
| `bunx vitest run` | 130 testes, 11 arquivos, todos passando |
| `npm audit` (produção e completo) | 0 vulnerabilidades |
| Varredura de `innerHTML`/`eval`/`Function`/`document.write` | nenhuma ocorrência |
| Revisão manual de todo `href`/`src`/`style` dinâmico | 2 ocorrências, ambas validadas |
| Execução no Chrome com a CSP ativa | sem erro de console, sem violação de CSP |
| Fluxo ponta a ponta no navegador | criar → adicionar item → visualizar → gerar link: ok |

## 6. Próximos passos recomendados

1. Backend mínimo para guardar os orçamentos fora do aparelho (resolve R-4) e, se um dia
   o repasse de licença virar problema de verdade, para vincular licença a conta.
2. Assinar o token do link com HMAC no servidor, se a proposta virar documento
   vinculante (resolve R-5).
3. Considerar `Subresource Integrity` caso algum recurso passe a ser servido de terceiro —
   hoje não há nenhum.
