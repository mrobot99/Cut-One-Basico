import type { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { getCompanySubdomain } from './tenant';

/** Prefijo de las rutas públicas del API. Todas exigen `?subdomain=` (`TenantResolutionMiddleware`). */
export const PUBLIC_API_PREFIX = '/api/v1/public/';

/**
 * RF-G02 §4 RN-03. Añade `subdomain` a toda petición pública, y también la base del API cuando el
 * entorno la trae.
 *
 * Es la única diferencia de diseño con `pz-personalizado` en esta capa, y es deliberada: allí los seis
 * servicios concatenan `?subdomain=` a mano en cada método, y basta olvidarlo una vez para que una
 * petición se resuelva contra el tenant equivocado. Aquí ningún servicio lo construye — es imposible
 * olvidarlo.
 */
export const subdomainInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(PUBLIC_API_PREFIX)) {
    return next(request);
  }

  return next(
    request.clone({
      url: `${environment.apiUrl}${request.url}`,
      setParams: { subdomain: getCompanySubdomain() },
    }),
  );
};
