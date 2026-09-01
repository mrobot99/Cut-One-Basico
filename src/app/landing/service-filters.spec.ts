import type { PublicService } from '../data/public-api.models';
import {
  ALL_CHIP_KEY,
  POPULAR_CHIP_KEY,
  deriveCategoryChips,
  filterServices,
} from './service-filters';

function service(overrides: Partial<PublicService> = {}): PublicService {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    name: 'Corte',
    description: null,
    price: 30000,
    durationMin: 30,
    category: null,
    isPopular: false,
    imageUrl: null,
    barberIds: [],
    ...overrides,
  };
}

describe('deriveCategoryChips', () => {
  it('no pinta la fila con una sola categoría y ningún popular', () => {
    // Un filtro con un solo destino posible no filtra nada (RF-G03 §5 RN-03.4).
    const chips = deriveCategoryChips([
      service({ id: '1', category: 'Cortes' }),
      service({ id: '2', category: 'Cortes' }),
    ]);

    expect(chips).toEqual([]);
  });

  it('no pinta la fila sin categorías ni populares', () => {
    expect(deriveCategoryChips([service({ id: '1' }), service({ id: '2' })])).toEqual([]);
  });

  it('pinta Todos + Populares cuando hay populares aunque no haya categorías', () => {
    const chips = deriveCategoryChips([
      service({ id: '1', isPopular: true }),
      service({ id: '2' }),
    ]);

    expect(chips.map((chip) => chip.key)).toEqual([ALL_CHIP_KEY, POPULAR_CHIP_KEY]);
  });

  it('con un popular y tres categorías salen cinco chips, en orden', () => {
    const chips = deriveCategoryChips([
      service({ id: '1', category: 'Cortes', isPopular: true }),
      service({ id: '2', category: 'Barba' }),
      service({ id: '3', category: 'Adicionales' }),
    ]);

    expect(chips.map((chip) => chip.label)).toEqual([
      'Todos',
      'Populares',
      'Adicionales',
      'Barba',
      'Cortes',
    ]);
  });

  it('Populares no es una categoría: lo declara en kind', () => {
    const chips = deriveCategoryChips([
      service({ id: '1', category: 'Cortes', isPopular: true }),
      service({ id: '2', category: 'Barba' }),
    ]);

    expect(chips.map((chip) => chip.kind)).toEqual(['all', 'popular', 'category', 'category']);
  });

  it('ignora categorías nulas y en blanco', () => {
    const chips = deriveCategoryChips([
      service({ id: '1', category: 'Cortes' }),
      service({ id: '2', category: null }),
      service({ id: '3', category: '   ' }),
      service({ id: '4', category: 'Barba' }),
    ]);

    expect(chips.map((chip) => chip.label)).toEqual(['Todos', 'Barba', 'Cortes']);
  });

  it('no colapsa categorías cuando hay muchas', () => {
    const many = Array.from({ length: 10 }, (_, index) =>
      service({ id: String(index), category: `Cat ${index}` }),
    );

    expect(deriveCategoryChips(many)).toHaveLength(11);
  });
});

describe('filterServices', () => {
  const services = [
    service({ id: '1', category: 'Cortes', isPopular: true }),
    service({ id: '2', category: 'Barba' }),
    service({ id: '3', category: 'Barba', isPopular: true }),
  ];

  it('Todos devuelve el catálogo completo', () => {
    expect(filterServices(services, ALL_CHIP_KEY)).toHaveLength(3);
  });

  it('Populares filtra por el flag, no por categoría', () => {
    expect(filterServices(services, POPULAR_CHIP_KEY).map((s) => s.id)).toEqual(['1', '3']);
  });

  it('una categoría filtra por su texto', () => {
    expect(filterServices(services, 'Barba').map((s) => s.id)).toEqual(['2', '3']);
  });

  it('una clave desconocida no deja la sección vacía', () => {
    expect(filterServices(services, 'Categoría que ya no existe')).toHaveLength(3);
  });
});
