import { environment } from '../../environments/environment';
import { DARK_MODE_CLASS, THEMES, type ThemeDescriptor } from './themes';

/**
 * El único punto del código que decide qué tema está activo (RF-G01 §5 RN-02).
 *
 * Hoy lee `environment.themeKey`, y **ningún otro archivo lo lee**. Es lo que hace que la decisión 2
 * de la serie sea cierta y no una aspiración: el día que el tema venga del API (RF-F04 revivido,
 * `appearance` de vuelta en el backend) cambia esta función y nada más. `@primeuix/themes` expone
 * `updatePrimaryPalette` / `updateSurfacePalette` / `updatePreset` para reaplicar en runtime, así que
 * ese camino ya está abierto sin reestructurar nada — pero no se recorre aquí.
 */
export function resolveTheme(): ThemeDescriptor {
  return THEMES[environment.themeKey];
}

/**
 * Estampa (o no) la clase de modo oscuro en `<html>`.
 *
 * Con el tema en claro no se añade nada y PrimeNG emite `color-scheme: light` en `:root`, así que la
 * preferencia del sistema operativo del visitante no interviene en ninguno de los dos casos (RN-01).
 */
export function applyColorScheme(theme: ThemeDescriptor, root: HTMLElement): void {
  root.classList.toggle(DARK_MODE_CLASS, theme.colorScheme === 'dark');
}
