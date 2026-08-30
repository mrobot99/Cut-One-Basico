// RF-G02 §5. Las formas de los DTO se escriben enteras, no derivadas de un tipo de administración.
// Es la misma decisión que tomó 007-rfs-split-front al partir los repos: los tipos públicos de
// `pz-personalizado` eran `Omit<ManagedService, …>` y arrastraban la forma completa del DTO del panel.
// Esta landing no tiene por qué conocer los campos que solo existen para editar un servicio.
//
// Los nullables se declaran nullables. Es lo que permite que RF-G03 decida no pintar una sección vacía
// en vez de pintar `null`.

export interface PublicService {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMin: number;
  category: string | null;
  isPopular: boolean;
  imageUrl: string | null;
}

export interface PublicBarber {
  id: string;
  displayName: string | null;
  specialty: string | null;
  photoUrl: string | null;
  rating: number | null;
}

/** RF-F05: testimonios reales y paginados. **Sin fecha** — no existe en el contrato (decisión 9). */
export interface PublicTestimonial {
  id: string;
  authorName: string;
  text: string;
  rating: number;
}

export type SlotPeriod = 'Morning' | 'Afternoon' | 'Evening';

export interface AvailableSlot {
  /** `"HH:mm:ss"`: serialización de `TimeOnly` en el backend. */
  startTime: string;
  available: boolean;
}

export interface AvailabilityPeriod {
  period: SlotPeriod;
  slots: AvailableSlot[];
}

export interface AvailabilityResponse {
  /** `"yyyy-MM-dd"`. */
  date: string;
  /**
   * Los tres períodos vienen **siempre**, aunque estén vacíos: es deliberado en el backend para que un
   * frontend pueda pintar tres pestañas con contadores. Este landing los concatena (decisión 8), pero
   * conviene saber que un período vacío es normal y no un error.
   */
  periods: AvailabilityPeriod[];
}

export interface CreateAppointmentInput {
  barberId: string;
  serviceId: string;
  /** `"yyyy-MM-dd"`. */
  date: string;
  /** El backend acepta `"HH:mm"` y `"HH:mm:ss"`. */
  startTime: string;
  customer: {
    fullName: string;
    email: string | null;
    phone: string | null;
    notes: string | null;
  };
  /** Id del barbero cuyo link de reserva originó esta cita, si vino de uno (dato de tracking, opcional). */
  referralBarberId?: string | null;
}

export interface AppointmentCreatedResponse {
  appointmentId: string;
  confirmationCode: string;
  status: string;
  barberName: string;
  serviceName: string;
  date: string;
  startTime: string;
  durationMin: number;
}

/** RF-E01 (006-rfs-encuestas). `appointmentDateEs` ya viene formateada en español por el backend. */
export interface SurveyInfo {
  shopName: string;
  logoUrl: string;
  barberName: string;
  serviceName: string;
  appointmentDateEs: string;
  alreadySubmitted: boolean;
}

export interface SubmitSurveyInput {
  rating: number;
  text?: string;
}

/**
 * RF-R01 (020-rfs-editar-reserva). Estado de una cita en la pantalla pública de gestión, a la que se
 * llega desde el botón del correo de confirmación.
 *
 * `dateEs` ya viene formateada en español por el backend, igual que `SurveyInfo.appointmentDateEs`:
 * es fecha en hora de negocio, y reformatearla en el cliente la desplazaría a la zona del visitante.
 *
 * `notEditableReason` es **texto**, no un código: los tres motivos (cancelada, completada, ya pasó)
 * llevan a la misma pantalla y no ramifican nada (§10.3 nota 4 del RF).
 */
export interface ManageAppointment {
  shopName: string;
  logoUrl: string;
  appointmentId: string;
  confirmationCode: string;
  status: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  price: number;
  durationMin: number;
  /** `"yyyy-MM-dd"`. */
  date: string;
  /** `"HH:mm:ss"`. */
  startTime: string;
  dateEs: string;
  customerName: string;
  editable: boolean;
  notEditableReason: string | null;
}

export interface RescheduleInput {
  barberId: string;
  serviceId: string;
  /** `"yyyy-MM-dd"`. */
  date: string;
  /** El backend acepta `"HH:mm"` y `"HH:mm:ss"`. */
  startTime: string;
}
