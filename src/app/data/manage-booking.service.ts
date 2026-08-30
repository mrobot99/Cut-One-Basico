import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type {
  AvailabilityResponse,
  ManageAppointment,
  RescheduleInput,
} from './public-api.models';

/**
 * Los tres endpoints de la gestión pública de la cita (RF-R01 §4, 020-rfs-editar-reserva).
 *
 * Sin estado y sin caché, por el mismo motivo que `BookingService`: la disponibilidad cacheada es un
 * hueco que ya no existe, y reprogramar es una acción, no un dato.
 *
 * El `?subdomain=` lo pone el interceptor (`subdomain.interceptor.ts`) — ningún método lo construye.
 */
@Injectable({ providedIn: 'root' })
export class ManageBookingService {
  private readonly http = inject(HttpClient);

  getAppointment(appointmentId: string): Promise<ManageAppointment> {
    return firstValueFrom(
      this.http.get<ManageAppointment>(`/api/v1/public/appointments/${appointmentId}/manage`),
    );
  }

  /**
   * Misma forma que `BookingService.getAvailability`, pero calculada excluyendo esta cita del solape
   * (RN-09): sin eso, el horario actual del propio cliente le aparecería ocupado y no podría cambiar
   * solo el servicio.
   *
   * El barbero y el servicio son los **seleccionados en la pantalla**, no los de la cita.
   */
  getAvailability(
    appointmentId: string,
    barberId: string,
    serviceId: string,
    date: string,
  ): Promise<AvailabilityResponse> {
    return firstValueFrom(
      this.http.get<AvailabilityResponse>(
        `/api/v1/public/appointments/${appointmentId}/manage/availability`,
        { params: { barberId, serviceId, date } },
      ),
    );
  }

  reschedule(appointmentId: string, input: RescheduleInput): Promise<ManageAppointment> {
    return firstValueFrom(
      this.http.put<ManageAppointment>(
        `/api/v1/public/appointments/${appointmentId}/manage`,
        input,
      ),
    );
  }
}
