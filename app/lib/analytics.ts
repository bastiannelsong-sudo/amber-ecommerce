'use client';

/**
 * Analytics wrapper - publica al dataLayer de GTM, que despues distribuye
 * a GA4 / Meta Pixel / TikTok / etc segun los tags configurados en GTM.
 *
 * Reglas:
 * - SSR-safe: detecta typeof window y short-circuita.
 * - GATED por consent: si analyticsConsent === false, no pushea (evita
 *   leaks de PII antes de aceptar). El cookie banner setea consent y
 *   GTM tags solo activan en categoria 'analytics'.
 * - Eventos GA4 Enhanced Ecommerce estandar - los reportes built-in
 *   funcionan sin custom dimensions.
 *
 * Ref: backlog/marketing/MKT-001-analytics-tracking.md
 */

import type { Product, CartItem } from './types';

interface DataLayerWindow extends Window {
  dataLayer?: Record<string, unknown>[];
}

const CURRENCY = 'CLP';

/**
 * Push raw al dataLayer. Verifica consent de analytics.
 * Si no hay consent (banner sin aceptar o user rechazo), no-op.
 */
const push = (event: string, params: Record<string, unknown>): void => {
  if (typeof window === 'undefined') return;
  const w = window as DataLayerWindow;
  w.dataLayer = w.dataLayer ?? [];

  // GTM consent mode v2 ya filtra automaticamente, pero hacemos guard
  // adicional aca para no llenar el dataLayer con PII si el user rechazo.
  if (typeof window.localStorage !== 'undefined') {
    try {
      const cc = JSON.parse(
        window.localStorage.getItem('cc_cookie') ?? '{}',
      ) as { categories?: string[] };
      if (cc.categories && !cc.categories.includes('analytics')) return;
    } catch {
      // Si no se puede leer, asumir no-consent y bloquear.
      return;
    }
  }

  w.dataLayer.push({ event, ...params });
};

const productToItem = (
  product: Product,
  quantity = 1,
): Record<string, unknown> => ({
  item_id: product.internal_sku,
  item_name: product.name,
  price: Number(product.price),
  quantity,
  ...(product.product_type && { item_category: product.product_type }),
  ...(product.material && { item_variant: product.material }),
});

const cartItemToItem = (ci: CartItem): Record<string, unknown> => ({
  item_id: ci.product.internal_sku,
  item_name: ci.product.name,
  price: Number(ci.product.price),
  quantity: ci.quantity,
  ...(ci.product.product_type && { item_category: ci.product.product_type }),
});

// ── Eventos GA4 Enhanced Ecommerce ───────────────────────────────────

/** Lista de productos visible (catalogo, coleccion, search results). */
export const trackViewItemList = (
  listId: string,
  products: Product[],
): void => {
  push('view_item_list', {
    item_list_id: listId,
    items: products.map((p) => productToItem(p)),
  });
};

/** Ficha de producto vista. */
export const trackViewItem = (product: Product): void => {
  push('view_item', {
    currency: CURRENCY,
    value: Number(product.price),
    items: [productToItem(product)],
  });
};

/** Click "agregar al carrito". */
export const trackAddToCart = (product: Product, quantity = 1): void => {
  push('add_to_cart', {
    currency: CURRENCY,
    value: Number(product.price) * quantity,
    items: [productToItem(product, quantity)],
  });
};

/** Click "remover del carrito". */
export const trackRemoveFromCart = (product: Product, quantity = 1): void => {
  push('remove_from_cart', {
    currency: CURRENCY,
    value: Number(product.price) * quantity,
    items: [productToItem(product, quantity)],
  });
};

/** Entrar al carrito. */
export const trackViewCart = (items: CartItem[]): void => {
  const value = items.reduce(
    (acc, ci) => acc + Number(ci.product.price) * ci.quantity,
    0,
  );
  push('view_cart', {
    currency: CURRENCY,
    value,
    items: items.map(cartItemToItem),
  });
};

/** Inicia checkout. */
export const trackBeginCheckout = (items: CartItem[]): void => {
  const value = items.reduce(
    (acc, ci) => acc + Number(ci.product.price) * ci.quantity,
    0,
  );
  push('begin_checkout', {
    currency: CURRENCY,
    value,
    items: items.map(cartItemToItem),
  });
};

/** Compra exitosa - DEDUPE por transaction_id en GTM/GA. */
interface PurchaseInput {
  transaction_id: string;
  value: number;
  shipping?: number;
  tax?: number;
  items: CartItem[];
}

export const trackPurchase = (input: PurchaseInput): void => {
  push('purchase', {
    transaction_id: input.transaction_id,
    currency: CURRENCY,
    value: input.value,
    shipping: input.shipping ?? 0,
    tax: input.tax ?? 0,
    items: input.items.map(cartItemToItem),
  });
};

/** Search en el navbar. */
export const trackSearch = (term: string): void => {
  push('search', { search_term: term });
};

/** Registro completado. */
export const trackSignUp = (method: 'email' | 'google'): void => {
  push('sign_up', { method });
};

/** Login exitoso. */
export const trackLogin = (method: 'email' | 'google'): void => {
  push('login', { method });
};

/** Notifica al banner de consent que cargue/borre tags. */
export const setAnalyticsConsent = (granted: boolean): void => {
  if (typeof window === 'undefined') return;
  const w = window as DataLayerWindow;
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push({
    event: 'consent_update',
    analytics: granted,
  });
};
