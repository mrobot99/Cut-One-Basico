import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { installLightDarkFallback } from './app/core/light-dark-fallback';
import { environment } from './environments/environment';

// Marca del build, lo primero y sin condicionarla a `production`. Es la única forma de responder desde
// fuera "¿qué código está publicado?" sin entrar al dashboard de Netlify: se abre la consola y se lee.
// Va antes del bootstrap a propósito — si Angular revienta al arrancar, la versión del bundle que
// reventó es justo el dato que hace falta.
console.log('version', environment.version);

// Va ANTES del bootstrap para que el observador de `<head>` ya esté escuchando cuando PrimeNG
// inyecte los tokens del tema, que es lo primero que hacen sus providers. En Chrome, Edge, Firefox y
// Safari 17.5+ esta llamada es una comprobación y un `return`. Ver `core/light-dark-fallback.ts`.
installLightDarkFallback();

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
