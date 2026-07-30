import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { codificarProposta } from './lib/share';
import { empresaVazia, propostaVazia } from './lib/factory';

function irPara(hash: string) {
  globalThis.location.hash = hash;
}

beforeEach(() => {
  localStorage.clear();
  irPara('');
});

afterEach(cleanup);

describe('fluxo do prestador', () => {
  it('cria um orçamento a partir do modelo e calcula o total', async () => {
    const usuario = userEvent.setup();
    render(<App />);

    await usuario.selectOptions(screen.getByRole('combobox'), 'eletricista');
    await usuario.click(screen.getByRole('button', { name: /criar orçamento/i }));

    const titulo = await screen.findByLabelText(/título do orçamento/i);
    await usuario.type(titulo, 'Quadro elétrico');

    // Atalho do catálogo da profissão escolhida.
    await usuario.click(screen.getByRole('button', { name: /\+ Instalação de ponto de tomada/i }));

    const valorUnitario = screen.getByLabelText('Valor unitário');
    await usuario.clear(valorUnitario);
    await usuario.type(valorUnitario, '150,00');
    await usuario.tab();

    const quantidade = screen.getByLabelText('Quantidade');
    await usuario.clear(quantidade);
    await usuario.type(quantidade, '4');
    await usuario.tab();

    await waitFor(() => {
      expect(screen.getByText('Total ao cliente').closest('div')).toHaveTextContent('R$ 600,00');
    });
  });

  it('avisa quando o custo declarado passa do preço de venda', async () => {
    const usuario = userEvent.setup();
    render(<App />);

    await usuario.click(screen.getByRole('button', { name: /criar orçamento/i }));
    await screen.findByLabelText(/título do orçamento/i);

    await usuario.click(screen.getByRole('button', { name: '+ Item' }));

    const venda = screen.getByLabelText('Valor unitário');
    await usuario.clear(venda);
    await usuario.type(venda, '100,00');
    await usuario.tab();

    const custo = screen.getByLabelText('Custo unitário');
    await usuario.clear(custo);
    await usuario.type(custo, '150,00');
    await usuario.tab();

    expect(await screen.findByText(/esse serviço dá prejuízo/i)).toBeInTheDocument();
  });

  it('bloqueia a criação depois do limite gratuito do mês', async () => {
    const usuario = userEvent.setup();
    render(<App />);

    for (let i = 0; i < 5; i += 1) {
      await usuario.click(screen.getByRole('button', { name: /criar orçamento/i }));
      await screen.findByLabelText(/título do orçamento/i);
      await usuario.click(screen.getByRole('button', { name: /← Painel/ }));
    }

    expect(await screen.findByText(/usou os 5 orçamentos gratuitos/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /criar orçamento/i })).toBeDisabled();
  });

  it('persiste o orçamento entre montagens do app', async () => {
    const usuario = userEvent.setup();
    const { unmount } = render(<App />);

    await usuario.click(screen.getByRole('button', { name: /criar orçamento/i }));
    const titulo = await screen.findByLabelText(/título do orçamento/i);
    await usuario.type(titulo, 'Serviço persistido');

    unmount();
    irPara('');
    render(<App />);

    expect(await screen.findByText('Serviço persistido')).toBeInTheDocument();
  });
});

describe('visão pública do link', () => {
  it('renderiza o orçamento recebido sem tocar no armazenamento local', async () => {
    const proposta = {
      ...propostaVazia(9, 'pintor'),
      titulo: 'Pintura de sala',
      itens: [
        {
          id: 'a',
          descricao: 'Pintura látex duas demãos',
          quantidadeMil: 20_000,
          unidade: 'm²' as const,
          valorUnitCentavos: 2800,
          custoUnitCentavos: 0,
        },
      ],
    };
    proposta.cliente.nome = 'Maria';

    const token = await codificarProposta({
      v: 1,
      empresa: { ...empresaVazia(), nome: 'Pinturas Souza' },
      proposta,
    });

    irPara(`#/ver/${token}`);
    render(<App />);

    expect(await screen.findByText('Pintura de sala')).toBeInTheDocument();

    const documento = screen.getByRole('article');
    expect(within(documento).getByRole('heading', { level: 1 })).toHaveTextContent('Pinturas Souza');
    expect(within(documento).getAllByText('Maria').length).toBeGreaterThan(0);
    // 20 m² × R$ 28,00 aparece como subtotal e como total (não há desconto).
    expect(within(documento).getAllByText('R$ 560,00')).toHaveLength(2);

    expect(localStorage.getItem('pz.propostas.v1')).toBeNull();
  });

  it('mostra recado amigável quando o link está corrompido', async () => {
    irPara('#/ver/cAAAAAAAAAAAAAA');
    render(<App />);

    expect(await screen.findByText(/não foi possível abrir este orçamento/i)).toBeInTheDocument();
  });

  it('não executa conteúdo hostil que venha no link', async () => {
    const proposta = propostaVazia(1);
    proposta.titulo = '<img src=x onerror="globalThis.__invadido=1">';
    proposta.cliente.nome = '<script>globalThis.__invadido=1</script>';

    const token = await codificarProposta({
      v: 1,
      empresa: { ...empresaVazia(), nome: 'X' },
      proposta,
    });

    irPara(`#/ver/${token}`);
    render(<App />);

    await screen.findByRole('article');
    // O texto aparece literalmente, como texto — não como HTML.
    expect(screen.getByText('<img src=x onerror="globalThis.__invadido=1">')).toBeInTheDocument();
    expect(document.querySelector('img[src="x"]')).toBeNull();
    expect((globalThis as Record<string, unknown>).__invadido).toBeUndefined();
  });
});
