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

  /**
   * Marca del build, `YYYY-MM-DD.N`, que `main.ts` imprime en consola al arrancar.
   *
   * **Añadido el 2026-09-04, y llegó tarde.** Este repo era el único de los tres frontends sin
   * marcador: ni éste ni el `VITE_VERSION` de `pz-personalizado`, y `main.ts` no imprimía nada. La
   * consecuencia práctica es que **no había forma de saber qué código estaba publicado**: Netlify
   * construye solo al pushear a `master`, sus `*.netlify.app` devuelven 404 y el dashboard es del
   * usuario, así que confirmar un despliegue era descargar el `main-*.js`, sacar sus `chunk-*.js` y
   * buscar a ojo una cadena del propio cambio. Eso funciona para el cambio que acabas de hacer y para
   * ninguna otra pregunta — sobre todo no para *"¿llegó el push o el build falló en silencio?"*, que
   * es la que hay que responder, porque **ya ha pasado dos veces** (ver `CLAUDE.md` raíz).
   *
   * Es `readonly string` y **obligatorio**, así que los cinco archivos de entorno tienen que
   * declararlo: mismo criterio que `themeKey`, un build al que se le olvide no compila en vez de
   * publicar en silencio un bundle anónimo.
   *
   * En los builds locales vale `'dev'`. La fecha solo tiene sentido donde hay un despliegue que
   * fechar, y un `'dev'` en consola dice exactamente lo que hay que saber: esto no salió de Netlify.
   */
  readonly version: string;
}
