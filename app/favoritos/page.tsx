'use client';

import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { useWishlistStore } from '../lib/stores/wishlist.store';

export default function FavoritosPage() {
  const items = useWishlistStore((state) => state.items);
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);

  return (
    <div className="min-h-screen bg-pearl-50">
      <Header />

      <div className="container mx-auto px-4 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1
              className="text-4xl lg:text-5xl font-light text-obsidian-900 mb-2"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Mis Favoritos
            </h1>
            <p className="text-platinum-600">
              {items.length} {items.length === 1 ? 'producto' : 'productos'}
            </p>
          </div>

          {items.length > 0 && (
            <button
              onClick={clearWishlist}
              className="text-sm text-platinum-600 hover:text-red-500 transition-colors uppercase tracking-wide"
            >
              Limpiar Todo
            </button>
          )}
        </div>

        {/* Products Grid */}
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
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h2 className="text-2xl font-light text-obsidian-900 mb-4" style={{ fontFamily: 'var(--font-cormorant)' }}>
              No tienes favoritos
            </h2>
            <p className="text-platinum-600 mb-8">Agrega productos para verlos aquí</p>
            <a
              href="/"
              className="px-8 py-3 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors"
            >
              Explorar Productos
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {items.map((item) => (
              <ProductCard
                key={item.product.product_id}
                product={item.product}
                isNew={false}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
