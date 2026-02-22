import type { Product } from './types';

export const WHATSAPP_NUMBER = '56932897499';

/** Genera URL de WhatsApp con mensaje pre-armado para un producto */
export function buildProductWhatsAppUrl(product: Product, quantity: number = 1): string {
  const name = product.display_name || product.name;
  const price = Math.round(Number(product.price) || 0).toLocaleString('es-CL');
  const lines = [
    `Hola! Me interesa este producto de AMBER Joyas:`,
    `*${name}*`,
    `Precio: $${price}`,
    `Cantidad: ${quantity}`,
    `SKU: ${product.internal_sku}`,
    ``,
    `Me pueden dar mas informacion?`,
  ];
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
}

/** Genera URL de WhatsApp con mensaje generico */
export function buildWhatsAppUrl(message?: string): string {
  const text = message || 'Hola! Me comunico desde la web de AMBER Joyas.';
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
