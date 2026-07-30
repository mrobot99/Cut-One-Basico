// RF-G02 §7 RN-10. La base de datos guarda NOMBRES DE ARCHIVO para las filas semilla que crea el
// aprovisionamiento (`service-fade.webp`), no URLs (decisión 6 de 007-rfs-split-front). Sin este mapa
// —y sin los `.webp` de `public/seed/`, que hay que copiar, no solo referenciar— un tenant recién
// aprovisionado muestra miniaturas rotas y el síntoma no apunta a ninguna parte.
//
// A diferencia de `pz-personalizado`, aquí los archivos no se importan desde TypeScript (Vite lo
// permite, Angular no): viven en `public/seed/` y el bundler los copia tal cual al artefacto.

const SEED_DIRECTORY = '/seed';

const SEED_FILES = [
  'barber-1',
  'barber-2',
  'barber-3',
  'barber-4',
  'barber-5',
  'service-haircut',
  'service-beard',
  'service-vip',
  'service-fade',
  'service-eyebrows',
  'service-wax',
] as const;

// Las filas semilla llegaron a guardar `.jpg` antes de que las imágenes se convirtieran a webp, y esas
// filas siguen en base de datos: las dos extensiones apuntan al mismo archivo.
const SEED_MAP: Record<string, string> = Object.fromEntries(
  SEED_FILES.flatMap((name) => [
    [`${name}.webp`, `${SEED_DIRECTORY}/${name}.webp`],
    [`${name}.jpg`, `${SEED_DIRECTORY}/${name}.webp`],
  ]),
);

/**
 * Resuelve lo que el API devuelve en un campo de imagen a algo que un `<img src>` pueda usar.
 * Devuelve `undefined` cuando no hay imagen, para que quien la pinte decida su propio hueco.
 */
export function resolveImage(key?: string | null): string | undefined {
  if (!key) {
    return undefined;
  }

  if (/^https?:\/\//i.test(key) || key.startsWith('/') || key.startsWith('data:')) {
    return key;
  }

  return SEED_MAP[key] ?? key;
}
