import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { applyPageMetadata } from '../core/page-metadata';
import { BookingWizard } from '../booking/booking-wizard';
import { CatalogService } from '../data/catalog.service';
import { SettingsService } from '../data/settings.service';
import { TestimonialsService } from '../data/testimonials.service';
import type { PublicBarber, PublicService } from '../data/public-api.models';
import { AboutSection } from './about-section';
import { BarbersSection } from './barbers-section';
import { HeroSection } from './hero-section';
import { ServicesSection } from './services-section';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';
import { TestimonialsSection } from './testimonials-section';

/**
 * La página `/`. Orquesta las seis secciones y el wizard; no pinta ningún dato por su cuenta.
 *
 * Es el único sitio que llama a `ensureLoaded()`: los servicios de datos son singletons y las secciones
 * consumen sus señales, así que `/services` y `/barbers` se piden **una vez** por carga de página
 * (RF-G02 §5 RN-07). Añadir aquí un componente que cargue lo suyo por su cuenta reintroduciría la
 * regresión que se midió en producción en `pz-personalizado` el 2026-07-28.
 */
@Component({
  selector: 'cob-landing-page',
  imports: [
    AboutSection,
    BarbersSection,
    BookingWizard,
    HeroSection,
    ServicesSection,
    SiteFooter,
    SiteHeader,
    TestimonialsSection,
  ],
  templateUrl: './landing-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPage {
  private readonly settings = inject(SettingsService);
  private readonly catalog = inject(CatalogService);
  private readonly testimonialsService = inject(TestimonialsService);

  private readonly wizard = viewChild.required(BookingWizard);

  protected readonly branding = this.settings.branding;
  protected readonly services = this.catalog.services;
  protected readonly barbers = this.catalog.barbers;
  protected readonly catalogLoading = this.catalog.loading;
  protected readonly catalogFailed = this.catalog.failed;
  protected readonly testimonials = this.testimonialsService.items;

  /**
   * RF-G03 §5 RN-02: la sección Nosotros solo existe si hay texto. Vaciar título y texto desde el panel
   * es la única forma de apagarla — la key `appearance` que traía flags de módulos se eliminó del
   * backend el 2026-07-30.
   */
  protected readonly showAbout = computed(() => {
    const branding = this.branding();
    return Boolean(branding.about_us_title || branding.about_us_text);
  });

  protected readonly showTestimonials = computed(() => this.testimonials().length > 0);

  protected readonly canLoadMoreTestimonials = computed(
    () => !this.testimonialsService.exhausted() && !this.testimonialsService.loading(),
  );

  constructor() {
    this.settings.ensureLoaded();
    this.catalog.ensureLoaded();
    this.testimonialsService.ensureLoaded();

    // Título y favicon en cuanto llega el branding (RF-G02 §8): `index.html` es un shell único servido
    // a todos los subdominios y no puede llevar el nombre de ningún tenant.
    effect(() => applyPageMetadata(this.branding()));
  }

  protected openWizard(): void {
    this.wizard().open();
  }

  protected bookService(service: PublicService): void {
    this.wizard().open(service, null);
  }

  protected bookBarber(barber: PublicBarber): void {
    this.wizard().open(null, barber);
  }

  protected loadMoreTestimonials(): void {
    this.testimonialsService.loadMore();
  }
}
