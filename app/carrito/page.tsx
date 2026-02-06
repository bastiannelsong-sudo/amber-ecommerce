'use client';

import Header from '../components/Header';
import Footer from '../components/Footer';
import { useCartStore } from '../lib/stores/cart.store';
import toast from 'react-hot-toast';

export default function CarritoPage() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotal = useCartStore((state) => state.getTotal());

  const subtotal = getTotal;
  const shipping = subtotal > 50000 ? 0 : 5000;
  const total = subtotal + shipping;

  const handleRemoveItem = (productId: number, name: string) => {
    removeItem(productId);
    toast.success(`${name} eliminado del carrito`);
  };

  return (
    <div className="min-h-screen bg-pearl-50">
      <Header />

      <div className="container mx-auto px-4 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-platinum-600 mb-8">
          <a href="/" className="hover:text-amber-gold-500 transition-colors">Inicio</a>
          <span>/</span>
          <span className="text-obsidian-900">Carrito</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <h1
            className="text-4xl lg:text-5xl font-light text-obsidian-900 mb-2"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            Carrito de Compras
          </h1>
          <p className="text-platinum-600">
            {items.length} {items.length === 1 ? 'producto' : 'productos'}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <svg
              className="w-24 h-24 text-platinum-400 mb-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <h2 className="text-2xl font-light text-obsidian-900 mb-4" style={{ fontFamily: 'var(--font-cormorant)' }}>
              Tu carrito está vacío
            </h2>
            <p className="text-platinum-600 mb-8">Agrega productos para continuar comprando</p>
            <a
              href="/"
              className="px-8 py-3 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors"
            >
              Explorar Productos
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {items.map((item) => (
                <div
                  key={item.product.product_id}
                  className="bg-white p-6 shadow-luxury flex gap-6"
                >
                  {/* Image */}
                  <div className="w-32 h-32 bg-pearl-100 flex-shrink-0 rounded overflow-hidden">
                    <img
                      src={item.product.image_url || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop'}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <a href={`/producto/${item.product.product_id}`}>
                          <h3 className="text-lg font-medium text-obsidian-900 hover:text-amber-gold-600 transition-colors cursor-pointer">
                            {item.product.name}
                          </h3>
                        </a>
                        <p className="text-sm text-platinum-600 mt-1">
                          SKU: {item.product.internal_sku}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.product.product_id, item.product.name)}
                        className="text-platinum-600 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-end justify-between mt-auto">
                      {/* Quantity */}
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-platinum-600">Cantidad:</span>
                        <div className="flex items-center border border-pearl-300">
                          <button
                            onClick={() => updateQuantity(item.product.product_id, item.quantity - 1)}
                            className="px-4 py-2 hover:bg-pearl-100 transition-colors"
                          >
                            -
                          </button>
                          <span className="px-6 py-2 border-x border-pearl-300">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.product_id, item.quantity + 1)}
                            className="px-4 py-2 hover:bg-pearl-100 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="text-lg font-medium text-obsidian-900">
                          ${((item.product.price || 0) * item.quantity).toLocaleString('es-CL')}
                        </p>
                        <p className="text-sm text-platinum-600">
                          ${item.product.price?.toLocaleString('es-CL')} c/u
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Clear Cart Button */}
              <button
                onClick={() => {
                  clearCart();
                  toast.success('Carrito vacía');
                }}
                className="text-sm text-platinum-600 hover:text-red-500 transition-colors uppercase tracking-wide"
              >
                Vaciar Carrito
              </button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 shadow-luxury sticky top-24">
                <h2
                  className="text-2xl font-light text-obsidian-900 mb-6 pb-4 border-b border-pearl-200"
                  style={{ fontFamily: 'var(--font-cormorant)' }}
                >
                  Resumen del Pedido
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-platinum-600">Subtotal</span>
                    <span className="text-obsidian-900">${subtotal.toLocaleString('es-CL')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-platinum-600">Envío</span>
                    <span className="text-obsidian-900">
                      {shipping === 0 ? 'Gratis' : `$${shipping.toLocaleString('es-CL')}`}
                    </span>
                  </div>
                  {shipping === 0 && (
                    <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                      ✓ Envío gratuito aplicado
                    </div>
                  )}
                  {shipping > 0 && (
                    <div className="text-xs text-platinum-600 bg-pearl-100 p-2 rounded">
                      Agrega ${(50000 - subtotal).toLocaleString('es-CL')} más para envío gratis
                    </div>
                  )}
                </div>

                <div className="border-t border-pearl-200 pt-4 mb-6">
                  <div className="flex justify-between text-lg font-medium">
                    <span className="text-obsidian-900">Total</span>
                    <span className="text-obsidian-900">${total.toLocaleString('es-CL')}</span>
                  </div>
                </div>

                <a
                  href="/checkout"
                  className="block w-full py-4 bg-obsidian-900 text-white text-center text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors mb-4"
                >
                  Finalizar Compra
                </a>

                <a
                  href="/"
                  className="block w-full py-4 border-2 border-obsidian-900 text-obsidian-900 text-center text-sm uppercase tracking-widest font-medium hover:bg-obsidian-900 hover:text-white transition-colors"
                >
                  Continuar Comprando
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
