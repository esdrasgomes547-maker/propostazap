/**
 * Saneamento de entrada não confiável.
 *
 * Todo dado que chega de um link público (`#/p/<token>`) ou de um import de
 * backup passa por aqui antes de virar estado do app. O React já escapa texto,
 * então o risco real está em atributos que executam código: href, src e style.
 */

export const COR_PADRAO = '#0f9d58';

/**
 * Controle C0/C1, espaços de largura zero, separadores de linha e overrides
 * bidi — tudo que é invisível e pode disfarçar conteúdo.
 *
 * O que NÃO entra aqui: aparar e colapsar espaço em branco. Isso é
 * normalização, não segurança, e roda no mesmo caminho em que o usuário está
 * digitando: aparar o espaço final apaga a tecla que ele acabou de apertar.
 */
const INVISIVEIS =
  /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028\u2029\u202a-\u202e\u2060-\u2064\u2066-\u2069\ufeff]/g;

/** Igual ao anterior, mas preservando \n (U+000A). */
const INVISIVEIS_MULTILINHA =
  /[\u0000-\u0009\u000b-\u001f\u007f-\u009f\u200b-\u200f\u2028\u2029\u202a-\u202e\u2060-\u2064\u2066-\u2069\ufeff]/g;

const ESQUEMAS_PERMITIDOS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

const IMAGEM_DATA_URL = /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/;

/** ~1 MB de binário depois do base64. Acima disso o localStorage estoura. */
const MAX_LOGO_CARACTERES = 1_400_000;

const HEX_6 = /^#[0-9a-fA-F]{6}$/;

/** Texto de linha única: sem invisíveis (inclusive quebras de linha), recortado. */
export function texto(valor: unknown, maximo: number): string {
  if (typeof valor !== 'string') return '';
  return valor.replace(INVISIVEIS, '').slice(0, maximo);
}

/** Igual a `texto`, mas preserva quebras de linha (observações, condições). */
export function textoMultilinha(valor: unknown, maximo: number): string {
  if (typeof valor !== 'string') return '';
  return valor
    .replace(/\r\n?/g, '\n')
    .replace(INVISIVEIS_MULTILINHA, '')
    .slice(0, maximo);
}

/**
 * Devolve a URL só se o esquema for de navegação. Remove espaços e caracteres
 * de controle antes de olhar o esquema, senão `java\tscript:` passa batido.
 */
export function urlSegura(valor: unknown): string {
  if (typeof valor !== 'string') return '';

  const compacto = valor.replace(/[\s\u0000-\u0020\u007f-\u009f]/g, '');
  if (!compacto) return '';

  try {
    const url = new URL(compacto);
    return ESQUEMAS_PERMITIDOS.has(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

/**
 * Aceita só data URL de imagem rasterizada em base64. SVG fica de fora de
 * propósito: SVG carrega `<script>` e é vetor de XSS mesmo dentro de <img>.
 */
export function dataUrlImagem(valor: unknown): string {
  if (typeof valor !== 'string') return '';
  if (valor.length > MAX_LOGO_CARACTERES) return '';
  return IMAGEM_DATA_URL.test(valor) ? valor : '';
}

/** Só hex de 6 dígitos entra em `style`; qualquer outra coisa vira a cor padrão. */
export function corHex(valor: unknown): string {
  if (typeof valor !== 'string' || !HEX_6.test(valor)) return COR_PADRAO;
  return valor.toLowerCase();
}

/** Dígitos puros, no máximo 15 (E.164). */
export function telefoneDigitos(valor: unknown): string {
  if (typeof valor !== 'string') return '';
  return valor.replace(/\D/g, '').slice(0, 15);
}

/** Inteiro dentro do intervalo; qualquer coisa inválida cai no mínimo. */
export function inteiroEntre(valor: unknown, minimo: number, maximo: number): number {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return minimo;
  return Math.min(Math.max(Math.trunc(valor), minimo), maximo);
}

/** Valor pertence à lista? Senão devolve o padrão. */
export function umDentre<T extends string>(valor: unknown, permitidos: readonly T[], padrao: T): T {
  return permitidos.includes(valor as T) ? (valor as T) : padrao;
}

/** Data ISO válida; senão, agora. */
export function dataIso(valor: unknown): string {
  if (typeof valor === 'string') {
    const t = Date.parse(valor);
    if (Number.isFinite(t)) return new Date(t).toISOString();
  }
  return new Date().toISOString();
}
