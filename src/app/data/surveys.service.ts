import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { SubmitSurveyInput, SurveyInfo } from './public-api.models';

/** RF-E01 (006-rfs-encuestas). El `appointmentId` es un GUID y es la única credencial del link. */
@Injectable({ providedIn: 'root' })
export class SurveysService {
  private readonly http = inject(HttpClient);

  getInfo(appointmentId: string): Promise<SurveyInfo> {
    return firstValueFrom(
      this.http.get<SurveyInfo>(`/api/v1/public/surveys/${appointmentId}`),
    );
  }

  /** Responde 204 sin cuerpo. */
  async submit(appointmentId: string, input: SubmitSurveyInput): Promise<void> {
    await firstValueFrom(
      this.http.post(`/api/v1/public/surveys/${appointmentId}`, input, { observe: 'response' }),
    );
  }
}
