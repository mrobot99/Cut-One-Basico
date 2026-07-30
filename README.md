# cut-one-basic — landing genérico

Landing público de reservas para los tenants que **no** quieren un diseño a la medida. Un único build
sirve a todos: el tenant se resuelve por subdominio en runtime y todo el contenido —marca, hero,
servicios, barberos, testimonios— sale del API.

Su hermano `projects/pz-personalizado` es lo contrario: un build a la medida de un solo tenant, con su
contenido de marketing quemado en el código. **Un tenant recibe uno de los dos, nunca los dos** —
compiten por la misma ruta `/`.

Diseño y plan de trabajo: [008-rfs-landing-generico](../../makesoft/barbershop/development/008-rfs-landing-generico/README.md).

## Stack

| | |
|---|---|
| Framework | Angular 21 (standalone, **zoneless**, signals) |
| UI | PrimeNG 21 + `@primeuix/themes` (preset Aura) + PrimeIcons |
| Estilos | CSS propio consumiendo las variables del tema. **Sin Tailwind** |
| Tests | Vitest (vía `@angular/build:unit-test`), solo lógica sin UI |
| Lint | angular-eslint 21 |

Angular 21 y no 22 porque el Node por defecto de la máquina de desarrollo es 20.19.0 y no se puede mover
(rompe otras herramientas); Angular 22 exige `^22.22.3 || ^24.15.0 || >=26`.

## Comandos

```bash
npm ci

npm start            # dev server en http://localhost:8082, proxy al backend LOCAL (:58114)
npm run start:staging  # igual, pero el proxy apunta al API de staging
npm run build        # build desplegable (configuración production)
npm run build:dev    # build sin optimizar, útil para inspeccionar el bundle
npm test             # tests de lógica
npm run lint
```

**El puerto 8082 y el proxy no son una comodidad: evitan tocar el backend.**
`Cors:AllowedOrigins` de `appsettings.Staging.json` lista 5173, 8080 y 8081 — no lista 4200 (el puerto
por defecto de Angular) ni 8082. Con el proxy el navegador ve mismo origen y CORS no interviene.

`ng build` **sí hace typecheck**, a diferencia de los dos frontends de Vite del repo.

## Configuración por build

Angular no lee archivos `.env`. La configuración vive en `src/environments/`, intercambiada por
`fileReplacements`:

| Archivo | Cuándo | `production` | `apiUrl` | `devSubdomain` |
|---|---|---|---|---|
| `environment.ts` | `npm start`, `start:staging`, tests | `false` | `''` (proxy) | `cut-test` |
| `environment.production.ts` | `npm run build` | `true` | API de staging | `''` |

`themeKey` es el cuarto campo y está **tipado contra el catálogo de temas**: un valor mal escrito rompe
el build en vez de caer en silencio en un tema por defecto.

Las tres configuraciones del CLI son `development`, `staging` y `production`. `staging` es una
configuración **de `serve`**, no de build: se diferencia de `development` únicamente en a dónde apunta el
proxy (`proxy.staging.conf.json` en vez de `proxy.conf.json`), porque no hay dos APIs desplegados que
distinguir.

## Temas

Un tema es una **paleta**, no un rediseño: `{ primary, surface, colorScheme }`. Se define en
`src/app/theme/themes.ts`, se aplica con `definePreset` sobre Aura, y **se resuelve en un único sitio**,
`resolveTheme()`. Cambiar `themeKey` en el environment cambia toda la aplicación sin tocar un componente.

| Clave | Carácter |
|---|---|
| `noche` | oscuro, monocromo, acento frío (el del mockup) |
| `clasico` | oscuro cálido, dorado sobre piedra |
| `minimal` | claro, un solo acento |

Ese punto único existe para que el día que el tema venga del API (RF-F04, hoy en borrador) sea cambiar
una función y nada más.

**`darkModeSelector` no puede quedarse en su valor por defecto.** Por defecto vale `system`, que se
resuelve a `@media (prefers-color-scheme: dark)`: el aspecto de la landing pasaría a depender del sistema
operativo **del visitante**, y el tema es del tenant. Aquí apunta a la clase `cob-dark`, que estampa
`applyColorScheme()` en `<html>` según el tema activo.

## Rutas

| Ruta | Nota |
|---|---|
| `/` | el landing |
| `/encuesta/:appointmentId` | **no es opcional**: el backend compone ese link a mano (`TransactionalEmails.cs:317`) y lo manda por correo. Quien sirve `/` para un tenant es dueño de esta ruta |
| `**` | no encontrado |

`public/_redirects` reescribe `/*` a `/index.html` con status 200. **Sin él, recargar en
`/encuesta/{id}` da 404** — y ese link, que llega por correo días después de la cita, es la única forma
de entrar a esa ruta.

## Estructura

```
src/
├── environments/          configuración por build
└── app/
    ├── theme/             catálogo de paletas + resolveTheme()  (el punto de extensión)
    ├── core/              cliente HTTP, tenant, locale, imágenes, caché, metadatos
    ├── data/              un servicio singleton por recurso del API
    ├── landing/           las seis secciones de /  + derivación de chips
    ├── booking/           wizard de 4 pasos + aplanado de slots + mapeo de errores
    ├── survey/            /encuesta/:appointmentId
    └── not-found/
```

## Cuatro cosas que muerden

- **El bundle es deliberadamente anónimo.** Cero interceptor de autenticación, cero lectura de tokens,
  cero `withCredentials`. No es poda de código muerto: este landing comparte origen con el panel, así que
  el refresh token del panel vive en el `localStorage` de este origen. Si algún día hay que autenticar
  algo aquí, es un RF, no un `import`.
- **`?subdomain=` lo pone un interceptor**, no cada servicio. En `pz-personalizado` lo concatenan a mano
  los seis servicios y basta olvidarlo una vez para resolver una petición contra el tenant equivocado.
- **La clave de caché `public-settings:` es un contrato con el repo del panel.** El panel borra por
  *prefijo* al guardar branding, sin mirar versión ni subdominio; por eso `STORAGE_VERSION` puede subir
  aquí sin avisar a nadie. Cambiar el prefijo rompe la invalidación **en silencio**.
- **El catálogo se carga una vez, por inyección de dependencias.** Un componente nuevo que necesite
  servicios o barberos **consume la señal existente**; lanzar su propia petición reintroduce la regresión
  que se midió en producción en `pz-personalizado` (dos peticiones por recurso y por carga).

## Datos semilla

`public/seed/*.webp` son los 11 archivos que el aprovisionamiento referencia **por nombre** en base de
datos (`service-fade.webp`). `resolveImage()` los mapea; sin los archivos, un tenant recién aprovisionado
muestra miniaturas rotas y el síntoma no apunta a ninguna parte.
