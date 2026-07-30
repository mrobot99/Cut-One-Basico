import { addDays, formatCOP, toTimeLabel, todayInBusinessZone } from './locale';

describe('formatCOP', () => {
  it('formatea sin decimales', () => {
    expect(formatCOP(45000)).toContain('45.000');
    expect(formatCOP(45000)).not.toContain(',00');
  });
});

describe('todayInBusinessZone', () => {
  it('devuelve yyyy-MM-dd', () => {
    expect(todayInBusinessZone()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('usa la hora de Bogotá y no la del visitante', () => {
    // 2026-08-14T02:30:00Z son las 21:30 del 13 en Bogotá (UTC-5). Un `new Date()` en un navegador
    // configurado en UTC diría 14: es exactamente el error que este helper evita.
    expect(todayInBusinessZone(new Date('2026-08-14T02:30:00Z'))).toBe('2026-08-13');
  });

  it('no se adelanta un día justo antes de medianoche en Bogotá', () => {
    expect(todayInBusinessZone(new Date('2026-08-14T04:59:00Z'))).toBe('2026-08-13');
    expect(todayInBusinessZone(new Date('2026-08-14T05:01:00Z'))).toBe('2026-08-14');
  });
});

describe('addDays', () => {
  it('suma sin salirse del formato', () => {
    expect(addDays('2026-08-13', 0)).toBe('2026-08-13');
    expect(addDays('2026-08-13', 29)).toBe('2026-09-11');
  });

  it('cruza fin de mes y año', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });
});

describe('toTimeLabel', () => {
  it('recorta "HH:mm:ss" a "HH:mm"', () => {
    expect(toTimeLabel('09:30:00')).toBe('09:30');
  });

  it('deja intacto lo que ya viene recortado', () => {
    expect(toTimeLabel('09:30')).toBe('09:30');
  });
});
