import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast';

/**
 * Shell de la aplicación: la ruta activa y el único `p-toast` del proyecto.
 *
 * El toast vive aquí y no dentro del wizard porque `MessageService` es global y el wizard se destruye
 * al cerrarse — un aviso emitido justo al cerrar no tendría dónde pintarse.
 */
@Component({
  selector: 'cob-root',
  imports: [RouterOutlet, Toast],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
