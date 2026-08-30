import { Routes } from '@angular/router';

/**
 * RF-G01 §7. Sin prefijo de ruta: esta aplicación es la dueña de la raíz del host — el prefijo
 * `/admin/` es del panel y no se sirve desde este repo.
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./landing/landing-page').then((m) => m.LandingPage),
  },
  {
    // Decisión 5 de la serie: el backend compone este link a mano y lo manda por correo
    // (`TransactionalEmails.cs:317`). Quien sirve `/` para un tenant es dueño de esta ruta.
    path: 'encuesta/:appointmentId',
    loadComponent: () => import('./survey/survey-page').then((m) => m.SurveyPage),
  },
  {
    // RF-R01 (020-rfs-editar-reserva): mismo argumento que la ruta de encuesta — el backend compone
    // `https://{subdomain}.{domain}/reserva/{id}` en el correo de confirmación
    // (`TransactionalEmails.RenderManageButtonHtml`), así que quien sirve `/` es dueño de esta ruta.
    path: 'reserva/:appointmentId',
    loadComponent: () => import('./manage/manage-booking-page').then((m) => m.ManageBookingPage),
  },
  {
    path: '**',
    loadComponent: () => import('./not-found/not-found-page').then((m) => m.NotFoundPage),
  },
];
