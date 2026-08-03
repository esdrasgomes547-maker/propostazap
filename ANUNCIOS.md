# Campanha de tráfego pago — especificação pronta para disparar

Estratégia orgânica está em [`TRAFEGO.md`](./TRAFEGO.md); textos de post em
[`CAMPANHAS.md`](./CAMPANHAS.md). Aqui é só a mídia paga.

Tudo abaixo já está validado contra os limites do Google (título ≤ 30 caracteres,
descrição ≤ 90, 3–15 títulos, 2–4 descrições). Falta apenas executar.

## Antes de gastar o primeiro real — leia

Isto **não** é o próximo passo óbvio do negócio, e vale registrar o porquê:

1. **Não há rastreamento de conversão.** O app não tem analytics (decisão de projeto:
   quebraria a CSP e rastrearia o usuário). Sem isso, o Google não sabe otimizar e você não
   sabe qual palavra vendeu. Rodar assim é comprar clique no escuro.
2. **Nenhuma venda aconteceu ainda.** Não se sabe quantos visitantes viram assinante.
3. **A conta é apertada.** Clique em palavra de orçamento no Brasil custa algo entre R$1 e
   R$3. Se 1 em cada 50 visitantes assinar o anual de R$197, o custo por venda fica entre
   R$50 e R$150 — margem existe. Se for 1 em 300, você paga para trabalhar.

Ordem que reduz o risco: esperar as páginas ranquearem, ver no Search Console **quais
palavras já trazem gente**, e comprar tráfego só nessas. Sete páginas já estão na fila de
indexação.

Se for rodar antes disso, rode como **experimento barato**: R$10/dia, duas semanas,
R$140 no total, tratando o resultado como pesquisa e não como aquisição.

## Configuração da campanha

| Campo | Valor |
|---|---|
| Plataforma | Google Ads (`ds_id: AW`) |
| Tipo | `SEARCH` |
| Orçamento | R$ 10,00 por dia |
| Lance | `MAXIMIZE_CLICKS` |
| Local | Brasil |
| Idioma | Português |
| Status inicial | **PAUSADA** — sempre |

Sem conversão configurada, `MAXIMIZE_CLICKS` é a estratégia honesta:
`MAXIMIZE_CONVERSIONS` sem sinal de conversão gasta às cegas.

## Grupos de anúncio

Um por profissão, cada um levando para a página daquela profissão — não para a home. É o
que faz o anúncio, a busca e a página falarem a mesma coisa, o que derruba o custo por
clique.

| Grupo | Destino | Palavras-chave (frase) |
|---|---|---|
| Eletricista | `/modelo-de-orcamento/eletricista/` | modelo de orçamento eletricista · orçamento de serviço elétrico · como fazer orçamento de elétrica · quanto cobrar instalação elétrica |
| Pedreiro | `/modelo-de-orcamento/pedreiro/` | modelo de orçamento pedreiro · orçamento de obra · como fazer orçamento de reforma · quanto cobrar por m2 de alvenaria |
| Pintor | `/modelo-de-orcamento/pintor/` | modelo de orçamento pintura · orçamento de pintura residencial · quanto cobrar por m2 de pintura |
| Encanador | `/modelo-de-orcamento/encanador/` | modelo de orçamento hidráulica · orçamento de encanador · quanto cobrar para consertar vazamento |
| Diarista | `/modelo-de-orcamento/diarista/` | modelo de orçamento diarista · quanto cobrar por diária de limpeza |
| Genérico | `/modelos/` | modelo de orçamento de serviço · como fazer orçamento profissional · aplicativo de orçamento |

Correspondência **de frase**, não ampla: ampla queima verba em busca desencontrada
enquanto não há dado para filtrar.

## Anúncios

Os mesmos títulos e descrições em todos os grupos, trocando só o primeiro título pelo nome
da profissão (ex.: "Orçamento p/ Eletricista").

**Títulos** (nenhum passa de 30 caracteres)

```
Orçamento Pronto em 2 Min      Grátis e Sem Cadastro
Modelo de Orçamento Grátis     Veja Seu Lucro Antes
Orçamento pelo WhatsApp        Orçamento no Celular
Pare de Perder Serviço         PropostaZap
Orçamento Profissional Já      5 Orçamentos Grátis/Mês
```

**Descrições** (nenhuma passa de 90 caracteres)

```
Monte o orçamento com itens, prazo e garantia. Envie pelo WhatsApp em 2 minutos.
Grátis, sem cadastro e sem instalar nada. Funciona direto no navegador do celular.
Lance o custo e veja seu lucro real antes de mandar o preço para o cliente.
Preço solto no zap vira leilão. Orçamento detalhado fecha mais serviço.
```

## Palavras negativas

Bloqueiam quem busca aprender, não contratar — é onde a verba costuma vazar:

```
curso · apostila · emprego · vaga · salário · pdf grátis · excel
planilha grátis · download · como ser · concurso · estágio
```

## O que impede de rodar hoje

1. **Permissão do Supermetrics no Claude Code.** `/permissions` → liberar
   `mcp__claude_ai_Supermetrics_Marketing_Analytics__*`. Sem isso não consigo nem listar
   contas.
2. **Conta Google Ads com cobrança ativa**, no seu CPF, conectada ao Supermetrics. Criar
   conta e cadastrar cartão é com você — não faço nem uma coisa nem outra.

Com os dois resolvidos, a execução é: descobrir a conta, criar a campanha pausada, conferir
grupos e palavras, e te entregar para revisar antes de ligar.

## Como saber se está funcionando

Sem conversão rastreada, o sinal possível é indireto: custo por clique, taxa de cliques por
palavra e — o mais importante — **quantas licenças você emitiu na semana**. Se rodar duas
semanas e não sair nenhuma venda, desligue. A resposta não é aumentar o orçamento.
