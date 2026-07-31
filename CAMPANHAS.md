# Campanhas — material pronto para publicar

Estratégia e situação da indexação estão em [`TRAFEGO.md`](./TRAFEGO.md). Este arquivo é
só o que se copia e cola.

Links base:

- Home — https://esdrasgomes547-maker.github.io/propostazap/
- Preços — https://esdrasgomes547-maker.github.io/propostazap/precos/
- Modelos — https://esdrasgomes547-maker.github.io/propostazap/modelos/
- Profissão — `…/modelo-de-orcamento/{slug}/` (ex.: `eletricista`, `pedreiro`, `pintor`,
  `encanador`, `diarista`, `marceneiro`, `montador-de-moveis`, `tecnico-ar-condicionado`)

**Sempre poste o link da profissão do grupo, nunca a home.** A página específica converte
muito mais porque já mostra os serviços daquela pessoa.

---

## A regra que decide se funciona ou não

Grupo de profissional trata divulgação como spam — e apaga, ou bane. O que passa é
**resposta útil**. Então o padrão é: entre no grupo, fique alguns dias, responda perguntas
de verdade, e só então poste o link como resposta a uma dúvida real.

Sinal de que você está fazendo certo: alguém responde “vou testar”. Sinal de que está
errado: ninguém responde e você postou primeiro.

---

## Semana 1 — indexação e base

1. Google Search Console configurado, sitemap enviado, indexação manual pedida para
   `eletricista`, `pedreiro`, `pintor`, `encanador`, `diarista`.
2. Bing Webmaster Tools importado do Search Console.
3. Entrar em 10 grupos (5 de WhatsApp, 5 de Facebook) das profissões acima. **Não postar
   nada ainda.**
4. Perfil no Instagram/TikTok com a bio abaixo.

**Bio de perfil**

> Orçamento profissional em 2 minutos, direto do celular.
> Grátis, sem cadastro. Link abaixo 👇
> esdrasgomes547-maker.github.io/propostazap/

---

## Semana 2 — primeiros posts

Um post por dia, um grupo por vez. Nunca o mesmo texto em dois grupos no mesmo dia.

**Post 1 — resposta a “quanto devo cobrar?”**

> Depende muito da sua região e do seu custo, mas montei uma página com os serviços mais
> pedidos de [profissão] e a faixa de referência de cada um. Dá pra montar o orçamento ali
> mesmo e mandar pro cliente pelo WhatsApp, de graça:
> [link da profissão]

**Post 2 — resposta a “cliente sumiu depois do preço”**

> Isso quase sempre é porque o preço foi solto na conversa. Quando vai só o número, o
> cliente só consegue comparar por número. Desde que comecei a mandar orçamento
> detalhado — itens, prazo, garantia e validade — parou de sumir tanto. Uso isso aqui,
> é grátis e não precisa cadastrar: [link da profissão]

**Post 3 — foco na margem**

> Dica que mudou meu jogo: lançar o custo de cada item antes de fechar o preço. Já
> descobri serviço que eu achava bom e estava me dando quase nada. Essa ferramenta mostra
> o lucro e a % de margem enquanto você monta: [link da profissão]

**Post 4 — objeção de tempo**

> Sei que ninguém quer parar pra fazer planilha depois de um dia inteiro de serviço. Por
> isso gostei dessa: os serviços de [profissão] já vêm prontos, você clica, ajusta o valor
> e manda o link pelo zap. Leva menos tempo que digitar o preço na conversa:
> [link da profissão]

**Post 5 — prova social (usar só depois de ter usuário real)**

> Comecei a mandar orçamento por escrito no mês passado. Fechei [N] de [M] serviços que
> orcei — antes eu nem sabia quantos tinha perdido. A ferramenta é grátis até 5 por mês:
> [link da profissão]

**Post 6 — pergunta que gera conversa (poste sem link)**

> Sinceramente: vocês mandam orçamento por escrito ou falam o preço direto no zap?
> Tô querendo entender se sou só eu que perdia serviço por causa disso.

Depois que responderem, aí você entra com o link na conversa.

---

## Semana 3 — vídeo curto

Reels, TikTok e Shorts: o mesmo vídeo nos três. Grave com o celular, sem edição.

**Roteiro A — “o erro de mandar preço no zap” (25s)**

- 0–3s (tela do WhatsApp com “fica 800”): “Se você manda o preço assim, você já perdeu.”
- 3–10s: “O cliente só consegue comparar número com número. Ele vai perguntar pro
  próximo e vai fechar com quem cobrar 750.”
- 10–20s (tela montando o orçamento): “Agora manda assim: item por item, prazo, garantia,
  validade. Aí não é mais preço, é proposta.”
- 20–25s: “É de graça. Link na bio.”

**Roteiro B — “descobri que tava trabalhando de graça” (30s)**

- 0–5s: “Esse serviço aqui eu cobrava 600 e achava ótimo.”
- 5–15s (lançando os custos): “Aí eu lancei o custo do material… 480. Sobrava 120 pra dois
  dias de trabalho.”
- 15–25s: “Hoje eu lanço o custo antes de falar o preço. Aparece a margem na hora.”
- 25–30s: “Link na bio, é grátis.”

**Roteiro C — “orçamento em 2 minutos” (20s, sem falar)**

Grave a tela: escolhe a profissão → clica em 3 serviços → ajusta valores → “Enviar no
WhatsApp”. Legenda: “Orçamento profissional em 2 minutos. Sem cadastro, sem pagar nada.”

---

## Semana 4 — cauda longa e conversão

1. Adicionar 5 profissões novas ao catálogo (`src/lib/professions.ts`), rodar
   `bun run build` e `bun run indexnow`. Cada profissão nova é uma página nova.
2. Olhar no Search Console quais páginas ganharam impressão e escrever mais para essas.
3. Só agora divulgar o Pro, e apenas para quem já usa: quem bateu no limite de 5 é quem
   compra.

**Post de conversão para o Pro** (usar em lista própria, nunca em grupo)

> Se você já usou os 5 orçamentos do mês, o Pro tira o limite: R$ 197 no ano ou R$ 29 no
> mês, pago no PIX, sem cartão e sem fidelidade. Preços: [link de preços]

---

## Respostas prontas para as objeções

**“É pago?”**
> Dá pra usar de graça, 5 orçamentos por mês, e isso não expira. Só paga se quiser tirar
> o limite.

**“Precisa instalar?”**
> Não. Abre no navegador do celular igual um site. Se quiser, dá pra adicionar na tela de
> início e fica com cara de app.

**“Precisa cadastrar?”**
> Não pede e-mail nem senha. Os orçamentos ficam salvos no seu próprio celular.

**“E meus dados?”**
> Não vão pra servidor nenhum — nem os seus, nem os dos seus clientes. Fica tudo no
> aparelho. Dá pra baixar um backup quando quiser.

**“Já uso planilha.”**
> Planilha funciona, mas não manda link pro cliente nem calcula sua margem enquanto você
> monta. E não dá pra fazer no celular no meio da obra.

**“Como o cliente recebe?”**
> Você gera um link e manda no zap, ou salva em PDF. Ele abre no celular sem instalar nada.

---

## O que não fazer

- Postar o mesmo texto em vários grupos no mesmo dia. É o jeito mais rápido de ser banido.
- Postar link antes de participar do grupo.
- Prometer o que o app não faz: não emite nota fiscal, não recebe pagamento do cliente
  final, não sincroniza entre aparelhos.
- Comprar seguidor ou grupo de disparo. Queima o número do WhatsApp e não converte.
