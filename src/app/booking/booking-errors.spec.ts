import { ApiError } from '../core/api-error';
import { planForBookingError } from './booking-errors';

function apiError(code: string, message = 'mensaje del servidor', status = 409): ApiError {
  return new ApiError(status, message, code);
}

describe('planForBookingError', () => {
  it('recarga disponibilidad ante un choque de slot', () => {
    // Sin recargar, el cliente vuelve a elegir la misma hora que acaba de fallar (RF-G04 §6).
    for (const code of ['SLOT_TAKEN', 'SLOT_OVERLAP', 'PAST_SLOT', 'SLOT_UNAVAILABLE']) {
      expect(planForBookingError(apiError(code)).reaction).toBe('reload-availability');
    }
  });

  it('vuelve al paso de horario con la fecha fuera de rango', () => {
    const plan = planForBookingError(apiError('DATE_OUT_OF_RANGE', 'x', 400));

    expect(plan.reaction).toBe('back-to-schedule');
    expect(plan.detail).toContain('30 días');
  });

  it('muestra el mensaje del servidor tal cual en los tres límites de frecuencia', () => {
    // Son los únicos que explican CUÁL es el límite; reescribirlos los desincroniza del backend.
    const server = 'Ya tienes 3 citas pendientes con este correo.';

    for (const code of ['RATE_LIMIT_EMAIL', 'RATE_LIMIT_PHONE', 'RATE_LIMIT_HOURLY']) {
      const plan = planForBookingError(apiError(code, server, 429));
      expect(plan.detail).toBe(server);
      expect(plan.reaction).toBe('stay');
    }
  });

  it('reinicia el wizard si el barbero o el servicio ya no existen', () => {
    expect(planForBookingError(apiError('BARBER_NOT_FOUND', 'x', 404)).reaction).toBe('restart');
    expect(planForBookingError(apiError('SERVICE_NOT_FOUND', 'x', 404)).reaction).toBe('restart');
  });

  it('un código desconocido se queda donde está y usa el mensaje del servidor', () => {
    const plan = planForBookingError(apiError('ALGO_NUEVO', 'Error raro', 500));

    expect(plan.reaction).toBe('stay');
    expect(plan.detail).toBe('Error raro');
  });

  it('un fallo que no es del API pide reintentar', () => {
    const plan = planForBookingError(new TypeError('Failed to fetch'));

    expect(plan.reaction).toBe('stay');
    expect(plan.detail).toContain('conexión');
  });

  it('cubre los nueve códigos del contrato', () => {
    const codes = [
      'SLOT_TAKEN',
      'SLOT_OVERLAP',
      'PAST_SLOT',
      'SLOT_UNAVAILABLE',
      'DATE_OUT_OF_RANGE',
      'RATE_LIMIT_EMAIL',
      'RATE_LIMIT_PHONE',
      'RATE_LIMIT_HOURLY',
      'BARBER_NOT_FOUND',
      'SERVICE_NOT_FOUND',
    ];

    for (const code of codes) {
      const plan = planForBookingError(apiError(code));
      expect(plan.summary.length).toBeGreaterThan(0);
      expect(plan.detail.length).toBeGreaterThan(0);
    }
  });
});
