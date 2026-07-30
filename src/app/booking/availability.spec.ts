import type { AvailabilityResponse } from '../data/public-api.models';
import { BOOKING_WINDOW_DAYS, bookingWindow, flattenSlots, slotsState } from './availability';

function response(periods: AvailabilityResponse['periods']): AvailabilityResponse {
  return { date: '2026-08-13', periods };
}

describe('flattenSlots', () => {
  it('concatena los tres períodos en orden Mañana → Tarde → Noche', () => {
    // El backend devuelve los tres siempre; el orden del array no está garantizado, así que se impone.
    const slots = flattenSlots(
      response([
        { period: 'Evening', slots: [{ startTime: '19:00:00', available: true }] },
        { period: 'Morning', slots: [{ startTime: '09:00:00', available: true }] },
        { period: 'Afternoon', slots: [{ startTime: '14:00:00', available: true }] },
      ]),
    );

    expect(slots.map((slot) => slot.label)).toEqual(['09:00', '14:00', '19:00']);
  });

  it('ordena por hora dentro de cada período', () => {
    const slots = flattenSlots(
      response([
        {
          period: 'Morning',
          slots: [
            { startTime: '10:30:00', available: true },
            { startTime: '09:00:00', available: true },
          ],
        },
      ]),
    );

    expect(slots.map((slot) => slot.label)).toEqual(['09:00', '10:30']);
  });

  it('conserva los ocupados en vez de filtrarlos', () => {
    // Ocultarlos haría que la rejilla cambiara de alto al cambiar de día (RF-G04 §4 RN-01).
    const slots = flattenSlots(
      response([
        {
          period: 'Morning',
          slots: [
            { startTime: '09:00:00', available: false },
            { startTime: '09:30:00', available: true },
          ],
        },
      ]),
    );

    expect(slots).toHaveLength(2);
    expect(slots[0].available).toBe(false);
  });

  it('aguanta períodos vacíos, que son normales y no un error', () => {
    const slots = flattenSlots(
      response([
        { period: 'Morning', slots: [] },
        { period: 'Afternoon', slots: [{ startTime: '14:00:00', available: true }] },
        { period: 'Evening', slots: [] },
      ]),
    );

    expect(slots.map((slot) => slot.label)).toEqual(['14:00']);
  });

  it('conserva startTime completo para mandarlo al backend', () => {
    const slots = flattenSlots(
      response([{ period: 'Morning', slots: [{ startTime: '09:00:00', available: true }] }]),
    );

    expect(slots[0].startTime).toBe('09:00:00');
    expect(slots[0].label).toBe('09:00');
  });
});

describe('slotsState', () => {
  it('distingue las tres causas de una rejilla sin opciones', () => {
    expect(slotsState([])).toBe('no-shift');

    expect(
      slotsState([{ startTime: '09:00:00', label: '09:00', available: false, period: 'Morning' }]),
    ).toBe('full');

    expect(
      slotsState([{ startTime: '09:00:00', label: '09:00', available: true, period: 'Morning' }]),
    ).toBe('ready');
  });
});

describe('bookingWindow', () => {
  it('devuelve 30 días contando hoy', () => {
    const window = bookingWindow('2026-08-13');

    expect(window).toHaveLength(BOOKING_WINDOW_DAYS);
    expect(window[0]).toBe('2026-08-13');
    expect(window[BOOKING_WINDOW_DAYS - 1]).toBe('2026-09-11');
  });

  it('no repite ni salta días al cruzar mes', () => {
    const window = bookingWindow('2026-01-20');

    expect(new Set(window).size).toBe(BOOKING_WINDOW_DAYS);
    expect(window).toContain('2026-02-01');
  });
});
