import { resolveImage } from './images';

describe('resolveImage', () => {
  it('devuelve undefined sin valor', () => {
    expect(resolveImage(null)).toBeUndefined();
    expect(resolveImage('')).toBeUndefined();
    expect(resolveImage(undefined)).toBeUndefined();
  });

  it('deja pasar URLs absolutas, rutas y data URIs', () => {
    expect(resolveImage('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
    expect(resolveImage('/seed/service-fade.webp')).toBe('/seed/service-fade.webp');
    expect(resolveImage('data:image/png;base64,AAA')).toBe('data:image/png;base64,AAA');
  });

  it('mapea los nombres de archivo semilla al asset del bundle', () => {
    // Sin esto, un tenant aprovisionado con filas semilla muestra miniaturas rotas (RF-G02 §7 RN-10).
    expect(resolveImage('service-fade.webp')).toBe('/seed/service-fade.webp');
    expect(resolveImage('barber-1.webp')).toBe('/seed/barber-1.webp');
  });

  it('mapea también las filas viejas que guardaban .jpg', () => {
    expect(resolveImage('service-fade.jpg')).toBe('/seed/service-fade.webp');
  });

  it('devuelve tal cual un nombre desconocido', () => {
    expect(resolveImage('lo-que-sea.webp')).toBe('lo-que-sea.webp');
  });
});
