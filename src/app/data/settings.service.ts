import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  readBrandingSnapshot,
  writeBrandingSnapshot,
} from '../core/public-content.storage';
import {
  DEFAULTS,
  mergeBrandingBundle,
  mergeBrandingSnapshot,
  type Branding,
  type PublicSettingsBundle,
} from './branding';

/**
 * Branding del tenant: la única fuente de marca, contacto y contenido del hero de toda la aplicación.
 *
 * Singleton (RF-G02 §5 RN-07): quien necesite el branding consume esta señal, nunca lanza su propia
 * petición. Es la contrapartida en Angular del arreglo que en `pz-personalizado` necesitó react-query.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);

  private readonly state = signal<Branding>(DEFAULTS);
  private readonly loadingState = signal(false);
  private started = false;

  /** Branding resuelto. Empieza en el snapshot si hay uno vigente, y si no en `DEFAULTS`. */
  readonly branding = this.state.asReadonly();

  /** `true` solo mientras se espera la primera respuesta **sin** snapshot que pintar. */
  readonly loading = computed(() => this.loadingState());

  /**
   * Carga el branding una sola vez por vida de la aplicación.
   *
   * Si hay snapshot vigente se pinta de inmediato y la revalidación sale igual, en segundo plano: el
   * dato de localStorage es un acelerador del primer paint, no una excusa para no preguntar.
   */
  ensureLoaded(): void {
    if (this.started) {
      return;
    }
    this.started = true;

    const cached = readBrandingSnapshot<Partial<Branding>>();
    if (cached) {
      this.state.set(mergeBrandingSnapshot(cached));
    } else {
      this.loadingState.set(true);
    }

    void this.refresh();
  }

  private async refresh(): Promise<void> {
    try {
      // Una sola petición para las dos keys (RN-05). En el backend son columnas de la misma fila de
      // `CompanySetting`, así que pedirlas por separado eran invocaciones Lambda y RTT extra para
      // resolver un único SELECT — y, medido en X-Ray el 2026-07-28, hasta tres cold starts
      // simultáneos por carga de página. No se separan por comodidad de tipado.
      const bundle = await firstValueFrom(
        this.http.get<PublicSettingsBundle>('/api/v1/public/settings', {
          params: { keys: 'branding,hero' },
        }),
      );

      const fresh = mergeBrandingBundle(bundle);
      this.state.set(fresh);
      writeBrandingSnapshot(fresh);
    } catch {
      // Un fallo aquí deja lo que hubiera: snapshot vigente o `DEFAULTS`. La landing tiene que cargar
      // igual — sin branding se pinta vacía y coherente (RN-06), no rota.
    } finally {
      this.loadingState.set(false);
    }
  }
}
