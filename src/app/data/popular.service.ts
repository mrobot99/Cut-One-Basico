import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { PopularService } from './public-api.models';

/**
 * Ranking "lo más pedido" del tenant (RF-MP01, serie 030).
 *
 * El backend lo sirve desde DynamoDB, donde lo dejó escrito un job a medianoche: la lectura no toca
 * Postgres. Por eso esta petición es barata aunque salga en paralelo con las del catálogo.
 *
 * **Va aparte de `CatalogService` y no dentro, a propósito.** Aquél marca `failed` cuando cualquiera
 * de sus dos peticiones cae, y esa bandera pinta *"No pudimos cargar los servicios"* en la sección del
 * catálogo. Meter aquí una tercera petición haría que un fallo de una sección **decorativa** rompiera
 * la sección que alimenta el wizard. Son dos ciclos de vida distintos y se mantienen distintos.
 *
 * Sigue igualmente la regla de la casa (RF-G02 §5 RN-07): singleton, `ensureLoaded()` idempotente, y
 * **solo `LandingPage` lo llama**. Los componentes consumen la señal, no lanzan peticiones.
 */
@Injectable({ providedIn: 'root' })
export class PopularServicesService {
  private readonly http = inject(HttpClient);

  private readonly itemsState = signal<PopularService[]>([]);
  private started = false;

  readonly items = this.itemsState.asReadonly();

  ensureLoaded(): void {
    if (this.started) {
      return;
    }
    this.started = true;

    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const items = await firstValueFrom(
        this.http.get<PopularService[]>('/api/v1/public/services/popular'),
      );
      this.itemsState.set(items);
    } catch {
      // No hay señal `failed`, y es la diferencia de fondo con `CatalogService`. Esta sección es
      // decorativa: un fallo la deja sin pintar y la página se ve exactamente igual que antes de que
      // existiera. Avisar de que no se pudo cargar "lo más pedido" sería contarle un problema nuestro
      // a alguien que solo quiere reservar un corte.
      //
      // El backend tampoco tiene un modo de error aquí: sin ranking escrito, o si el que hay no deja
      // tres servicios vivos, devuelve [] — no un 500.
      this.itemsState.set([]);
    }
  }
}
