// RF-G02 §5.1. La respuesta de settings llega en snake_case porque el esquema lo fijó el frontend y el
// backend lo replica en `BrandingSettingRequest` / `HeroSettingRequest`. Se conserva tal cual en vez de
// camelizar: renombrar aquí obligaría a mantener un mapa de nombres a los dos lados del contrato.

export interface Branding {
  logo_url: string;
  shop_name: string;
  slogan: string;
  hero_image_url: string;
  hero_title: string;
  hero_subtitle: string;
  est_year: string;
  location: string;
  schedule: string;
  about_us_title: string;
  about_us_text: string;
  about_us_images: string[];
  public_phone: string;
  instagram_url: string;
  whatsapp_number: string;
  rating_score: number;
}

type BrandingSetting = Partial<Omit<Branding, 'hero_image_url' | 'hero_title' | 'hero_subtitle'>>;
type HeroSetting = Partial<Pick<Branding, 'hero_image_url' | 'hero_title' | 'hero_subtitle'>>;

/**
 * `branding` y `hero` son dos keys separadas de `CompanySetting` (RF-13 §3, RF-F01) que se piden juntas
 * y se combinan en un único objeto: los consumidores no tienen por qué saber en qué key vive cada campo.
 */
export interface PublicSettingsBundle {
  branding?: BrandingSetting;
  hero?: HeroSetting;
  /**
   * No es una `CompanySetting` editable por el admin: vive en `Company.RatingScore` y lo recalcula
   * `RatingsRecalcJob` cada noche a partir de reseñas reales. Por eso viaja como campo suelto del
   * bundle y no anidado — tiparlo dentro de `branding` lo dejaría siempre `undefined`.
   */
  rating_score?: number;
}

/**
 * RF-G02 §5 RN-06. **Sin datos de ningún tenant.** Un tenant nuevo sin `CompanySetting` debe ver una
 * landing vacía y coherente, no la de otro negocio (RF-F02). Es la trampa más fácil de caer al montar
 * una app nueva: rellenar los defaults con lo que se tenga a mano para "ver algo" y dejarlo.
 */
export const DEFAULTS: Branding = {
  logo_url: '',
  shop_name: '',
  slogan: '',
  hero_image_url: '',
  hero_title: '',
  hero_subtitle: '',
  est_year: '',
  location: '',
  schedule: '',
  about_us_title: '',
  about_us_text: '',
  about_us_images: [],
  public_phone: '',
  instagram_url: '',
  whatsapp_number: '',
  rating_score: 5,
};

/**
 * Aplana el bundle del API sobre `DEFAULTS`, de modo que un campo ausente sea cadena vacía y no
 * `undefined`.
 */
export function mergeBrandingBundle(bundle: PublicSettingsBundle): Branding {
  return {
    ...DEFAULTS,
    ...bundle.branding,
    ...bundle.hero,
    rating_score: bundle.rating_score ?? DEFAULTS.rating_score,
  };
}

/**
 * Lo mismo para un snapshot de localStorage, que ya está plano pero pudo guardarse antes de que
 * existiera un campo nuevo: sin la fusión ese campo quedaría `undefined` y rompería a un consumidor que
 * espera `string`.
 */
export function mergeBrandingSnapshot(snapshot: Partial<Branding>): Branding {
  return { ...DEFAULTS, ...snapshot };
}
