import { addDays, toTimeLabel, todayInBusinessZone } from '../core/locale';
import type { AvailabilityResponse, SlotPeriod } from '../data/public-api.models';

/** Ventana de reserva: hoy más 29 días, es decir 30 contando hoy. La impone el backend (RF-07 RN-01). */
export const BOOKING_WINDOW_DAYS = 30;

/** El orden en que se concatenan los períodos en la rejilla plana (decisión 8 de la serie). */
const PERIOD_ORDER: readonly SlotPeriod[] = ['Morning', 'Afternoon', 'Evening'];

export interface FlatSlot {
  /** `"HH:mm:ss"` tal cual lo devuelve el backend: es lo que se manda al crear la cita. */
  readonly startTime: string;
  /** `"HH:mm"`, que es lo que se muestra. */
  readonly label: string;
  readonly available: boolean;
  readonly period: SlotPeriod;
}

/**
 * Aplana los tres períodos en una sola rejilla ordenada.
 *
 * La respuesta trae los tres **siempre**, aunque estén vacíos: el backend lo hace a propósito para que
 * un frontend pueda pintar pestañas con contadores. Este landing no las pinta, así que los concatena
 * en orden Mañana → Tarde → Noche, sin depender del orden en que lleguen en el array.
 *
 * Los ocupados **no se filtran**: se conservan con `available: false` para pintarlos deshabilitados
 * (RF-G04 §4 RN-01). Ocultarlos haría que la rejilla cambiara de alto al cambiar de día y esconde
 * información que la respuesta ya trae: cuán lleno está ese día.
 */
export function flattenSlots(response: AvailabilityResponse): FlatSlot[] {
  return PERIOD_ORDER.flatMap((period) => {
    const match = response.periods.find((candidate) => candidate.period === period);
    if (!match) {
      return [];
    }

    return [...match.slots]
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map((slot) => ({
        startTime: slot.startTime,
        label: toTimeLabel(slot.startTime),
        available: slot.available,
        period,
      }));
  });
}

/**
 * Los tres estados vacíos del paso 3, que tienen tres causas distintas (RF-G04 §4 RN-03).
 * Colapsarlos en un "no hay horarios" deja al cliente sin saber qué hacer.
 */
export type SlotsState = 'ready' | 'no-shift' | 'full';

export function slotsState(slots: readonly FlatSlot[]): SlotsState {
  if (slots.length === 0) {
    // El barbero no tiene turnos activos ese día, o está ausente.
    return 'no-shift';
  }

  return slots.some((slot) => slot.available) ? 'ready' : 'full';
}

/**
 * Los 30 días seleccionables, arrancando en "hoy en hora de negocio".
 *
 * Arrancar en `new Date()` daría el día del visitante: alguien en otra zona horaria vería un primer día
 * que el backend rechaza con `DATE_OUT_OF_RANGE`.
 */
export function bookingWindow(today: string = todayInBusinessZone()): string[] {
  return Array.from({ length: BOOKING_WINDOW_DAYS }, (_, index) => addDays(today, index));
}
