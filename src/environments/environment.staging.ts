import type { AppEnvironment } from './environment.model';

/**
 * Build desplegable contra el único API funcional del proyecto hoy. Equivalente de `.env.staging` de
 * `pz-personalizado`.
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
