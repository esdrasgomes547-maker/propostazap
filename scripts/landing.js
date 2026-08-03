/**
 * Animação da página inicial.
 *
 * Um momento só, na abertura: o orçamento se preenchendo sozinho — que é
 * literalmente o que o produto faz. Efeito espalhado pela página inteira
 * cansa e não diz nada; este diz.
 *
 * O HTML já nasce com o documento pronto. O script tira as peças de cena e
 * traz de volta. Se o JavaScript falhar, a página fica correta — só sem a
 * animação.
 */
import { animate, createTimeline, stagger, utils } from 'animejs';

const semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Conta de 0 até o valor final, formatando em real a cada quadro. */
function contarAteReais(alvo) {
  const centavosFinais = Number(alvo.dataset.centavos);
  if (!Number.isFinite(centavosFinais)) return null;

  const estado = { v: 0 };
  return {
    targets: estado,
    v: centavosFinais,
    duration: 900,
    ease: 'outExpo',
    onUpdate: () => {
      const c = Math.round(estado.v);
      const inteiro = Math.floor(c / 100)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      alvo.textContent = `${inteiro},${String(c % 100).padStart(2, '0')}`;
    },
  };
}

function abrir() {
  const folha = document.querySelector('[data-folha]');
  if (!folha) return;

  const linhas = folha.querySelectorAll('[data-linha]');
  const valores = folha.querySelectorAll('[data-centavos]');
  const total = folha.querySelector('[data-total]');
  const carimbo = folha.querySelector('[data-carimbo]');

  if (semMovimento) {
    // Sem animação, os números precisam sair do zero mesmo assim.
    valores.forEach((v) => {
      const anim = contarAteReais(v);
      if (anim) anim.onUpdate();
    });
    return;
  }

  utils.set(linhas, { opacity: 0, translateY: 8 });
  utils.set(total, { opacity: 0 });
  utils.set(carimbo, { opacity: 0, scale: 0.8, rotate: -8 });

  const linha = createTimeline({ defaults: { ease: 'outQuad' } });

  linha
    .add(folha, { opacity: [0, 1], translateY: [14, 0], duration: 520 })
    .add(
      linhas,
      { opacity: [0, 1], translateY: [8, 0], duration: 380, delay: stagger(90) },
      '-=220',
    );

  // Os valores sobem enquanto as linhas ainda entram: parece cálculo, não enfeite.
  valores.forEach((v, i) => {
    const anim = contarAteReais(v);
    if (anim) linha.add(anim.targets, anim, i === 0 ? '-=260' : '<<');
  });

  linha
    .add(total, { opacity: [0, 1], scale: [0.96, 1], duration: 420 }, '-=120')
    .add(carimbo, { opacity: [0, 1], scale: [0.8, 1], rotate: [-8, -4], duration: 460 }, '-=180');
}

/** Revela as seções conforme entram na tela, uma vez só e sem exagero. */
function revelarSecoes() {
  if (semMovimento) return;

  const alvos = document.querySelectorAll('[data-revela]');
  if (!alvos.length || !('IntersectionObserver' in window)) return;

  utils.set(alvos, { opacity: 0, translateY: 12 });

  const observador = new IntersectionObserver(
    (entradas) => {
      for (const entrada of entradas) {
        if (!entrada.isIntersecting) continue;
        animate(entrada.target, { opacity: [0, 1], translateY: [12, 0], duration: 480, ease: 'outQuad' });
        observador.unobserve(entrada.target);
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  );

  alvos.forEach((a) => observador.observe(a));
}

abrir();
revelarSecoes();
