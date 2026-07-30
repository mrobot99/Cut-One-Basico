import { DEFAULTS, mergeBrandingBundle, mergeBrandingSnapshot } from './branding';

describe('DEFAULTS', () => {
  it('no contiene datos de ningún tenant', () => {
    // RF-F02: un tenant nuevo sin CompanySetting debe ver una landing vacía y coherente, no la de otro
    // negocio. Este test es la red que impide que alguien rellene los defaults "para ver algo".
    const textFields = Object.entries(DEFAULTS).filter(([, value]) => typeof value === 'string');

    expect(textFields.length).toBeGreaterThan(0);
    for (const [, value] of textFields) {
      expect(value).toBe('');
    }
    expect(DEFAULTS.about_us_images).toEqual([]);
  });

  it('deja rating_score en 5', () => {
    expect(DEFAULTS.rating_score).toBe(5);
  });
});

describe('mergeBrandingBundle', () => {
  it('aplana branding y hero en un solo objeto', () => {
    const merged = mergeBrandingBundle({
      branding: { shop_name: 'Barbería X', location: 'Armenia' },
      hero: { hero_title: 'Tu mejor corte' },
    });

    expect(merged.shop_name).toBe('Barbería X');
    expect(merged.location).toBe('Armenia');
    expect(merged.hero_title).toBe('Tu mejor corte');
  });

  it('convierte los campos ausentes en cadena vacía, no undefined', () => {
    const merged = mergeBrandingBundle({ branding: { shop_name: 'Barbería X' } });

    expect(merged.slogan).toBe('');
    expect(merged.hero_image_url).toBe('');
    expect(merged.about_us_images).toEqual([]);
  });

  it('lee rating_score del nivel raíz del bundle, no de branding', () => {
    // Vive en Company.RatingScore y lo recalcula un job nocturno: tiparlo dentro de `branding` lo
    // dejaría siempre undefined (RF-G02 §5.1).
    expect(mergeBrandingBundle({ rating_score: 4.6 }).rating_score).toBe(4.6);
  });

  it('cae a 5 cuando el bundle no trae rating_score', () => {
    expect(mergeBrandingBundle({ branding: {} }).rating_score).toBe(5);
  });

  it('devuelve DEFAULTS con un bundle vacío', () => {
    expect(mergeBrandingBundle({})).toEqual(DEFAULTS);
  });
});

describe('mergeBrandingSnapshot', () => {
  it('completa los campos que un snapshot viejo no tenía', () => {
    const merged = mergeBrandingSnapshot({ shop_name: 'Barbería X' });

    expect(merged.shop_name).toBe('Barbería X');
    expect(merged.whatsapp_number).toBe('');
    expect(merged.rating_score).toBe(5);
  });
});
