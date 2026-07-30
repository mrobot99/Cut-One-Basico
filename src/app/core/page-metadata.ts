import type { Branding } from '../data/branding';

/**
 * RF-G02 §8. Corrige lo que el visitante SÍ puede ver de un shell único servido a todos los
 * subdominios: la pestaña del navegador y el favicon.
 *
 * Las etiquetas Open Graph no se pueden corregir así y no se intenta: los crawlers de WhatsApp y
 * Facebook no ejecutan JavaScript, leen el HTML estático (decisión 16 de la serie).
 */
export function applyPageMetadata(branding: Branding, doc: Document = document): void {
  if (branding.shop_name) {
    doc.title = branding.shop_name;
  }

  if (branding.logo_url) {
    const icons = doc.querySelectorAll<HTMLLinkElement>(
      "link[rel='icon'], link[rel='apple-touch-icon']",
    );
    icons.forEach((icon) => {
      icon.href = branding.logo_url;
    });
  }
}
