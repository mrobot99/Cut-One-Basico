import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { PublicTestimonial } from './public-api.models';

/** Cuántos se piden por página. El endpoint pagina con `limit`/`offset` (convención BD-04). */
const PAGE_SIZE = 10;

/**
 * Testimonios del tenant (RF-F05). No se cachean en localStorage: no bloquean el primer paint y son lo
 * que cambia con cada encuesta respondida.
 */
@Injectable({ providedIn: 'root' })
export class TestimonialsService {
  private readonly http = inject(HttpClient);

  private readonly itemsState = signal<PublicTestimonial[]>([]);
  private readonly loadingState = signal(true);
  private readonly exhaustedState = signal(false);
  private started = false;

  readonly items = this.itemsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  /** `true` cuando la última página devolvió menos de `PAGE_SIZE`: ya no hay más que pedir. */
  readonly exhausted = this.exhaustedState.asReadonly();

  ensureLoaded(): void {
    if (this.started) {
      return;
    }
    this.started = true;

    void this.loadPage();
  }

  /** Siguiente página. El offset sale del largo actual, así que no puede duplicar tarjetas. */
  loadMore(): void {
    if (this.loadingState() || this.exhaustedState()) {
      return;
    }

    void this.loadPage();
  }

  private async loadPage(): Promise<void> {
    this.loadingState.set(true);

    try {
      const page = await firstValueFrom(
        this.http.get<PublicTestimonial[]>('/api/v1/public/testimonials', {
          params: { limit: PAGE_SIZE, offset: this.itemsState().length },
        }),
      );

      this.itemsState.update((current) => [...current, ...page]);
      this.exhaustedState.set(page.length < PAGE_SIZE);
    } catch {
      // Sin testimonios la sección simplemente no se pinta (RF-G03 §5 RN-02): no es un fallo que el
      // visitante tenga que ver.
      this.exhaustedState.set(true);
    } finally {
      this.loadingState.set(false);
    }
  }
}
