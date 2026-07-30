import { environment } from '../../environments/environment';

// RF-G02 §4. El tenant se identifica por el subdominio real de la URL (`cut-test` de
// cut-test.cutoneai.com), nunca por configuración estática: un mismo bundle se sirve a cualquier
// subdominio (decisión 1 de la serie), así que un valor fijo de build mostraría siempre los datos del
// tenant con el que se compiló.

/** Primer segmento del hostname. Aislado para poder probarlo sin tocar `window`. */
export function subdomainFrom(hostname: string): string {
  return hostname.split('.')[0];
}

/**
 * Subdominio del tenant de esta visita.
 *
 * Excepción deliberada en desarrollo: editar el hosts file para probar otro tenant en local exige
 * permisos de administrador que no siempre están disponibles (RF-F02), así que `devSubdomain` deja
 * simularlo. La rama está guardada por `!environment.production` — el archivo de entorno desplegable
 * declara `production: true` y `devSubdomain: ''`, así que no es una puerta que sobreviva a un build
 * (RN-04).
 */
export function getCompanySubdomain(): string {
  if (!environment.production && environment.devSubdomain) {
    return environment.devSubdomain;
  }

  return subdomainFrom(window.location.hostname);
}
