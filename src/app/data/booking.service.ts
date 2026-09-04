import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type {
  AppointmentCreatedResponse,
  AvailabilityResponse,
  CreateAppointmentInput,
} from './public-api.models';

/**
 * Los dos endpoints públicos de reserva (RF-07 §7).
 *
 * Sin estado: la disponibilidad **no se cachea** —cachearla sería ofrecer un slot que ya no existe— y
 * la creación de la cita es una acción, no un dato.
 */
@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);

  /**
   * El servicio importa en la consulta, no solo el barbero: el solape se calcula con su duración, así
   * que la misma hora puede estar libre para un corte y ocupada para un corte + barba.
   *
   * `barberId` **nulo** es "cualquier profesional" (RF-CP01 §4.1, serie 031): el parámetro se omite y
   * el backend devuelve la unión de las horas de todos los que prestan el servicio, con la misma
   * forma de respuesta. Se omite en vez de mandarse vacío porque `?barberId=` sería un GUID inválido,
   * no una ausencia.
   */
  getAvailability(barberId: string | null, serviceId: string, date: string): Promise<AvailabilityResponse> {
    return firstValueFrom(
      this.http.get<AvailabilityResponse>('/api/v1/public/availability', {
        params: barberId ? { barberId, serviceId, date } : { serviceId, date },
      }),
    );
  }

  createAppointment(input: CreateAppointmentInput): Promise<AppointmentCreatedResponse> {
    return firstValueFrom(
      this.http.post<AppointmentCreatedResponse>('/api/v1/public/appointments', input),
    );
  }
}
