/**
 * Registra o service worker que faz o app abrir sem internet.
 *
 * Quem usa isto trabalha em obra, porão e casa de cliente — lugar de sinal
 * ruim. Os orçamentos já vivem no aparelho; sem o service worker, só a casca
 * do app dependeria da rede, o que é o pior dos dois mundos.
 *
 * Falhar aqui nunca pode quebrar o app: sem service worker ele continua
 * funcionando, só perde o offline.
 */
export function registrarOffline(): void {
  if (!('serviceWorker' in navigator)) return;

  // Em desenvolvimento o service worker atrapalha: serviria build antigo.
  if (import.meta.env.DEV) return;

  const base = import.meta.env.BASE_URL || '/';

  globalThis.addEventListener('load', () => {
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {
      // Modo privado, permissão negada ou origem sem HTTPS. Segue sem offline.
    });
  });
}
