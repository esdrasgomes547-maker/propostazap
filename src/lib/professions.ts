import type { Unidade } from './types';

export interface ServicoModelo {
  descricao: string;
  unidade: Unidade;
  /** Faixa de referência de mercado, em centavos. Não é cotação. */
  valorSugeridoCentavos: number;
}

export interface Duvida {
  pergunta: string;
  resposta: string;
}

export interface Profissao {
  slug: string;
  nome: string;
  categoria: string;
  intro: string;
  servicos: ServicoModelo[];
  duvidaEspecifica: Duvida;
  condicoesPagamento: string;
  garantiaMeses: number;
  prazoDias: number;
}

function s(descricao: string, unidade: Unidade, reais: number): ServicoModelo {
  return { descricao, unidade, valorSugeridoCentavos: Math.round(reais * 100) };
}

export const PROFISSOES: Profissao[] = [
  {
    slug: 'eletricista',
    nome: 'Eletricista',
    categoria: 'Instalações',
    intro:
      'Orçamento de elétrica precisa deixar claro o que é material e o que é mão de obra — é aí que a maioria dos eletricistas perde dinheiro ou perde o cliente. Separe ponto a ponto, diga a bitola do cabo e informe se o disjuntor entra no valor.',
    servicos: [
      s('Instalação de ponto de tomada 110/220V', 'un', 90),
      s('Troca de quadro de distribuição com disjuntores DR', 'un', 950),
      s('Passagem de cabeamento em eletroduto', 'm', 22),
      s('Instalação de chuveiro elétrico com cabo dedicado', 'un', 180),
      s('Diagnóstico de curto-circuito e laudo', 'h', 150),
    ],
    duvidaEspecifica: {
      pergunta: 'Devo cobrar a visita técnica separada no orçamento de elétrica?',
      resposta:
        'Sim. Coloque a visita como item próprio e informe que ela é abatida do valor final caso o serviço seja aprovado. Isso protege seu deslocamento e aumenta a taxa de fechamento.',
    },
    condicoesPagamento: '50% na aprovação e 50% na conclusão do serviço.',
    garantiaMeses: 12,
    prazoDias: 3,
  },
  {
    slug: 'pedreiro',
    nome: 'Pedreiro',
    categoria: 'Construção e reforma',
    intro:
      'O erro clássico no orçamento de pedreiro é cobrar por "serviço" em vez de por metro quadrado. Ao detalhar m² de alvenaria, m² de contrapiso e m² de reboco, você defende o preço quando o cliente pedir desconto.',
    servicos: [
      s('Levante de alvenaria em bloco cerâmico', 'm²', 85),
      s('Contrapiso desempenado', 'm²', 55),
      s('Reboco interno', 'm²', 48),
      s('Demolição de parede com retirada de entulho', 'm²', 70),
      s('Diária de servente de obra', 'dia', 180),
    ],
    duvidaEspecifica: {
      pergunta: 'Material entra no orçamento do pedreiro?',
      resposta:
        'Depende do combinado, mas sempre declare. Se for só mão de obra, escreva "material por conta do contratante" nas observações — sem isso, a discussão aparece no meio da obra.',
    },
    condicoesPagamento: '30% na aprovação, 40% no meio da obra e 30% na entrega.',
    garantiaMeses: 6,
    prazoDias: 15,
  },
  {
    slug: 'pintor',
    nome: 'Pintor',
    categoria: 'Construção e reforma',
    intro:
      'Orçamento de pintura vive de duas variáveis: metragem e número de demãos. Deixe as duas escritas. E cobre preparação de parede como item separado — massa corrida e lixamento são a maior parte do trabalho real.',
    servicos: [
      s('Pintura látex acrílico, duas demãos', 'm²', 28),
      s('Aplicação de massa corrida com lixamento', 'm²', 24),
      s('Pintura de teto com selador', 'm²', 32),
      s('Pintura de esquadria em esmalte sintético', 'm', 38),
      s('Textura projetada', 'm²', 45),
    ],
    duvidaEspecifica: {
      pergunta: 'Como calcular a metragem para pintura?',
      resposta:
        'Some a área das paredes (pé-direito × perímetro) e desconte portas e janelas apenas se somarem mais de 2 m². Vãos pequenos dão mais trabalho de recorte do que economia de tinta.',
    },
    condicoesPagamento: '50% na aprovação e 50% na entrega.',
    garantiaMeses: 12,
    prazoDias: 7,
  },
  {
    slug: 'encanador',
    nome: 'Encanador',
    categoria: 'Instalações',
    intro:
      'Vazamento é serviço de urgência: quem responde com orçamento pronto em minutos fecha. Tenha os itens salvos e mande o link pelo WhatsApp ainda na visita.',
    servicos: [
      s('Localização e reparo de vazamento', 'un', 320),
      s('Troca de registro ou misturador', 'un', 150),
      s('Instalação de caixa d’água com boia', 'un', 480),
      s('Desentupimento de esgoto com equipamento', 'un', 350),
      s('Troca de tubulação embutida', 'm', 95),
    ],
    duvidaEspecifica: {
      pergunta: 'Como orçar vazamento sem saber a origem?',
      resposta:
        'Divida em duas etapas: cobre a localização como item fechado e deixe o reparo como valor estimado, revisado após o diagnóstico. Escreva isso nas observações para não parecer aumento de preço.',
    },
    condicoesPagamento: 'Pagamento na conclusão do serviço.',
    garantiaMeses: 6,
    prazoDias: 2,
  },
  {
    slug: 'marceneiro',
    nome: 'Marceneiro',
    categoria: 'Construção e reforma',
    intro:
      'Móvel planejado é vendido no detalhe: tipo de MDF, ferragem, acabamento e prazo. Um orçamento que especifica a ferragem justifica um preço 30% maior que o do concorrente.',
    servicos: [
      s('Armário planejado em MDF 18mm', 'm²', 950),
      s('Bancada em MDF com acabamento pós-formado', 'm', 620),
      s('Painel ripado decorativo', 'm²', 720),
      s('Instalação e montagem em obra', 'dia', 420),
      s('Projeto executivo com detalhamento', 'un', 500),
    ],
    duvidaEspecifica: {
      pergunta: 'Cobro o projeto separado da execução?',
      resposta:
        'Sim, e informe que o valor do projeto é abatido se o móvel for fechado com você. Assim o desenho deixa de ser trabalho grátis para concorrente copiar.',
    },
    condicoesPagamento: '50% na aprovação do projeto e 50% na instalação.',
    garantiaMeses: 12,
    prazoDias: 30,
  },
  {
    slug: 'serralheiro',
    nome: 'Serralheiro',
    categoria: 'Construção e reforma',
    intro:
      'Estrutura metálica se orça por metro linear ou m², nunca por "peça". Informe espessura do perfil e tipo de tratamento — é o que separa o orçamento sério do chute.',
    servicos: [
      s('Portão de correr em chapa galvanizada', 'm²', 850),
      s('Grade de proteção em metalon', 'm²', 480),
      s('Corrimão em aço carbono com pintura', 'm', 320),
      s('Estrutura para cobertura metálica', 'm²', 390),
      s('Solda e reparo em estrutura existente', 'h', 120),
    ],
    duvidaEspecifica: {
      pergunta: 'Como cobrar a instalação de portão automatizado?',
      resposta:
        'Separe em três itens: fabricação, instalação e motor. O motor tem garantia do fabricante, não sua — deixe isso escrito para não herdar assistência técnica de terceiro.',
    },
    condicoesPagamento: '50% na aprovação e 50% na instalação.',
    garantiaMeses: 12,
    prazoDias: 20,
  },
  {
    slug: 'gesseiro',
    nome: 'Gesseiro',
    categoria: 'Construção e reforma',
    intro:
      'Forro e sanca se cobram por m² e por metro linear respectivamente. Misturar os dois no mesmo item é a receita para brigar por medição no fim da obra.',
    servicos: [
      s('Forro de gesso acartonado', 'm²', 78),
      s('Sanca aberta com iluminação indireta', 'm', 130),
      s('Parede em drywall com isolamento', 'm²', 165),
      s('Nicho e prateleira em gesso', 'un', 280),
      s('Acabamento e massa para pintura', 'm²', 22),
    ],
    duvidaEspecifica: {
      pergunta: 'Quem paga o recorte para luminárias?',
      resposta:
        'Coloque os recortes como item unitário no orçamento. Uma sala com 12 spots tem custo real de mão de obra que some se você só cobrar o m² do forro.',
    },
    condicoesPagamento: '40% na aprovação e 60% na conclusão.',
    garantiaMeses: 6,
    prazoDias: 10,
  },
  {
    slug: 'azulejista',
    nome: 'Azulejista',
    categoria: 'Construção e reforma',
    intro:
      'Assentamento de porcelanato grande formato custa mais que cerâmica comum — e o cliente só entende isso se estiver escrito. Separe por tipo de peça e por recortes.',
    servicos: [
      s('Assentamento de porcelanato até 60x60', 'm²', 65),
      s('Assentamento de grande formato acima de 80x80', 'm²', 95),
      s('Rejuntamento epóxi', 'm²', 38),
      s('Recorte para tomadas e ralos', 'un', 25),
      s('Regularização de contrapiso antes do assentamento', 'm²', 42),
    ],
    duvidaEspecifica: {
      pergunta: 'Devo cobrar a quebra de peças no orçamento?',
      resposta:
        'Informe a perda estimada (normalmente 10%) nas observações e diga que o material é comprado pelo cliente com essa folga. Evita ser responsabilizado por peça que faltou.',
    },
    condicoesPagamento: '50% na aprovação e 50% na conclusão.',
    garantiaMeses: 12,
    prazoDias: 8,
  },
  {
    slug: 'vidraceiro',
    nome: 'Vidraceiro',
    categoria: 'Instalações',
    intro:
      'Vidro se orça por m² com espessura declarada. Sem a espessura no papel, qualquer concorrente te ganha oferecendo 6mm onde você cotou 8mm temperado.',
    servicos: [
      s('Box de banheiro em vidro temperado 8mm', 'm²', 480),
      s('Espelho com lapidação e instalação', 'm²', 420),
      s('Janela de correr em vidro temperado', 'm²', 720),
      s('Porta de vidro temperado com ferragens', 'un', 1850),
      s('Troca de vidro quebrado', 'm²', 350),
    ],
    duvidaEspecifica: {
      pergunta: 'Como lidar com medidas passadas pelo cliente?',
      resposta:
        'Escreva que o orçamento vale para medidas conferidas em visita. Vidro temperado não aceita corte depois de pronto — errar a medida é prejuízo integral.',
    },
    condicoesPagamento: '60% na aprovação e 40% na instalação.',
    garantiaMeses: 12,
    prazoDias: 12,
  },
  {
    slug: 'jardineiro',
    nome: 'Jardineiro',
    categoria: 'Serviços gerais',
    intro:
      'Jardinagem vende melhor como contrato mensal do que como serviço avulso. Monte o orçamento mostrando o valor da visita única e o valor da manutenção recorrente lado a lado.',
    servicos: [
      s('Manutenção mensal de jardim', 'm²', 6),
      s('Poda de árvore de médio porte', 'un', 280),
      s('Plantio de grama esmeralda em placas', 'm²', 32),
      s('Limpeza e retirada de resíduos verdes', 'vb', 250),
      s('Projeto de paisagismo simples', 'un', 650),
    ],
    duvidaEspecifica: {
      pergunta: 'Como precificar manutenção recorrente?',
      resposta:
        'Calcule as horas da visita, multiplique pela frequência mensal e ofereça 10% de desconto no plano trimestral. Recorrência vale mais que margem em serviço isolado.',
    },
    condicoesPagamento: 'Mensal, todo dia 5, via PIX.',
    garantiaMeses: 1,
    prazoDias: 2,
  },
  {
    slug: 'piscineiro',
    nome: 'Piscineiro',
    categoria: 'Serviços gerais',
    intro:
      'Tratamento de piscina é contrato: o cliente compra tranquilidade, não produto. Deixe claro o que está incluso em produtos químicos e o que é cobrado à parte.',
    servicos: [
      s('Manutenção semanal com produtos inclusos', 'un', 320),
      s('Limpeza profunda e aspiração', 'un', 280),
      s('Tratamento de choque para água verde', 'un', 450),
      s('Troca de areia do filtro', 'un', 550),
      s('Reparo de bomba e motor', 'h', 140),
    ],
    duvidaEspecifica: {
      pergunta: 'Produtos químicos entram no valor mensal?',
      resposta:
        'Ofereça as duas versões no mesmo orçamento: com produtos inclusos e sem. Cliente que compara preço quase sempre escolhe o pacote completo quando vê a diferença por escrito.',
    },
    condicoesPagamento: 'Mensal, via PIX ou boleto.',
    garantiaMeses: 1,
    prazoDias: 1,
  },
  {
    slug: 'dedetizador',
    nome: 'Dedetizador',
    categoria: 'Serviços gerais',
    intro:
      'Controle de pragas exige certificado sanitário no orçamento. Informar o número do produto registrado e o prazo de garantia transforma preço em confiança.',
    servicos: [
      s('Dedetização residencial completa', 'm²', 5),
      s('Descupinização com barreira química', 'm²', 12),
      s('Desratização com iscas monitoradas', 'un', 380),
      s('Limpeza e higienização de caixa d’água', 'un', 280),
      s('Emissão de certificado sanitário', 'un', 80),
    ],
    duvidaEspecifica: {
      pergunta: 'Preciso oferecer retorno gratuito?',
      resposta:
        'Sim, e use isso como argumento. Um retorno incluso em 30 dias custa pouco e é o item que mais fecha contrato com condomínio e restaurante.',
    },
    condicoesPagamento: 'Pagamento na conclusão do serviço.',
    garantiaMeses: 3,
    prazoDias: 2,
  },
  {
    slug: 'diarista',
    nome: 'Diarista',
    categoria: 'Serviços gerais',
    intro:
      'Diária sem escopo escrito vira trabalho infinito. Liste os cômodos e o que está incluso — vidros, geladeira e forno costumam ser cobrados à parte com razão.',
    servicos: [
      s('Diária de limpeza padrão até 80m²', 'dia', 180),
      s('Limpeza pesada pós-festa', 'dia', 260),
      s('Lavagem de vidros e janelas', 'un', 15),
      s('Passadoria de roupas', 'h', 35),
      s('Higienização de geladeira e forno', 'un', 60),
    ],
    duvidaEspecifica: {
      pergunta: 'Como cobrar sem virar vínculo empregatício?',
      resposta:
        'Trabalhe com no máximo duas diárias por semana no mesmo endereço e registre cada dia como serviço avulso no orçamento. Acima disso, a lei entende como emprego doméstico.',
    },
    condicoesPagamento: 'Pagamento no dia do serviço, via PIX.',
    garantiaMeses: 0,
    prazoDias: 1,
  },
  {
    slug: 'limpeza-pos-obra',
    nome: 'Limpeza pós-obra',
    categoria: 'Serviços gerais',
    intro:
      'Pós-obra é o serviço mais subprecificado do mercado. Cobre por m² considerando grosso e fino como etapas distintas — respingo de tinta e cimento em vidro leva horas.',
    servicos: [
      s('Limpeza grossa com retirada de resíduos', 'm²', 12),
      s('Limpeza fina com remoção de respingos', 'm²', 18),
      s('Remoção de cimento em porcelanato', 'm²', 14),
      s('Limpeza de fachada e vidros externos', 'm²', 25),
      s('Equipe adicional por diária', 'dia', 220),
    ],
    duvidaEspecifica: {
      pergunta: 'Vale aceitar pós-obra por valor fechado?',
      resposta:
        'Só depois de visitar. Obra entregue "quase limpa" e obra com entulho no chão têm custos completamente diferentes — feche valor apenas com o estado registrado em foto.',
    },
    condicoesPagamento: '50% na aprovação e 50% na entrega.',
    garantiaMeses: 0,
    prazoDias: 3,
  },
  {
    slug: 'tecnico-ar-condicionado',
    nome: 'Técnico de ar-condicionado',
    categoria: 'Instalações',
    intro:
      'Instalação de split tem variáveis que o cliente não enxerga: metragem de linha frigorígena, altura e infraestrutura. Cada uma delas precisa virar item no orçamento.',
    servicos: [
      s('Instalação de split até 12.000 BTUs', 'un', 650),
      s('Metro adicional de linha frigorígena', 'm', 120),
      s('Limpeza completa com higienização', 'un', 220),
      s('Recarga de gás R410A', 'un', 380),
      s('Manutenção preventiva contratual', 'un', 180),
    ],
    duvidaEspecifica: {
      pergunta: 'Quanto cobrar por instalação em altura?',
      resposta:
        'Acrescente de 30% a 50% quando exigir andaime ou rapel, e coloque como item separado chamado "trabalho em altura". Diluir esse custo no valor base derruba sua margem.',
    },
    condicoesPagamento: '50% na aprovação e 50% na conclusão.',
    garantiaMeses: 12,
    prazoDias: 4,
  },
  {
    slug: 'tecnico-refrigeracao',
    nome: 'Técnico em refrigeração',
    categoria: 'Instalações',
    intro:
      'Refrigeração comercial não tolera parada. Ofereça contrato preventivo no mesmo orçamento do reparo corretivo — é o momento de maior dor do cliente.',
    servicos: [
      s('Diagnóstico técnico com laudo', 'un', 180),
      s('Troca de compressor em câmara fria', 'un', 2400),
      s('Reparo em expositor refrigerado', 'un', 480),
      s('Contrato de manutenção preventiva mensal', 'un', 650),
      s('Atendimento emergencial fora do horário', 'h', 250),
    ],
    duvidaEspecifica: {
      pergunta: 'Como cobrar atendimento de urgência?',
      resposta:
        'Defina uma tabela com adicional noturno e de fim de semana e deixe visível no orçamento. Cliente com câmara fria parada paga sem discutir — desde que o preço não pareça improviso.',
    },
    condicoesPagamento: 'Pagamento na conclusão ou faturado em 15 dias.',
    garantiaMeses: 6,
    prazoDias: 2,
  },
  {
    slug: 'montador-de-moveis',
    nome: 'Montador de móveis',
    categoria: 'Serviços gerais',
    intro:
      'Montagem se cobra por peça, com o porte declarado. Guarda-roupa de 6 portas e criado-mudo não podem cair no mesmo item.',
    servicos: [
      s('Montagem de guarda-roupa até 6 portas', 'un', 220),
      s('Montagem de cama box com baú', 'un', 90),
      s('Instalação de painel de TV com fixação', 'un', 150),
      s('Desmontagem para mudança', 'un', 130),
      s('Hora adicional de ajuste', 'h', 70),
    ],
    duvidaEspecifica: {
      pergunta: 'Quem responde por peça que veio faltando?',
      resposta:
        'A loja. Escreva nas observações que a montagem pressupõe kit completo e que retorno por falta de peça é cobrado como nova visita.',
    },
    condicoesPagamento: 'Pagamento na conclusão do serviço.',
    garantiaMeses: 3,
    prazoDias: 2,
  },
  {
    slug: 'arquiteto',
    nome: 'Arquiteto',
    categoria: 'Projeto e engenharia',
    intro:
      'Projeto se vende por etapas, não por desenho. Estudo preliminar, anteprojeto e executivo com valores separados dão ao cliente uma porta de entrada barata e a você um funil.',
    servicos: [
      s('Estudo preliminar com layout', 'm²', 45),
      s('Projeto executivo completo', 'm²', 120),
      s('Detalhamento de marcenaria', 'm²', 65),
      s('Acompanhamento de obra por visita', 'un', 450),
      s('Consultoria pontual', 'h', 280),
    ],
    duvidaEspecifica: {
      pergunta: 'Cobro por m² ou por percentual da obra?',
      resposta:
        'Por m² para residencial, porque o cliente entende na hora. Percentual sobre o custo da obra só funciona em projetos grandes e exige orçamento de obra fechado antes.',
    },
    condicoesPagamento: '30% na assinatura, 40% na entrega do anteprojeto e 30% no executivo.',
    garantiaMeses: 0,
    prazoDias: 45,
  },
  {
    slug: 'engenheiro-civil',
    nome: 'Engenheiro civil',
    categoria: 'Projeto e engenharia',
    intro:
      'Laudo e ART têm valor de mercado próprio e prazo legal. Trate cada documento como item com preço fechado — misturar tudo em "serviços de engenharia" derruba a percepção de valor.',
    servicos: [
      s('Laudo técnico estrutural com ART', 'un', 1800),
      s('Projeto estrutural residencial', 'm²', 65),
      s('Vistoria cautelar de vizinhança', 'un', 950),
      s('Gerenciamento de obra mensal', 'un', 3500),
      s('Emissão de ART', 'un', 250),
    ],
    duvidaEspecifica: {
      pergunta: 'A ART pode ser cobrada à parte?',
      resposta:
        'Sim, e deve. A taxa do CREA é custo de terceiro; deixe como item destacado para o cliente não achar que é margem sua.',
    },
    condicoesPagamento: '50% na contratação e 50% na entrega do laudo.',
    garantiaMeses: 0,
    prazoDias: 20,
  },
  {
    slug: 'designer-de-interiores',
    nome: 'Designer de interiores',
    categoria: 'Projeto e engenharia',
    intro:
      'Ambiente por ambiente vende melhor que projeto inteiro. Um orçamento com sala, quarto e cozinha separados deixa o cliente começar pequeno — e voltar.',
    servicos: [
      s('Projeto de ambiente único com 3D', 'un', 2200),
      s('Consultoria de decoração presencial', 'h', 250),
      s('Prancha de acabamentos e materiais', 'un', 800),
      s('Lista de compras com fornecedores', 'un', 450),
      s('Acompanhamento de execução por visita', 'un', 380),
    ],
    duvidaEspecifica: {
      pergunta: 'Devo incluir o 3D no valor do projeto?',
      resposta:
        'Inclua uma versão e cobre revisões adicionais como item. Sem esse limite escrito, o cliente pede a décima alteração achando que é cortesia.',
    },
    condicoesPagamento: '50% na contratação e 50% na entrega.',
    garantiaMeses: 0,
    prazoDias: 25,
  },
  {
    slug: 'mestre-de-obras',
    nome: 'Mestre de obras',
    categoria: 'Construção e reforma',
    intro:
      'Administração de obra se cobra por diária ou por percentual. Coloque as duas opções no orçamento e deixe o cliente escolher — quem escolhe compra.',
    servicos: [
      s('Administração de obra por diária', 'dia', 320),
      s('Planejamento e cronograma físico', 'un', 1200),
      s('Medição e conferência de serviços', 'un', 450),
      s('Cotação e compra de materiais', 'un', 600),
      s('Visita técnica de avaliação', 'un', 250),
    ],
    duvidaEspecifica: {
      pergunta: 'Percentual sobre a obra é seguro?',
      resposta:
        'Só com custo estimado registrado no orçamento. Sem base escrita, qualquer aumento de escopo vira discussão sobre a sua remuneração.',
    },
    condicoesPagamento: 'Medição quinzenal conforme cronograma.',
    garantiaMeses: 0,
    prazoDias: 30,
  },
  {
    slug: 'energia-solar',
    nome: 'Instalador de energia solar',
    categoria: 'Instalações',
    intro:
      'Solar é venda consultiva: o cliente compara payback, não preço. Coloque a economia mensal estimada nas observações do orçamento e o fechamento muda de patamar.',
    servicos: [
      s('Sistema fotovoltaico on-grid instalado', 'un', 18500),
      s('Projeto e homologação na concessionária', 'un', 1800),
      s('Estrutura de fixação em telhado metálico', 'un', 2200),
      s('Limpeza e manutenção anual de módulos', 'un', 650),
      s('Estudo de viabilidade com simulação', 'un', 450),
    ],
    duvidaEspecifica: {
      pergunta: 'Como apresentar o retorno do investimento?',
      resposta:
        'Escreva a conta simples: valor do sistema dividido pela economia mensal estimada. Um payback de 48 meses no papel vende mais que qualquer desconto.',
    },
    condicoesPagamento: '40% na assinatura, 40% na entrega dos equipamentos e 20% na energização.',
    garantiaMeses: 60,
    prazoDias: 45,
  },
  {
    slug: 'tecnico-de-informatica',
    nome: 'Técnico de informática',
    categoria: 'Tecnologia',
    intro:
      'Suporte de TI se orça por escopo e por SLA, não por "consertar o computador". Diga o tempo de resposta prometido — é isso que empresa compra.',
    servicos: [
      s('Formatação com backup e reinstalação', 'un', 180),
      s('Limpeza física e troca de pasta térmica', 'un', 120),
      s('Upgrade de SSD com clonagem do sistema', 'un', 220),
      s('Suporte remoto por hora', 'h', 90),
      s('Contrato de suporte mensal para empresa', 'un', 850),
    ],
    duvidaEspecifica: {
      pergunta: 'Como cobrar recuperação de dados?',
      resposta:
        'Cobre a tentativa de diagnóstico e deixe a recuperação como valor condicional ao resultado. Prometer recuperação fechada em disco danificado é assumir prejuízo.',
    },
    condicoesPagamento: 'Pagamento na entrega do equipamento.',
    garantiaMeses: 3,
    prazoDias: 3,
  },
  {
    slug: 'desenvolvedor-web',
    nome: 'Desenvolvedor web',
    categoria: 'Tecnologia',
    intro:
      'Proposta de software morre no escopo aberto. Liste entregáveis, número de revisões e o que explicitamente não está incluso — a seção "não incluso" é a que salva o projeto.',
    servicos: [
      s('Landing page responsiva com formulário', 'un', 2800),
      s('Site institucional até 6 páginas', 'un', 5500),
      s('Loja virtual com meio de pagamento', 'un', 9800),
      s('Manutenção e hospedagem mensal', 'un', 450),
      s('Hora de desenvolvimento adicional', 'h', 180),
    ],
    duvidaEspecifica: {
      pergunta: 'Quantas revisões incluir na proposta?',
      resposta:
        'Duas rodadas, escritas. A partir da terceira, cobre por hora. Sem esse limite a margem do projeto some em ajustes de cor de botão.',
    },
    condicoesPagamento: '50% na assinatura e 50% na entrega, antes da publicação.',
    garantiaMeses: 3,
    prazoDias: 30,
  },
  {
    slug: 'designer-grafico',
    nome: 'Designer gráfico',
    categoria: 'Criativo',
    intro:
      'Cobrar por arte é cobrar barato. Cobre por pacote com uso definido — quem compra identidade visual está comprando direito de uso, e isso tem preço.',
    servicos: [
      s('Identidade visual completa com manual', 'un', 3500),
      s('Logotipo com três propostas', 'un', 1500),
      s('Pacote de 12 artes para redes sociais', 'un', 900),
      s('Diagramação de catálogo', 'un', 45),
      s('Hora de ajuste em arte existente', 'h', 120),
    ],
    duvidaEspecifica: {
      pergunta: 'Entrego os arquivos abertos?',
      resposta:
        'Só se estiver orçado. Arquivo editável é cessão de trabalho, não entrega padrão — coloque como item opcional com valor próprio.',
    },
    condicoesPagamento: '50% na aprovação da proposta e 50% na entrega dos arquivos finais.',
    garantiaMeses: 0,
    prazoDias: 15,
  },
  {
    slug: 'social-media',
    nome: 'Social media',
    categoria: 'Criativo',
    intro:
      'Contrato de social media precisa dizer quantidade e formato. "Gestão de redes" sem número de posts é convite para trabalho ilimitado por preço fixo.',
    servicos: [
      s('Gestão mensal com 12 posts e 20 stories', 'un', 1800),
      s('Planejamento de conteúdo mensal', 'un', 700),
      s('Gravação e edição de reels', 'un', 250),
      s('Gestão de tráfego pago (fee)', 'un', 1200),
      s('Relatório mensal de resultados', 'un', 350),
    ],
    duvidaEspecifica: {
      pergunta: 'A verba de anúncio entra no meu preço?',
      resposta:
        'Nunca. Deixe "verba de mídia por conta do cliente" escrito no orçamento e cobre apenas seu fee de gestão. Misturar os dois destrói a comparação de preço.',
    },
    condicoesPagamento: 'Mensal, todo dia 10, com contrato mínimo de 3 meses.',
    garantiaMeses: 0,
    prazoDias: 5,
  },
  {
    slug: 'fotografo',
    nome: 'Fotógrafo',
    categoria: 'Criativo',
    intro:
      'Fotografia se vende por pacote: horas de cobertura, número de fotos tratadas e prazo de entrega. Os três juntos no orçamento acabam com a negociação por "mais umas fotinhas".',
    servicos: [
      s('Ensaio fotográfico de 2 horas', 'un', 850),
      s('Cobertura de evento por hora', 'h', 350),
      s('Tratamento avançado por foto', 'un', 45),
      s('Álbum impresso 30x30', 'un', 1200),
      s('Deslocamento fora da cidade', 'un', 300),
    ],
    duvidaEspecifica: {
      pergunta: 'Quantas fotos entregar no pacote?',
      resposta:
        'Defina um número mínimo garantido, não um máximo. "No mínimo 40 fotos tratadas" protege você e soa generoso para o cliente.',
    },
    condicoesPagamento: '30% na reserva da data e 70% até a entrega das fotos.',
    garantiaMeses: 0,
    prazoDias: 20,
  },
  {
    slug: 'videomaker',
    nome: 'Videomaker',
    categoria: 'Criativo',
    intro:
      'Vídeo tem custo escondido na edição, não na gravação. Cobre diária de captação e edição separadas para o cliente entender por que dois dias de filmagem viram três semanas de entrega.',
    servicos: [
      s('Diária de captação com equipamento', 'dia', 1800),
      s('Edição de vídeo institucional até 3 min', 'un', 2200),
      s('Pacote de 8 vídeos curtos para redes', 'un', 2800),
      s('Locução profissional', 'un', 450),
      s('Motion graphics e vinheta', 'un', 900),
    ],
    duvidaEspecifica: {
      pergunta: 'Quantas alterações incluir na edição?',
      resposta:
        'Duas rodadas de ajuste, com prazo de resposta do cliente definido. Sem prazo, o projeto fica aberto meses e trava sua agenda.',
    },
    condicoesPagamento: '50% na aprovação e 50% na entrega dos arquivos finais.',
    garantiaMeses: 0,
    prazoDias: 21,
  },
  {
    slug: 'dj',
    nome: 'DJ',
    categoria: 'Eventos',
    intro:
      'Orçamento de DJ precisa dizer horas de pista, equipamento incluso e hora extra. Festa que passa do horário sem valor combinado é prejuízo garantido.',
    servicos: [
      s('DJ com som e iluminação, 5 horas', 'un', 2200),
      s('Hora extra de evento', 'h', 350),
      s('Estrutura de som para 200 pessoas', 'un', 1500),
      s('Iluminação cênica e máquina de fumaça', 'un', 800),
      s('Deslocamento e montagem', 'un', 400),
    ],
    duvidaEspecifica: {
      pergunta: 'Como garantir a data no orçamento?',
      resposta:
        'Escreva que a data só é reservada após o sinal. Sem isso, você segura agenda de graça e perde outro evento no mesmo dia.',
    },
    condicoesPagamento: '30% na reserva da data e 70% até o dia do evento.',
    garantiaMeses: 0,
    prazoDias: 1,
  },
  {
    slug: 'buffet',
    nome: 'Buffet',
    categoria: 'Eventos',
    intro:
      'Buffet se orça por pessoa, com número mínimo garantido. Deixe claro o prazo para confirmar o número final — comida comprada não volta para o fornecedor.',
    servicos: [
      s('Buffet completo por convidado', 'un', 145),
      s('Serviço de garçom por profissional', 'un', 280),
      s('Coquetel de recepção por convidado', 'un', 55),
      s('Bar com bebidas por convidado', 'un', 75),
      s('Louças, mesas e estrutura', 'un', 1800),
    ],
    duvidaEspecifica: {
      pergunta: 'Como tratar convidados que não aparecem?',
      resposta:
        'Cobre pelo número confirmado, não pelo presente, e fixe a confirmação em até 7 dias antes. Isso precisa estar no orçamento, não só na conversa.',
    },
    condicoesPagamento: '30% na reserva, 40% em 30 dias e 30% na véspera do evento.',
    garantiaMeses: 0,
    prazoDias: 30,
  },
  {
    slug: 'confeiteiro',
    nome: 'Confeiteiro',
    categoria: 'Eventos',
    intro:
      'Confeitaria vive de margem apertada por ingrediente caro. Registre o custo de cada item no orçamento — é a única forma de descobrir que o bolo mais pedido é o menos lucrativo.',
    servicos: [
      s('Bolo decorado por quilo', 'kg', 130),
      s('Cento de docinhos finos', 'un', 220),
      s('Mesa de doces completa', 'un', 1500),
      s('Topo de bolo personalizado', 'un', 180),
      s('Entrega e montagem no local', 'un', 150),
    ],
    duvidaEspecifica: {
      pergunta: 'Como precificar bolo sem ter prejuízo?',
      resposta:
        'Lance o custo real de ingredientes por item e olhe a margem que o orçamento calcula. Confeiteiro que não mede custo trabalha de graça no fim de semana.',
    },
    condicoesPagamento: '50% na encomenda e 50% na entrega.',
    garantiaMeses: 0,
    prazoDias: 10,
  },
  {
    slug: 'personal-trainer',
    nome: 'Personal trainer',
    categoria: 'Saúde e bem-estar',
    intro:
      'Aula avulsa é armadilha. Monte o orçamento com pacotes mensais e trimestrais lado a lado — a diferença visível de preço por aula faz o cliente escolher o plano longo.',
    servicos: [
      s('Pacote mensal, 3 aulas por semana', 'un', 720),
      s('Aula avulsa presencial', 'un', 90),
      s('Avaliação física completa', 'un', 180),
      s('Programa de treino online mensal', 'un', 250),
      s('Acompanhamento em domicílio', 'h', 130),
    ],
    duvidaEspecifica: {
      pergunta: 'Como lidar com falta do aluno?',
      resposta:
        'Escreva a política de remarcação com 12 horas de antecedência no orçamento. Sem regra, metade do seu faturamento vira aula desmarcada em cima da hora.',
    },
    condicoesPagamento: 'Mensal antecipado, via PIX.',
    garantiaMeses: 0,
    prazoDias: 2,
  },
  {
    slug: 'nutricionista',
    nome: 'Nutricionista',
    categoria: 'Saúde e bem-estar',
    intro:
      'Consulta isolada rende pouco. Apresente o acompanhamento trimestral como item principal e a consulta avulsa como alternativa — a ordem dos itens muda a decisão.',
    servicos: [
      s('Consulta inicial com plano alimentar', 'un', 320),
      s('Retorno de acompanhamento', 'un', 180),
      s('Pacote trimestral com 4 retornos', 'un', 950),
      s('Avaliação de bioimpedância', 'un', 120),
      s('Plano alimentar para atleta', 'un', 480),
    ],
    duvidaEspecifica: {
      pergunta: 'Posso cobrar o plano alimentar separado?',
      resposta:
        'Pode, mas não convém. Junte plano e consulta em um item só e destaque o valor do plano nas observações — o cliente percebe o ganho sem sentir cobrança dupla.',
    },
    condicoesPagamento: 'Pagamento no ato da consulta.',
    garantiaMeses: 0,
    prazoDias: 3,
  },
  {
    slug: 'mecanico',
    nome: 'Mecânico',
    categoria: 'Automotivo',
    intro:
      'Oficina que manda orçamento por escrito cobra mais caro e recebe menos reclamação. Separe peça e mão de obra em linhas distintas e informe a garantia de cada uma.',
    servicos: [
      s('Revisão completa com troca de óleo e filtros', 'un', 480),
      s('Troca de pastilhas e discos de freio', 'un', 650),
      s('Diagnóstico eletrônico com scanner', 'un', 180),
      s('Troca de correia dentada', 'un', 950),
      s('Hora de mão de obra mecânica', 'h', 140),
    ],
    duvidaEspecifica: {
      pergunta: 'Garantia vale para peça que o cliente trouxe?',
      resposta:
        'Não, e escreva isso. Peça de terceiro tem garantia do vendedor; você garante apenas a mão de obra. Sem essa linha no orçamento, a oficina herda o defeito.',
    },
    condicoesPagamento: 'Pagamento na retirada do veículo.',
    garantiaMeses: 3,
    prazoDias: 3,
  },
  {
    slug: 'funilaria-e-pintura',
    nome: 'Funilaria e pintura',
    categoria: 'Automotivo',
    intro:
      'Pintura automotiva se orça por peça. Diga quais peças entram, se há polimento e se a cor é sólida ou perolizada — perolizada custa bem mais e o cliente precisa ver isso.',
    servicos: [
      s('Pintura de peça em cor sólida', 'un', 480),
      s('Pintura de peça em cor perolizada', 'un', 720),
      s('Reparo de amassado sem pintura', 'un', 350),
      s('Polimento técnico e cristalização', 'un', 650),
      s('Alinhamento de estrutura', 'un', 1200),
    ],
    duvidaEspecifica: {
      pergunta: 'Como orçar sem abrir o veículo?',
      resposta:
        'Emita orçamento preliminar com foto e deixe escrito que danos internos identificados na desmontagem geram aditivo aprovado antes da execução.',
    },
    condicoesPagamento: '50% na entrada do veículo e 50% na retirada.',
    garantiaMeses: 6,
    prazoDias: 10,
  },
  {
    slug: 'lava-jato',
    nome: 'Lava-jato e estética automotiva',
    categoria: 'Automotivo',
    intro:
      'Lavagem simples tem margem baixa; estética tem margem alta. Coloque a vitrificação e a higienização interna no topo do orçamento — o cliente compra o que vê primeiro.',
    servicos: [
      s('Lavagem completa externa e interna', 'un', 80),
      s('Higienização interna com extratora', 'un', 280),
      s('Polimento e vitrificação de pintura', 'un', 950),
      s('Hidratação de bancos de couro', 'un', 320),
      s('Plano mensal com 4 lavagens', 'un', 260),
    ],
    duvidaEspecifica: {
      pergunta: 'Vale oferecer plano mensal?',
      resposta:
        'Vale, e é o item mais lucrativo do setor: o cliente do plano usa menos lavagens do que paga e ainda leva serviço de estética por impulso.',
    },
    condicoesPagamento: 'Pagamento na retirada do veículo.',
    garantiaMeses: 1,
    prazoDias: 1,
  },
  {
    slug: 'insulfilm',
    nome: 'Instalador de insulfilm',
    categoria: 'Automotivo',
    intro:
      'Película se orça por veículo e por tipo de filme. Informe a marca, a garantia e o percentual de transmissão — sem isso o cliente compara você com película de camelô.',
    servicos: [
      s('Aplicação de película em veículo completo', 'un', 450),
      s('Película de segurança antivandalismo', 'un', 1200),
      s('Aplicação em vidro residencial', 'm²', 180),
      s('Remoção de película antiga', 'un', 200),
      s('Película para parabrisa com proteção UV', 'un', 380),
    ],
    duvidaEspecifica: {
      pergunta: 'Preciso citar a legislação no orçamento?',
      resposta:
        'Sim. Registre o percentual de transmissão luminosa aplicado e a conformidade com a resolução do Contran — protege você de multa atribuída ao serviço.',
    },
    condicoesPagamento: 'Pagamento na conclusão do serviço.',
    garantiaMeses: 24,
    prazoDias: 2,
  },
  {
    slug: 'chaveiro',
    nome: 'Chaveiro',
    categoria: 'Serviços gerais',
    intro:
      'Chaveiro trabalha em emergência, e emergência exige orçamento imediato. Tenha a tabela salva e mande o link antes de sair — cliente trancado do lado de fora aprova em segundos.',
    servicos: [
      s('Abertura de porta residencial', 'un', 180),
      s('Troca de segredo de fechadura', 'un', 150),
      s('Cópia de chave codificada automotiva', 'un', 350),
      s('Instalação de fechadura digital', 'un', 480),
      s('Atendimento noturno de emergência', 'un', 280),
    ],
    duvidaEspecifica: {
      pergunta: 'Como cobrar deslocamento em emergência?',
      resposta:
        'Coloque a taxa de deslocamento como item fixo e visível. Cliente aceita pagar a vinda; o que ele não aceita é descobrir a taxa depois do serviço feito.',
    },
    condicoesPagamento: 'Pagamento na conclusão do serviço.',
    garantiaMeses: 3,
    prazoDias: 1,
  },
  {
    slug: 'mudancas-e-fretes',
    nome: 'Mudanças e fretes',
    categoria: 'Serviços gerais',
    intro:
      'Frete se orça por volume, distância e andar. Prédio sem elevador muda completamente o custo — precisa ser item, não surpresa no dia.',
    servicos: [
      s('Mudança residencial até 40 km', 'un', 1200),
      s('Ajudante adicional por diária', 'dia', 200),
      s('Embalagem de móveis e eletrodomésticos', 'un', 350),
      s('Içamento por janela', 'un', 800),
      s('Quilômetro adicional rodado', 'un', 4),
    ],
    duvidaEspecifica: {
      pergunta: 'Como cobrar prédio sem elevador?',
      resposta:
        'Cobre por andar, como item separado. Subir três lances com geladeira é mais trabalho do que dirigir 40 km — o orçamento tem que refletir isso.',
    },
    condicoesPagamento: '30% na reserva da data e 70% na conclusão.',
    garantiaMeses: 0,
    prazoDias: 3,
  },
  {
    slug: 'montagem-instalacao-glp',
    nome: 'Montagem e instalação de GLP',
    categoria: 'Instalações',
    intro:
      'Orçamento para montagem e instalação de rede de gás GLP exige especificação das normas técnicas (NBR 13523 / NBR 15526), teste de estanqueidade e laudo técnico. Detalhar tubulações, reguladores e central de gás garante a segurança e justifica a precificação justa do serviço.',
    servicos: [
      s('Instalação de central de gás GLP (P20/P45)', 'un', 480),
      s('Passagem de tubulação de cobre/multicamada para GLP', 'm', 45),
      s('Teste de estanqueidade com laudo técnico', 'un', 350),
      s('Instalação de regulador de pressão e manômetro', 'un', 180),
      s('Conversão de fogão ou cooktop para GLP', 'un', 150),
    ],
    duvidaEspecifica: {
      pergunta: 'É necessário emitir laudo de estanqueidade na instalação de GLP?',
      resposta:
        'Sim. A realização do teste de estanqueidade com emissão de laudo técnico ou ART garante a conformidade com as normas de segurança do Corpo de Bombeiros e traz total segurança para você e seu cliente.',
    },
    condicoesPagamento: '50% na aprovação e 50% na conclusão e entrega do laudo.',
    garantiaMeses: 12,
    prazoDias: 3,
  },
];

