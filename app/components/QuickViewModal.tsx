'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../lib/stores/cart.store';
import { useWishlistStore } from '../lib/stores/wishlist.store';
import type { Product } from '../lib/types';
import toast from 'react-hot-toast';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const addToCart = useCartStore((state) => state.addItem);
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const isInWishlist = useWishlistStore((state) =>
    product ? state.isInWishlist(product.product_id) : false
  );

  if (!product || !isOpen) return null;

  const images = product.images && product.images.length > 0
    ? product.images
    : [product.image_url || ''];

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast.success(`${product.name} agregado al carrito`);
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product);
    toast.success(isInWishlist ? 'Eliminado de favoritos' : 'Agregado a favoritos');
  };

  const handleViewFull = () => {
    window.location.href = `/producto/${product.product_id}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white w-full max-w-5xl rounded-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Image Gallery */}
            <div className="relative bg-pearl-50 p-8">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-lg hover:bg-pearl-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Main Image */}
              <div className="aspect-square bg-white rounded-lg overflow-hidden mb-4 shadow-md">
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded overflow-hidden border-2 transition-all ${
                        selectedImage === index
                          ? 'border-amber-gold-500'
                          : 'border-pearl-200 hover:border-amber-gold-300'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} - Vista ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-8 flex flex-col">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest text-platinum-600 mb-2">
                  {product.category?.name || 'Joyería'}
                </p>
                <h2
                  className="text-3xl lg:text-4xl font-light text-obsidian-900 mb-4"
                  style={{ fontFamily: 'var(--font-cormorant)' }}
                >
                  {product.name}
                </h2>

                <p className="text-2xl font-medium text-obsidian-900 mb-6">
                  ${product.price?.toLocaleString('es-CL')}
                </p>

                <p className="text-platinum-700 leading-relaxed mb-6">
                  Pieza única de joyería artesanal. Cada detalle ha sido cuidadosamente
                  elaborado para garantizar la más alta calidad y elegancia.
                </p>

                {/* Stock Info */}
                <div className="flex items-center gap-2 mb-6">
                  {product.stock > 0 ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm text-obsidian-700">
                        {product.stock} unidades disponibles
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="text-sm text-red-600">Agotado</span>
                    </>
                  )}
                </div>

                {/* Quantity Selector */}
                {product.stock > 0 && (
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-sm uppercase tracking-wide text-obsidian-700">
                      Cantidad:
                    </span>
                    <div className="flex items-center border border-pearl-300">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-4 py-2 hover:bg-pearl-100 transition-colors"
                      >
                        -
                      </button>
                      <span className="px-6 py-2 border-x border-pearl-300">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        className="px-4 py-2 hover:bg-pearl-100 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3 mb-6">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className="w-full py-4 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors disabled:bg-platinum-400 disabled:cursor-not-allowed"
                  >
                    {product.stock > 0 ? 'Agregar al Carrito' : 'Agotado'}
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleToggleWishlist}
                      className="py-3 border-2 border-obsidian-900 text-obsidian-900 text-sm uppercase tracking-widest font-medium hover:bg-obsidian-900 hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                      <svg
                        className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`}
                        fill={isInWishlist ? 'currentColor' : 'none'}
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
                      {isInWishlist ? 'En Favoritos' : 'Favoritos'}
                    </button>

                    <button
                      onClick={handleViewFull}
                      className="py-3 border border-platinum-400 text-platinum-700 text-sm uppercase tracking-wide font-medium hover:border-obsidian-900 hover:text-obsidian-900 transition-colors"
                    >
                      Ver Detalles
                    </button>
                  </div>
                </div>

                {/* Product Details */}
                <div className="border-t border-pearl-200 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-platinum-600">SKU:</span>
                    <span className="text-obsidian-900 font-medium">{product.internal_sku}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-platinum-600">Material:</span>
                    <span className="text-obsidian-900">Oro 18k</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-platinum-600">Garantía:</span>
                    <span className="text-obsidian-900">12 meses</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
