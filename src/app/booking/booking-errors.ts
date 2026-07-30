import { ApiError } from '../core/api-error';

/**
 * Qué hace el wizard además de mostrar el mensaje.
 *
 * `reload-availability` no es opcional después de un choque de slot: sin ella el cliente vuelve a
 * elegir la misma hora que acaba de fallar, porque la rejilla sigue mostrándola libre.
 */
export type BookingReaction = 'reload-availability' | 'back-to-schedule' | 'restart' | 'stay';

export interface BookingErrorPlan {
  readonly summary: string;
  readonly detail: string;
  readonly reaction: BookingReaction;
}

/**
 * RF-G04 §6 RN-06. Enruta los nueve códigos que el backend puede devolver al crear una cita,
 * replicando el mapeo de `BookingFlow.tsx:165-197`.
 *
 * Los tres límites de frecuencia muestran **el mensaje del servidor tal cual**: son los únicos que
 * explican *cuál* es el límite ("ya tienes 3 citas pendientes", "demasiadas reservas en la última
 * hora"). Sustituirlos por un texto propio los volvería inútiles y los desincronizaría del backend en
 * cuanto alguien cambie el umbral.
 */
export function planForBookingError(error: unknown): BookingErrorPlan {
  if (!(error instanceof ApiError)) {
    return {
      summary: 'No pudimos completar la reserva',
      detail: 'Revisa tu conexión e inténtalo de nuevo.',
      reaction: 'stay',
    };
  }

  switch (error.code) {
    case 'SLOT_TAKEN':
    case 'SLOT_OVERLAP':
      return {
        summary: 'Ese horario acaba de ser reservado',
        detail: 'Elige otra hora: acabamos de actualizar la disponibilidad.',
        reaction: 'reload-availability',
      };

    case 'PAST_SLOT':
      return {
        summary: 'Ese horario ya pasó',
        detail: 'Elige una hora futura.',
        reaction: 'reload-availability',
      };

    case 'SLOT_UNAVAILABLE':
      return {
        summary: 'Ese horario no está disponible',
        detail: 'Elige otra hora de la rejilla.',
        reaction: 'reload-availability',
      };

    case 'DATE_OUT_OF_RANGE':
      return {
        summary: 'Fecha fuera de rango',
        detail: 'Solo se puede reservar en los próximos 30 días.',
        reaction: 'back-to-schedule',
      };

    case 'RATE_LIMIT_EMAIL':
    case 'RATE_LIMIT_PHONE':
    case 'RATE_LIMIT_HOURLY':
      return {
        summary: 'No podemos registrar otra reserva',
        detail: error.message,
        reaction: 'stay',
      };

    case 'BARBER_NOT_FOUND':
    case 'SERVICE_NOT_FOUND':
      return {
        summary: 'La selección ya no está disponible',
        detail: 'El barbero o el servicio cambió. Vuelve a empezar la reserva.',
        reaction: 'restart',
      };

    default:
      return {
        summary: 'No pudimos completar la reserva',
        detail: error.message,
        reaction: 'stay',
      };
  }
}
