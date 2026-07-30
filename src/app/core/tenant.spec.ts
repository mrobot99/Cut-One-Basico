import { environment } from '../../environments/environment';
import { getCompanySubdomain, subdomainFrom } from './tenant';

describe('subdomainFrom', () => {
  it('toma el primer segmento del hostname', () => {
    expect(subdomainFrom('cut-test.cutoneai.com')).toBe('cut-test');
    expect(subdomainFrom('pzbarbershop.cutoneai.com')).toBe('pzbarbershop');
  });

  it('devuelve el hostname entero cuando no hay puntos', () => {
    expect(subdomainFrom('localhost')).toBe('localhost');
  });
});

describe('getCompanySubdomain', () => {
  it('usa el override de desarrollo, que es el entorno con el que corren los tests', () => {
    expect(environment.production).toBe(false);
    expect(getCompanySubdomain()).toBe(environment.devSubdomain);
  });
});
