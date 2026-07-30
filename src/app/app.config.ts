import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { apiErrorInterceptor } from './core/api-error';
import { subdomainInterceptor } from './core/subdomain.interceptor';
import { applyColorScheme, resolveTheme } from './theme/resolve-theme';
import { DARK_MODE_SELECTOR, buildPreset } from './theme/themes';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideRouter(
      routes,
      // `appointmentId` llega como input del componente de encuesta, sin inyectar `ActivatedRoute`.
      withComponentInputBinding(),
      // Las anclas del landing (#servicios, #barberos, …) son links del propio header.
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
    ),

    // Los dos interceptores son todo lo que hay entre la app y el API. Ninguno toca cabeceras de
    // autenticación: este bundle no contiene una sola línea capaz de leer un token (RF-G02 §3 RN-01).
    provideHttpClient(withInterceptors([subdomainInterceptor, apiErrorInterceptor])),

    providePrimeNG({
      theme: {
        preset: buildPreset(resolveTheme()),
        options: {
          // RF-G01 §5 RN-01: sin esto vale `system`, y el aspecto de la landing pasaría a depender de
          // la preferencia del sistema operativo del visitante.
          darkModeSelector: DARK_MODE_SELECTOR,
        },
      },
      ripple: true,
    }),

    MessageService,

    // Estampa la clase de modo oscuro antes del primer render.
    provideAppInitializer(() => {
      applyColorScheme(resolveTheme(), document.documentElement);
    }),
  ],
};