const POR_SLUG = new Map(PROFISSOES.map((p) => [p.slug, p]));

export function acharProfissao(slug: string): Profissao | undefined {
  return POR_SLUG.get(slug);
}

/** Perguntas iguais para todas as páginas, montadas com o nome da profissão. */
export function duvidasComuns(profissao: Profissao): Duvida[] {
  return [
    {
      pergunta: `Quanto tempo um orçamento de ${profissao.nome.toLowerCase()} deve valer?`,
      resposta:
        'Entre 7 e 15 dias. Prazo curto cria urgência e protege você de variação de preço de material. No Orça no ZAP, a data de validade aparece direto na proposta.',
    },
    {
      pergunta: 'Preciso ter CNPJ para enviar orçamento?',
      resposta:
        'Não. Autônomo pode orçar com CPF normalmente. Ter CNPJ (MEI, por exemplo) ajuda a emitir nota fiscal e a atender empresas, mas não é exigência para a proposta.',
    },
    {
      pergunta: 'O que não pode faltar em um orçamento profissional?',
      resposta:
        'Seus dados, os dados do cliente, os itens detalhados com quantidade e valor unitário, o total, o prazo de execução, a validade e as condições de pagamento. Faltando qualquer um deles, sobra espaço para discussão.',
    },
  ];
}
