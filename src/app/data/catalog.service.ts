import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { PublicBarber, PublicService } from './public-api.models';

/**
 * Servicios y barberos del tenant.
 *
 * RF-G02 §5 RN-07: **una sola petición por recurso y por carga de página**. El landing de
 * `pz-personalizado` pedía `/services` y `/barbers` dos veces cada uno —verificado con DevTools en
 * producción el 2026-07-28— porque cada componente cargaba su propio catálogo con `useEffect`; allí se
 * arregló trayendo react-query. Aquí lo resuelve la propia inyección de dependencias: este servicio es
 * singleton, `ensureLoaded()` es idempotente y los componentes consumen la señal ya cargada.
 *
 * Quien añada un componente que necesite el catálogo **consume estas señales, no lanza otra petición**.
 */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);

  private readonly servicesState = signal<PublicService[]>([]);
  private readonly barbersState = signal<PublicBarber[]>([]);
  private readonly loadingState = signal(true);
  private readonly failedState = signal(false);
  private started = false;

  readonly services = this.servicesState.asReadonly();
  readonly barbers = this.barbersState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  /** El catálogo alimenta el wizard: si falla, la sección lo dice en vez de fingir que está vacío. */
  readonly failed = this.failedState.asReadonly();

  ensureLoaded(): void {
    if (this.started) {
      return;
    }
    this.started = true;

    void this.load();
  }

  private async load(): Promise<void> {
    try {
      // En paralelo, y esta vez sí: son dos filas de tablas distintas, no dos columnas de la misma
      // (que es el caso de branding+hero, donde la concurrencia solo compraba cold starts).
      const [services, barbers] = await Promise.all([
        firstValueFrom(this.http.get<PublicService[]>('/api/v1/public/services')),
        firstValueFrom(this.http.get<PublicBarber[]>('/api/v1/public/barbers')),
      ]);

      this.servicesState.set(services);
      this.barbersState.set(barbers);
    } catch {
      this.failedState.set(true);
    } finally {
      this.loadingState.set(false);
    }
  }
}
