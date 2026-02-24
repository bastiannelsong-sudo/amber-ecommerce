import { describe, it, expect } from 'vitest';
import {
  buildProductWhatsAppUrl,
  buildWhatsAppUrl,
  buildCartWhatsAppUrl,
  WHATSAPP_NUMBER,
} from './whatsapp';
import type { Product } from './types';

const mockProduct: Product = {
  product_id: 1,
  internal_sku: 'AMB-COL-001',
  name: 'Collar Punto de Luz',
  stock: 10,
  stock_bodega: 5,
  cost: 15000,
  price: 29990,
  image_url: 'https://images.unsplash.com/test',
};

describe('WhatsApp helpers', () => {
  describe('WHATSAPP_NUMBER', () => {
    it('should be a valid Chilean number', () => {
      expect(WHATSAPP_NUMBER).toMatch(/^569\d{8}$/);
    });
  });

  describe('buildProductWhatsAppUrl', () => {
    it('should generate a valid WhatsApp URL with correct base', () => {
      const url = buildProductWhatsAppUrl(mockProduct);
      expect(url).toMatch(new RegExp(`^https://wa\\.me/${WHATSAPP_NUMBER}\\?text=`));
    });

    it('should include all message lines', () => {
      const url = buildProductWhatsAppUrl(mockProduct);
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain('Hola! Me interesa este producto de AMBER Joyas:');
      expect(decoded).toContain('*Collar Punto de Luz*');
      expect(decoded).toContain('Precio: $29.990');
      expect(decoded).toContain('Cantidad: 1');
      expect(decoded).toContain('SKU: AMB-COL-001');
      expect(decoded).toContain('Me pueden dar mas informacion?');
    });

    it('should default to quantity 1', () => {
      const url = buildProductWhatsAppUrl(mockProduct);
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain('Cantidad: 1');
    });

    it('should use custom quantity', () => {
      const url = buildProductWhatsAppUrl(mockProduct, 3);
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain('Cantidad: 3');
      expect(decoded).not.toContain('Cantidad: 1');
    });

    it('should use display_name over name when available', () => {
      const product = { ...mockProduct, display_name: 'Collar Especial' };
      const url = buildProductWhatsAppUrl(product);
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain('*Collar Especial*');
      expect(decoded).not.toContain('*Collar Punto de Luz*');
    });

    it('should fall back to name when display_name is absent', () => {
      const url = buildProductWhatsAppUrl(mockProduct);
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain('*Collar Punto de Luz*');
    });

    it('should format price with Math.round and locale', () => {
      const product = { ...mockProduct, price: 29990.7 };
      const url = buildProductWhatsAppUrl(product);
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain('Precio: $29.991');
    });

    it('should handle price as 0', () => {
      const product = { ...mockProduct, price: 0 };
      const url = buildProductWhatsAppUrl(product);
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain('Precio: $0');
    });
  });

  describe('buildWhatsAppUrl', () => {
    it('should generate URL with full default message when no arg', () => {
      const url = buildWhatsAppUrl();
      const decoded = decodeURIComponent(url);
      expect(decoded).toBe(
        `https://wa.me/${WHATSAPP_NUMBER}?text=Hola! Me comunico desde la web de AMBER Joyas.`
      );
    });

    it('should generate URL with custom message', () => {
      const url = buildWhatsAppUrl('Hola, necesito ayuda');
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain('Hola, necesito ayuda');
      expect(decoded).not.toContain('AMBER Joyas');
    });

    it('should use custom message over default when provided', () => {
      const url = buildWhatsAppUrl('Consulta especifica');
      const decoded = decodeURIComponent(url);
      expect(decoded).toBe(
        `https://wa.me/${WHATSAPP_NUMBER}?text=Consulta especifica`
      );
    });
  });

  describe('buildCartWhatsAppUrl', () => {
    it('should include formatted item lines with prices', () => {
      const items = [
        { name: 'Collar Punto de Luz', quantity: 2, price: 29990 },
        { name: 'Aros Plata 925', quantity: 1, price: 19990 },
      ];
      const total = 29990 * 2 + 19990;

      const url = buildCartWhatsAppUrl(items, total);
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain('Hola! Quiero realizar el siguiente pedido desde AMBER Joyas:');
      expect(decoded).toContain('- *Collar Punto de Luz* x2 — $59.980');
      expect(decoded).toContain('- *Aros Plata 925* x1 — $19.990');
      expect(decoded).toContain('*Total: $79.970*');
      expect(decoded).toContain('Quedo atenta a la confirmacion!');
    });

    it('should format total with Math.round and locale', () => {
      const items = [{ name: 'Test', quantity: 1, price: 9999.5 }];
      const url = buildCartWhatsAppUrl(items, 9999.5);
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain('*Total: $10.000*');
    });

    it('should handle empty cart', () => {
      const url = buildCartWhatsAppUrl([], 0);
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain('*Total: $0*');
      expect(decoded).toContain('Quedo atenta a la confirmacion!');
    });

    it('should generate correct base URL', () => {
      const url = buildCartWhatsAppUrl([], 0);
      expect(url).toMatch(new RegExp(`^https://wa\\.me/${WHATSAPP_NUMBER}\\?text=`));
    });
  });
});
