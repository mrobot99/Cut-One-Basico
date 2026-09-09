import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

// RF-G01 §5. Un tema de este producto NO es un rediseño: es una paleta. Tres campos y nada más
// (decisión 2 de la serie 008), porque esa es la forma que se va a serializar el día que el tema
// venga del API — tres columnas o un JSON de tres campos, no una hoja de estilos por tenant.

/**
 * Paletas primitivas disponibles como acento o superficie. Todas menos `gold` son las que Aura trae
 * de fábrica; `gold` es el dorado de marca de Cut One (el mismo `#c9a24b` del "One" del splash), una
 * rampa propia que `buildPreset` inyecta como valores literales en el acento. Se
 * listan a mano para que `PaletteName` sea un tipo cerrado: una paleta mal escrita en un descriptor
 * tiene que romper el build, no resolverse a `undefined` y pintar tokens vacíos.
 */
export const PALETTES = [
  'emerald',
  'green',
  'lime',
  'red',
  'orange',
  'amber',
  'yellow',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
  'gold',
] as const;

export type PaletteName = (typeof PALETTES)[number];

/** La forma completa de un tema. Ver RF-G01 §5. */
export interface ThemeDescriptor {
  /** Paleta del color de acento: botones, links, estrellas, foco. */
  readonly primary: PaletteName;
  /** Paleta de fondos, bordes y texto. */
  readonly surface: PaletteName;
  /** Claro u oscuro. Lo decide el tema del tenant, nunca el sistema operativo del visitante (RN-01). */
  readonly colorScheme: 'light' | 'dark';
}

/**
 * Catálogo cerrado de temas. Los nombres son los de RF-F04 (005-rfs-front) a propósito: ese RF sigue
 * en borrador y algún día pondrá este mismo valor en la base de datos. Dos vocabularios de temas en
 * el mismo producto serían una migración de datos innecesaria.
 */
export const THEMES = {
  /** El del mockup: oscuro, monocromo, acento frío. */
  noche: { primary: 'slate', surface: 'zinc', colorScheme: 'dark' },
  /** Barbería tradicional: cálido, dorado de marca (#c9a24b) sobre piedra. */
  clasico: { primary: 'gold', surface: 'stone', colorScheme: 'dark' },
  /** Claro, un solo acento. */
  minimal: { primary: 'emerald', surface: 'slate', colorScheme: 'light' },
} as const satisfies Record<string, ThemeDescriptor>;

export type ThemeKey = keyof typeof THEMES;

/**
 * Clase que activa el esquema oscuro.
 *
 * RN-01: `darkModeSelector` de PrimeNG vale `system` por defecto, que se resuelve a
 * `@media (prefers-color-scheme: dark)`. Dejarlo así haría que el aspecto de la landing dependiera de
 * la preferencia del sistema operativo DEL VISITANTE, y la decisión 2 de 005-rfs-front dice lo
 * contrario: el tema es del tenant. El modo de fallo es traicionero — en el monitor de quien
 * implementa se ve bien y la mitad de los visitantes ven la otra variante — así que el selector
 * apunta a una clase que solo estampa `applyColorScheme()`.
 */
export const DARK_MODE_CLASS = 'cob-dark';

/** Selector que se le pasa a `providePrimeNG`. Ver `DARK_MODE_CLASS`. */
export const DARK_MODE_SELECTOR = `.${DARK_MODE_CLASS}`;

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

/**
 * Rampa del dorado de marca de Cut One. El `400` es `#c9a24b` — el mismo dorado del "One" del splash
 * y el que PZ usa como acento — porque en modo oscuro Aura toma `primary.400` como color principal
 * (y `300`/`200` como hover/active), que es justo el caso del tema `clasico`. El resto de la rampa
 * son gradaciones de ese mismo tono para que superficies claras y estados de texto sigan leyéndose
 * como oro y no como marrón. No viene de Aura: `buildPreset` la inyecta como valores literales en
 * `semantic.primary` cuando el tema pide `gold` (no se puede referenciar como `{gold.N}` porque no es
 * una primitiva registrada de Aura).
 */
const GOLD = {
  50: '#fbf6e9',
  100: '#f6ebc9',
  200: '#ecd79a',
  300: '#dcbd6f',
  400: '#c9a24b',
  500: '#b88f3a',
  600: '#9c7530',
  700: '#7d5c28',
  800: '#654b24',
  900: '#563f21',
  950: '#322310',
} as const satisfies Record<(typeof SHADES)[number], string>;

/**
 * Convierte un nombre de paleta en el mapa de referencias a tokens primitivos que espera el preset
 * (`{ 50: "{amber.50}", … }`).
 */
function paletteTokens(palette: PaletteName): Record<string, string> {
  return Object.fromEntries(SHADES.map((shade) => [shade, `{${palette}.${shade}}`]));
}

/**
 * Construye el preset de PrimeNG correspondiente a un descriptor.
 *
 * Solo se sobreescriben `primary` y `surface` del bloque semántico: el resto de tokens de Aura
 * (`text`, `content`, `formField`, `overlay`, …) están definidos en términos de esos dos con
 * `light-dark()`, así que cambian solos. Es lo que hace que un tema cueste tres líneas y no una hoja
 * de estilos.
 */
export function buildPreset(theme: ThemeDescriptor) {
  return definePreset(Aura, {
    semantic: {
      // `gold` no es una primitiva de Aura, así que no se puede referenciar como `{gold.N}`; en su
      // lugar se dan sus valores literales aquí. El resto de paletas sí existen en Aura y van por
      // referencia. Ambas formas son válidas para `semantic.primary`: los tokens derivados de Aura
      // apuntan a `{primary.N}`, que resuelve igual sea literal o referencia.
      primary: theme.primary === 'gold' ? { ...GOLD } : paletteTokens(theme.primary),
      // `surface.0` es el extremo del que Aura tira para el fondo de contenido en claro y para el
      // color de texto en oscuro; el catálogo de paletas empieza en 50, así que hay que darlo. Es el
      // mismo valor que trae Aura y el único color literal del proyecto (RN-03: literal aquí dentro,
      // en ninguna otra parte).
      surface: { 0: '#ffffff', ...paletteTokens(theme.surface) },
    },
  });
}
