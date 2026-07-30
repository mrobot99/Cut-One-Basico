import type { ThemeKey } from '../app/theme/themes';

/**
 * RF-G01 §4. Angular no lee archivos `.env`: la configuración por build son estos archivos,
 * intercambiados por `fileReplacements` en `angular.json`.
 */
export interface AppEnvironment {
  /**
   * Guarda del override de tenant (RF-G02 §4 RN-04). La garantía de que `devSubdomain` no sobreviva a
   * un build desplegado no es su nombre: es que el archivo de producción declare `production: true`.
   */
  readonly production: boolean;

  /**
   * Base del API. Cadena vacía en local: las peticiones salen relativas y las reenvía el proxy del
   * dev server, con lo que el navegador ve mismo origen y CORS no interviene (RF-G01 §6).
   */
  readonly apiUrl: string;

  /**
   * La variable de la decisión 2 de la serie. Tipada contra el catálogo de temas, **no `string`**:
   * un valor mal escrito rompe el build en vez de caer en silencio en un tema por defecto.
   */
  readonly themeKey: ThemeKey;

  /**
   * Simula el subdominio del tenant en local. Vacío en cualquier build desplegado — ahí el tenant lo
   * decide el hostname (RF-G02 §4).
   */
  readonly devSubdomain: string;
}
