import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Button } from 'primeng/button';
import { resolveImage } from '../core/images';
import type { Branding } from '../data/branding';

/**
 * Cabecera del landing. Marca del tenant + anclas + CTA.
 *
 * Las anclas son `#servicios`, `#barberos`, `#nosotros` y `#contacto` — las del mockup, no las de
 * `pz-personalizado` (que usaba `#equipo`): son dos aplicaciones distintas y ningún link externo
 * depende de ellas.
 */
@Component({
  selector: 'cob-site-header',
  imports: [Button],
  templateUrl: './site-header.html',
  styleUrl: './site-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeader {
  readonly branding = input.required<Branding>();
  readonly book = output<void>();

  protected readonly logo = computed(() => resolveImage(this.branding().logo_url));
}
