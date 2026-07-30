// RF-G02 §7 RN-09. Locale en un único módulo, y quemado a propósito (decisión 12 de la serie): el API
// no tiene concepto de divisa ni de zona horaria por tenant, así que hacerlo configurable aquí sería
// prometer algo que el backend no puede cumplir.

export const LOCALE = 'es-CO';
export const CURRENCY = 'COP';

/** Zona de negocio. Todas las fechas de reserva se calculan en ella, no en la del visitante. */
export const BUSINESS_TIME_ZONE = 'America/Bogota';

/** Pesos colombianos sin decimales, como en `pz-personalizado`. */
export function formatCOP(value: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * "Hoy" en hora de negocio, como `yyyy-MM-dd`.
 *
 * `new Date()` daría el día del visitante: alguien en Madrid a la 1 de la mañana vería mañana, y la
 * ventana de reserva arrancaría en un día que el backend rechaza. El truco del locale `en-CA` es que
 * su formato numérico corto ya es `yyyy-MM-dd`, así que no hay que recomponer nada.
 */
export function todayInBusinessZone(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/**
 * Suma días a una fecha `yyyy-MM-dd` sin salir de ese formato.
 *
 * Se construye a mediodía UTC a propósito: con `T00:00:00Z` cualquier desplazamiento negativo de zona
 * al formatear devolvería el día anterior.
 */
export function addDays(isoDate: string, days: number): string {
  const base = new Date(`${isoDate}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

/** Etiquetas cortas de un día para la tira del wizard: `{ weekday: "mié", day: "13", month: "ago" }`. */
export function dayLabels(isoDate: string): { weekday: string; day: string; month: string } {
  const date = new Date(`${isoDate}T12:00:00Z`);
  const format = (options: Intl.DateTimeFormatOptions): string =>
    new Intl.DateTimeFormat(LOCALE, { timeZone: 'UTC', ...options }).format(date);

  return {
    weekday: format({ weekday: 'short' }).replace('.', ''),
    day: format({ day: 'numeric' }),
    month: format({ month: 'short' }).replace('.', ''),
  };
}

/** Fecha larga en español para el resumen de la reserva: "miércoles, 13 de agosto de 2026". */
export function formatLongDate(isoDate: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${isoDate}T12:00:00Z`));
}

/**
 * `"HH:mm:ss"` del backend (serialización de `TimeOnly`) → `"HH:mm"` para mostrar.
 * Acepta ya recortado, por si el valor viene de un formulario.
 */
export function toTimeLabel(value: string): string {
  return value.slice(0, 5);
}
