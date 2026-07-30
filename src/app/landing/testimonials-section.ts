import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Carousel } from 'primeng/carousel';
import { Rating } from 'primeng/rating';
import type { PublicTestimonial } from '../data/public-api.models';

@Component({
  selector: 'cob-testimonials-section',
  imports: [Button, Carousel, FormsModule, Rating],
  templateUrl: './testimonials-section.html',
  styleUrl: './testimonials-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestimonialsSection {
  // Sin `readonly` en el tipo del array: `p-carousel` espera `any[]` y un `readonly T[]` no le asigna.
  readonly testimonials = input.required<PublicTestimonial[]>();
  readonly shopName = input('');
  readonly canLoadMore = input(false);

  readonly loadMore = output<void>();

  protected readonly responsiveOptions = [
    { breakpoint: '64rem', numVisible: 3, numScroll: 1 },
    { breakpoint: '48rem', numVisible: 2, numScroll: 1 },
    { breakpoint: '32rem', numVisible: 1, numScroll: 1 },
  ];
}
