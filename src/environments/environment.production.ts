import type { AppEnvironment } from './environment.model';

/**
 * Cualquier build desplegable. Equivalente de `.env.staging` de `pz-personalizado`, que hoy es el
 * único entorno desplegado del proyecto: el API de staging es el que sirve a `*.cutoneai.com`.
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
