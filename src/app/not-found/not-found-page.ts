import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button } from 'primeng/button';
import { RouterLink } from '@angular/router';

/** Mismo criterio que `NotFound.tsx` de `pz-personalizado`: una salida, no una pantalla en blanco. */
@Component({
  selector: 'cob-not-found-page',
  imports: [Button, RouterLink],
  template: `
    <main class="page">
      <h1>Página no encontrada</h1>
      <p class="cob-muted">El enlace que seguiste no existe o cambió de dirección.</p>
      <p-button label="Ir al inicio" icon="pi pi-home" routerLink="/" />
    </main>
  `,
  styles: `
    .page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      min-height: 100dvh;
      padding: 1.5rem;
      text-align: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {}
