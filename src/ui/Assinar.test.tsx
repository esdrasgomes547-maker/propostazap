import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import type { ResultadoLicenca } from '../lib/license';

/**
 * A verificação criptográfica já tem testes próprios em license.test.ts. Aqui
 * o que importa é a fiação da tela: o que o usuário vê para cada resposta.
 */
const verificarLicenca = vi.hoisted(() => vi.fn<() => Promise<ResultadoLicenca>>());

vi.mock('../lib/license', async (original) => ({
  ...(await original<typeof import('../lib/license')>()),
  verificarLicenca,
}));

const LICENCA_VALIDA: ResultadoLicenca = {
  situacao: 'valida',
  licenca: { nome: 'Elétrica Silva', expiraEm: Date.parse('2027-08-01T00:00:00Z'), id: 'pix-1' },
};

beforeEach(() => {
  localStorage.clear();
  verificarLicenca.mockReset();
  verificarLicenca.mockResolvedValue({ situacao: 'invalida' });
  globalThis.location.hash = '#/assinar';
});

afterEach(cleanup);

async function colarCodigo(usuario: ReturnType<typeof userEvent.setup>, codigo: string) {
  await usuario.type(screen.getByLabelText(/código de ativação/i), codigo);
  await usuario.click(screen.getByRole('button', { name: /ativar pro/i }));
}

describe('tela de assinatura', () => {
  it('mostra os planos com preço', async () => {
    render(<App />);

    expect(await screen.findByText('Pro anual')).toBeInTheDocument();
    expect(screen.getByText('R$ 197,00')).toBeInTheDocument();
    expect(screen.getByText('Pro mensal')).toBeInTheDocument();
    expect(screen.getByText('R$ 29,00')).toBeInTheDocument();
  });

  it('mostra um código PIX válido para o plano escolhido', async () => {
    const usuario = userEvent.setup();
    render(<App />);

    await screen.findByText('Pro anual');
    expect(
      screen.getByRole('button', { name: /copiar código PIX de R\$ 197,00/i }),
    ).toBeInTheDocument();

    // O código carrega o identificador do PIX e o valor do plano selecionado.
    const codigoAnual = screen.getByText(/^0002.*br\.gov\.bcb\.pix/).textContent ?? '';
    expect(codigoAnual).toContain('5406197.00');

    await usuario.click(screen.getByText('Pro mensal'));

    await waitFor(() => {
      expect(screen.getByText(/^0002.*br\.gov\.bcb\.pix/).textContent).toContain('540529.00');
    });
  });

  it('só habilita ativar depois de colar algo', async () => {
    const usuario = userEvent.setup();
    render(<App />);

    const botao = await screen.findByRole('button', { name: /ativar pro/i });
    expect(botao).toBeDisabled();

    await usuario.type(screen.getByLabelText(/código de ativação/i), 'qualquer coisa');
    expect(botao).toBeEnabled();
  });

  it('explica quando o código é inválido, sem liberar nada', async () => {
    const usuario = userEvent.setup();
    render(<App />);
    await screen.findByLabelText(/código de ativação/i);

    await colarCodigo(usuario, 'codigo-falso');

    expect(await screen.findByText(/código inválido/i)).toBeInTheDocument();
    expect(localStorage.getItem('pz.licenca.v1')).toBeNull();
  });

  it('diferencia código vencido de código falso', async () => {
    const usuario = userEvent.setup();
    verificarLicenca.mockResolvedValue({
      situacao: 'vencida',
      licenca: { nome: 'Antigo', expiraEm: 1, id: 'x' },
    });
    render(<App />);
    await screen.findByLabelText(/código de ativação/i);

    await colarCodigo(usuario, 'codigo-vencido');

    expect(await screen.findByText(/já venceu/i)).toBeInTheDocument();
    expect(localStorage.getItem('pz.licenca.v1')).toBeNull();
  });

  it('ativa o Pro e guarda o código quando a assinatura confere', async () => {
    const usuario = userEvent.setup();
    verificarLicenca.mockResolvedValue(LICENCA_VALIDA);
    render(<App />);
    await screen.findByLabelText(/código de ativação/i);

    await colarCodigo(usuario, 'codigo-bom');

    // Redireciona para Configurações, já mostrando a licença ativa.
    expect(await screen.findByText(/pro ativo/i)).toBeInTheDocument();
    expect(screen.getByText(/Elétrica Silva/)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('pz.licenca.v1') ?? '""')).toBe('codigo-bom');
  });
});

describe('cota com o Pro ativo', () => {
  it('deixa de bloquear depois do sexto orçamento', async () => {
    const usuario = userEvent.setup();
    verificarLicenca.mockResolvedValue(LICENCA_VALIDA);
    localStorage.setItem('pz.licenca.v1', JSON.stringify('codigo-bom'));
    globalThis.location.hash = '';

    render(<App />);

    // A liberação só vale depois da verificação assíncrona da assinatura.
    await waitFor(() => expect(verificarLicenca).toHaveBeenCalled());

    for (let i = 0; i < 6; i += 1) {
      await usuario.click(screen.getByRole('button', { name: /criar orçamento/i }));
      await screen.findByLabelText(/título do orçamento/i);
      await usuario.click(screen.getByRole('button', { name: /← Painel/ }));
    }

    expect(screen.queryByText(/orçamentos gratuitos deste mês/i)).toBeNull();
    expect(screen.getByRole('button', { name: /criar orçamento/i })).toBeEnabled();
  });

  it('não libera nada se a licença guardada não passar na verificação', async () => {
    localStorage.setItem('pz.licenca.v1', JSON.stringify('codigo-adulterado'));
    globalThis.location.hash = '/config';

    render(<App />);

    await waitFor(() => expect(verificarLicenca).toHaveBeenCalled());
    expect(await screen.findByRole('button', { name: /assinar o pro/i })).toBeInTheDocument();
    expect(screen.queryByText(/pro ativo/i)).toBeNull();
  });
});
