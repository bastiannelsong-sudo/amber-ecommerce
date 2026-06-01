/**
 * Tests para la página de comprobante de orden.
 *
 * 6.3 — Verifica que el STATUS_LABEL local no cubre los estados
 * authorized, payment_in_process, payment_pending, charged_back,
 * y que el mapeo canónico de order-status.ts los cubre correctamente.
 *
 * RED: el test verifica la lógica del mapeo público. Una vez que
 * page.tsx use getOrderStatusMeta() en lugar de STATUS_LABEL local,
 * la página mostrará los labels correctos para esos estados.
 */

import { describe, it, expect } from 'vitest';
import { getOrderStatusMeta } from '../../lib/order-status';

// Los estados que el STATUS_LABEL local NO cubre
// (muestra el string interno crudo en lugar del label público).
const UNCOVERED_BY_LOCAL_MAP = [
  'authorized',
  'payment_in_process',
  'payment_pending',
  'charged_back',
] as const;

// Los estados que el STATUS_LABEL local SÍ cubre.
const COVERED_BY_LOCAL_MAP = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const;

describe('getOrderStatusMeta — mapeo canónico de order-status.ts', () => {
  describe('estados que el STATUS_LABEL local dejaba sin cubrir', () => {
    it.each(UNCOVERED_BY_LOCAL_MAP)(
      'para status "%s" devuelve un label que NO es el string crudo del status',
      (status) => {
        const meta = getOrderStatusMeta(status);
        // El label nunca debe ser el string crudo del status interno.
        expect(meta.label).not.toBe(status);
        // El label debe ser un string no vacío.
        expect(meta.label.trim().length).toBeGreaterThan(0);
        // El label no debe ser el fallback "Estado desconocido"
        // (el mapeo canónico debe cubrir estos estados explícitamente).
        expect(meta.label).not.toBe('Estado desconocido');
      },
    );
  });

  describe('estados básicos que el STATUS_LABEL local sí cubría', () => {
    it.each(COVERED_BY_LOCAL_MAP)(
      'para status "%s" devuelve un label no vacío y no crudo',
      (status) => {
        const meta = getOrderStatusMeta(status);
        expect(meta.label).not.toBe(status);
        expect(meta.label.trim().length).toBeGreaterThan(0);
      },
    );
  });

  it('cubre los 11 estados internos del backend', () => {
    const ALL_STATUSES = [
      'pending',
      'payment_in_process',
      'payment_pending',
      'authorized',
      'paid',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
      'charged_back',
    ];

    for (const status of ALL_STATUSES) {
      const meta = getOrderStatusMeta(status);
      // Ninguno debe mostrar el string crudo ni el fallback genérico.
      expect(meta.label).not.toBe(status);
      expect(meta.label).not.toBe('Estado desconocido');
      // El badge debe tener clases CSS definidas.
      expect(meta.badge.trim().length).toBeGreaterThan(0);
    }
  });

  it('authorized → label es "En preparación" (no el string crudo)', () => {
    const meta = getOrderStatusMeta('authorized');
    expect(meta.label).toBe('En preparación');
  });

  it('charged_back → label es "En revisión" (no el string crudo)', () => {
    const meta = getOrderStatusMeta('charged_back');
    expect(meta.label).toBe('En revisión');
  });

  it('payment_in_process → label es "Procesando pago" (no el string crudo)', () => {
    const meta = getOrderStatusMeta('payment_in_process');
    expect(meta.label).toBe('Procesando pago');
  });

  it('payment_pending → label es "Esperando pago" (no el string crudo)', () => {
    const meta = getOrderStatusMeta('payment_pending');
    expect(meta.label).toBe('Esperando pago');
  });
});

/**
 * 6.3 — Verifica que el STATUS_LABEL local (el que page.tsx tenía antes
 * de este fix) NO cubre esos 4 estados. Este test documenta el problema
 * que fue corregido.
 *
 * Nota: después del fix, page.tsx ya no tiene STATUS_LABEL local, así
 * que este test verifica el comportamiento del mapeo viejo directamente.
 */
describe('STATUS_LABEL local — documentación del problema original', () => {
  // Reproduce el objeto STATUS_LABEL que existía en page.tsx antes del fix.
  const STATUS_LABEL_LOCAL: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Pendiente de pago', cls: 'bg-amber-gold-100 text-amber-gold-800' },
    paid: { label: 'Pagado', cls: 'bg-green-100 text-green-800' },
    processing: { label: 'En preparación', cls: 'bg-blue-100 text-blue-800' },
    shipped: { label: 'Enviado', cls: 'bg-blue-100 text-blue-800' },
    delivered: { label: 'Entregado', cls: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelado', cls: 'bg-red-100 text-red-800' },
    refunded: { label: 'Reembolsado', cls: 'bg-platinum-200 text-platinum-700' },
  };

  it('el STATUS_LABEL local NO cubría "authorized" → mostraba string crudo', () => {
    // Así se usaba en page.tsx: STATUS_LABEL[order.status]?.label ?? order.status
    const label = STATUS_LABEL_LOCAL['authorized']?.label ?? 'authorized';
    // Confirma que el valor de fallback era el string crudo.
    expect(label).toBe('authorized');
  });

  it('el STATUS_LABEL local NO cubría "charged_back" → mostraba string crudo', () => {
    const label = STATUS_LABEL_LOCAL['charged_back']?.label ?? 'charged_back';
    expect(label).toBe('charged_back');
  });

  it('el STATUS_LABEL local NO cubría "payment_in_process" → mostraba string crudo', () => {
    const label = STATUS_LABEL_LOCAL['payment_in_process']?.label ?? 'payment_in_process';
    expect(label).toBe('payment_in_process');
  });

  it('el STATUS_LABEL local NO cubría "payment_pending" → mostraba string crudo', () => {
    const label = STATUS_LABEL_LOCAL['payment_pending']?.label ?? 'payment_pending';
    expect(label).toBe('payment_pending');
  });
});
