import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Step, StepList, StepPanel, StepPanels, Stepper } from 'primeng/stepper';
import { Textarea } from 'primeng/textarea';
import { resolveImage } from '../core/images';
import { dayLabels, formatCOP, formatLongDate, todayInBusinessZone } from '../core/locale';
import { BookingService } from '../data/booking.service';
import type {
  AppointmentCreatedResponse,
  PublicBarber,
  PublicService,
} from '../data/public-api.models';
import { bookingWindow, flattenSlots, slotsState, type FlatSlot } from './availability';
import { planForBookingError } from './booking-errors';

/**
 * Wizard de reserva en cuatro pasos dentro de un diálogo modal (RF-G04).
 *
 * **El paso 2 no ofrece "cualquier barbero"** y no puede ofrecerlo (decisión 7 de la serie): `BarberId`
 * es `Guid` no nullable en `CreateAppointmentRequest` y `barberId` es obligatorio en `/availability`.
 * Resolverlo en el cliente serían N peticiones por cambio de día, con N cold starts posibles — el
 * problema exacto que RF-O11 midió y eliminó. El mockup lo mostraba como una tarjeta más: no se sigue.
 */
@Component({
  selector: 'cob-booking-wizard',
  imports: [
    Button,
    Dialog,
    FloatLabel,
    InputText,
    Message,
    ProgressSpinner,
    ReactiveFormsModule,
    Step,
    StepList,
    StepPanel,
    StepPanels,
    Stepper,
    Textarea,
  ],
  templateUrl: './booking-wizard.html',
  styleUrl: './booking-wizard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingWizard {
  private readonly booking = inject(BookingService);
  private readonly messages = inject(MessageService);
  private readonly formBuilder = inject(FormBuilder);

  readonly services = input.required<readonly PublicService[]>();
  readonly barbers = input.required<readonly PublicBarber[]>();

  protected readonly visible = signal(false);
  protected readonly step = signal(1);

  protected readonly service = signal<PublicService | null>(null);
  protected readonly barber = signal<PublicBarber | null>(null);
  protected readonly date = signal(todayInBusinessZone());
  protected readonly time = signal<string | null>(null);

  protected readonly slots = signal<FlatSlot[]>([]);
  protected readonly slotsLoading = signal(false);
  protected readonly slotsFailed = signal(false);

  protected readonly submitting = signal(false);
  protected readonly created = signal<AppointmentCreatedResponse | null>(null);

  /** La ventana se calcula al abrir, no en cada render: es la misma durante toda la sesión. */
  protected readonly days = signal(bookingWindow());

  protected readonly slotsState = computed(() => slotsState(this.slots()));

  /**
   * Límites del backend (`CreateAppointmentRequestValidator`), no los de `pz-personalizado` — su
   * esquema zod usa 80 y 300, más estrictos que el servidor sin motivo documentado. Rechazar en el
   * cliente algo que el servidor aceptaría es fricción gratuita.
   *
   * El correo es obligatorio aquí aunque el backend acepte correo **o** teléfono (RF-G04 §5 RN-04): los
   * tres avisos al cliente son correo, y el link de encuesta viaja *solo* dentro del correo de
   * agradecimiento. Quien reserve solo con teléfono no recibiría nada.
   */
  protected readonly form = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
    phone: ['', [Validators.maxLength(30)]],
    notes: ['', [Validators.maxLength(500)]],
  });

  protected readonly formatPrice = formatCOP;
  protected readonly formatDate = formatLongDate;
  protected readonly labelsFor = dayLabels;

  /** Abre el wizard en el primer paso que todavía no tiene dato. */
  open(service: PublicService | null = null, barber: PublicBarber | null = null): void {
    this.reset();
    this.service.set(service);
    this.barber.set(barber);
    this.step.set(this.firstIncompleteStep());
    this.visible.set(true);

    if (service && barber) {
      void this.loadAvailability();
    }
  }

  protected image(url: string | null): string | undefined {
    return resolveImage(url);
  }

  protected barberName(barber: PublicBarber | null): string {
    return barber?.displayName ?? 'Profesional';
  }

  protected chooseService(service: PublicService): void {
    this.service.set(service);
    this.clearTime();
    this.step.set(this.barber() ? 3 : 2);

    if (this.barber()) {
      void this.loadAvailability();
    }
  }

  protected chooseBarber(barber: PublicBarber): void {
    this.barber.set(barber);
    this.clearTime();
    this.step.set(3);
    void this.loadAvailability();
  }

  /** Cambiar de día limpia la hora elegida y vuelve a pedir disponibilidad (RF-G04 §4). */
  protected chooseDate(date: string): void {
    if (date === this.date()) {
      return;
    }

    this.date.set(date);
    this.clearTime();
    void this.loadAvailability();
  }

  protected chooseTime(slot: FlatSlot): void {
    if (!slot.available) {
      return;
    }

    this.time.set(slot.startTime);
    this.step.set(4);
  }

  protected back(): void {
    this.step.update((current) => Math.max(1, current - 1));
  }

  protected async confirm(): Promise<void> {
    const service = this.service();
    const barber = this.barber();
    const time = this.time();

    if (!service || !barber || !time) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Un doble click son dos citas, y el backend las aceptaría si caen en slots distintos.
    if (this.submitting()) {
      return;
    }

    this.submitting.set(true);
    const values = this.form.getRawValue();

    try {
      const created = await this.booking.createAppointment({
        barberId: barber.id,
        serviceId: service.id,
        date: this.date(),
        startTime: time,
        customer: {
          fullName: values.fullName.trim(),
          email: values.email.trim(),
          // El teléfono se guarda y cuenta para el límite de citas pendientes del backend, pero hoy
          // ningún canal lo lee. Es deuda visible a propósito.
          phone: values.phone.trim() || null,
          notes: values.notes.trim() || null,
        },
      });

      this.created.set(created);
    } catch (error) {
      this.handleBookingError(error);
    } finally {
      this.submitting.set(false);
    }
  }

  protected close(): void {
    this.visible.set(false);
  }

  private handleBookingError(error: unknown): void {
    const plan = planForBookingError(error);

    this.messages.add({
      severity: 'error',
      summary: plan.summary,
      detail: plan.detail,
      life: 8000,
    });

    switch (plan.reaction) {
      case 'reload-availability':
        this.clearTime();
        this.step.set(3);
        void this.loadAvailability();
        break;

      case 'back-to-schedule':
        this.clearTime();
        this.step.set(3);
        break;

      case 'restart':
        this.reset();
        break;

      case 'stay':
        break;
    }
  }

  private async loadAvailability(): Promise<void> {
    const service = this.service();
    const barber = this.barber();

    if (!service || !barber) {
      return;
    }

    this.slotsLoading.set(true);
    this.slotsFailed.set(false);

    try {
      const response = await this.booking.getAvailability(barber.id, service.id, this.date());
      this.slots.set(flattenSlots(response));
    } catch {
      this.slots.set([]);
      this.slotsFailed.set(true);
    } finally {
      this.slotsLoading.set(false);
    }
  }

  private firstIncompleteStep(): number {
    if (!this.service()) {
      return 1;
    }
    if (!this.barber()) {
      return 2;
    }
    return this.time() ? 4 : 3;
  }

  private clearTime(): void {
    this.time.set(null);
  }

  private reset(): void {
    this.step.set(1);
    this.service.set(null);
    this.barber.set(null);
    this.date.set(todayInBusinessZone());
    this.days.set(bookingWindow());
    this.time.set(null);
    this.slots.set([]);
    this.slotsFailed.set(false);
    this.created.set(null);
    this.submitting.set(false);
    this.form.reset();
  }
}
