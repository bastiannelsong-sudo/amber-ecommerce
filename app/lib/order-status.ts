/**
 * Centraliza la metadata de estados de orden para la UI del cliente.
 *
 * - El backend persiste el status en inglés (ver amber-back/src/ecommerce/domain/order-status.ts).
 * - Acá traducimos al castellano + agregamos copy contextual + estilos del badge.
 * - Usar `getOrderStatusMeta(status)` en cualquier render de orden visible al cliente.
 */

export interface OrderStatusMeta {
  /** Label corto del badge ("Pagado", "En preparación"). */
  label: string;
  /** Frase descriptiva para mostrar bajo el título: "Estamos preparando…". */
  description: string;
  /** Tailwind classes del badge (bg + text). */
  badge: string;
  /** Color base para el timeline visual (clase Tailwind sin prefix). */
  accentColor: 'amber' | 'blue' | 'indigo' | 'green' | 'red' | 'gray';
  /** Posición en el timeline (0 = inicio, 4 = entregado). null = fuera de track normal. */
  step: 0 | 1 | 2 | 3 | 4 | null;
  /** True si el estado es terminal (final, no avanza más). */
  isTerminal: boolean;
}

const META: Record<string, OrderStatusMeta> = {
  pending: {
    label: 'Pago pendiente',
    description: 'Estamos esperando que MercadoPago confirme tu pago.',
    badge: 'bg-amber-100 text-amber-800',
    accentColor: 'amber',
    step: 0,
    isTerminal: false,
  },
  payment_in_process: {
    label: 'Procesando pago',
    description: 'Tu pago está siendo procesado por MercadoPago.',
    badge: 'bg-amber-100 text-amber-800',
    accentColor: 'amber',
    step: 0,
    isTerminal: false,
  },
  payment_pending: {
    label: 'Esperando pago',
    description: 'Tu pago quedó pendiente. Si pagaste con efectivo, espera la confirmación.',
    badge: 'bg-amber-100 text-amber-800',
    accentColor: 'amber',
    step: 0,
    isTerminal: false,
  },
  paid: {
    label: 'Pago confirmado',
    description: 'Recibimos tu pago. Estamos por preparar tu pedido.',
    badge: 'bg-blue-100 text-blue-800',
    accentColor: 'blue',
    step: 1,
    isTerminal: false,
  },
  processing: {
    label: 'Preparando tu pedido',
    description: 'Estamos empacando tu pedido con cuidado. En 1 día hábil sale a despacho.',
    badge: 'bg-indigo-100 text-indigo-800',
    accentColor: 'indigo',
    step: 2,
    isTerminal: false,
  },
  shipped: {
    label: 'En camino',
    description: 'Tu pedido ya salió. Llega entre 1 y 5 días hábiles según tu región.',
    badge: 'bg-indigo-100 text-indigo-800',
    accentColor: 'indigo',
    step: 3,
    isTerminal: false,
  },
  delivered: {
    label: 'Entregado',
    description: 'Tu pedido llegó. Esperamos que disfrutes tu joya.',
    badge: 'bg-green-100 text-green-800',
    accentColor: 'green',
    step: 4,
    isTerminal: true,
  },
  cancelled: {
    label: 'Cancelado',
    description: 'Esta orden fue cancelada. Si pagaste, el reembolso ya está en proceso.',
    badge: 'bg-red-100 text-red-800',
    accentColor: 'red',
    step: null,
    isTerminal: true,
  },
  refunded: {
    label: 'Reembolsado',
    description: 'Te devolvimos el dinero. Aparece en tu cuenta en 3-10 días hábiles según el banco.',
    badge: 'bg-gray-200 text-gray-700',
    accentColor: 'gray',
    step: null,
    isTerminal: true,
  },
  charged_back: {
    label: 'En revisión',
    description: 'Tu pago está en revisión por contracargo. Te contactaremos para resolverlo.',
    badge: 'bg-red-100 text-red-800',
    accentColor: 'red',
    step: null,
    isTerminal: false,
  },
};

const FALLBACK: OrderStatusMeta = {
  label: 'Estado desconocido',
  description: 'No pudimos identificar el estado de esta orden. Contactanos si tenés dudas.',
  badge: 'bg-gray-100 text-gray-700',
  accentColor: 'gray',
  step: null,
  isTerminal: false,
};

export function getOrderStatusMeta(status: string): OrderStatusMeta {
  return META[status] ?? FALLBACK;
}

/** Steps del timeline visual (4 pasos visibles para el cliente). */
export const TIMELINE_STEPS = [
  { id: 'paid', label: 'Pago confirmado', step: 1 as const },
  { id: 'processing', label: 'Preparando', step: 2 as const },
  { id: 'shipped', label: 'En camino', step: 3 as const },
  { id: 'delivered', label: 'Entregado', step: 4 as const },
] as const;
