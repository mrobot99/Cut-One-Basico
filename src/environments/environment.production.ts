import type { AppEnvironment } from './environment.model';

/**
 * Build de producción. El backend **no tiene todavía un API de producción real**
 * (`appsettings.Production.json` está vacío, `{}` — Staging es el único ambiente funcional del
 * proyecto). Mientras eso no cambie, `apiUrl` apunta al mismo API que `environment.staging.ts` a
 * propósito, para que `npm run build:production` sea desplegable hoy en vez de fallar contra un
 * backend que no existe.
 *
 * El día que exista un API de producción real, este es el único archivo que cambia — la separación
 * en dos archivos ya está hecha para que ese día sea una URL, no una migración de configuración.
 *
 * `devSubdomain` vacío y `production: true` es lo que apaga el override de tenant: aquí el subdominio
 * lo decide el hostname (RF-G02 §4 RN-04).
 */
export const environment: AppEnvironment = {
  production: true,
  apiUrl: 'https://1w1n64683b.execute-api.us-east-1.amazonaws.com',
  themeKey: 'noche',
  devSubdomain: '',
};
