'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '../lib/stores/cart.store';
import { useWishlistStore } from '../lib/stores/wishlist.store';
import ScarcityIndicator from './marketing/ScarcityIndicator';
import TrustBadges from './marketing/TrustBadges';
import type { Product } from '../lib/types';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
  hoverImage?: string;
  isNew?: boolean;
}

export default function ProductCard({
  product,
  hoverImage,
  isNew = false,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const addToCart = useCartStore((state) => state.addItem);
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const isInWishlist = useWishlistStore((state) => state.isInWishlist(product.product_id));

  const { name, price, image_url: image, category, stock } = product;

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image container */}
      <Link
        href={`/producto/${product.product_id}`}
        className="block relative aspect-[3/4] bg-pearl-100 overflow-hidden mb-3 sm:mb-5 cursor-pointer"
      >
        {/* Main image */}
        <Image
          src={image}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className={`object-cover transition-all duration-700 ${
            isHovered && hoverImage ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
          }`}
        />

        {/* Hover image */}
        {hoverImage && (
          <Image
            src={hoverImage}
            alt={`${name} - Vista alternativa`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className={`absolute inset-0 object-cover transition-all duration-700 ${
              isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
          />
        )}

        {/* New badge */}
        {isNew && (
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-obsidian-900 text-white px-2 py-1 sm:px-3 sm:py-1.5 text-[9px] sm:text-[10px] uppercase tracking-[0.15em] font-medium">
            Nuevo
          </div>
        )}

        {/* Scarcity badge on image */}
        {stock <= 5 && stock > 0 && (
          <div className="absolute bottom-14 left-4 z-10">
            <ScarcityIndicator stock={stock} compact />
          </div>
        )}

        {/* Quick add button - shows on hover */}
        <div
          className={`absolute bottom-0 left-0 right-0 p-4 transition-all duration-300 z-10 ${
            isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToCart(product, 1);
              toast.success(`${product.name} agregado al carrito`);
            }}
            disabled={stock === 0}
            className="w-full bg-obsidian-900/95 backdrop-blur-sm text-white py-3.5 text-[11px] uppercase tracking-[0.15em] font-medium hover:bg-amber-gold-500 transition-colors duration-300 cursor-pointer disabled:bg-platinum-400 disabled:cursor-not-allowed"
          >
            {stock === 0 ? 'Agotado' : 'Agregar al Carrito'}
          </button>
        </div>

        {/* Wishlist button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
            toast.success(isInWishlist ? 'Eliminado de favoritos' : 'Agregado a favoritos');
          }}
          aria-label="Agregar a favoritos"
          className={`absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full transition-all duration-300 z-10 cursor-pointer ${
            isHovered || isInWishlist ? 'opacity-100 scale-100' : 'sm:opacity-0 sm:scale-90 opacity-70'
          }`}
        >
          <svg
            className={`w-4 h-4 transition-colors ${
              isInWishlist
                ? 'text-amber-gold-500 fill-current'
                : 'text-obsidian-900 hover:text-amber-gold-500'
            }`}
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
        </button>
      </Link>

      {/* Product info */}
      <div className="text-center space-y-1">
        <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-platinum-500 font-medium">
          {category?.name || 'Joyeria'}
        </p>

        <Link href={`/producto/${product.product_id}`} className="cursor-pointer">
          <h3
            className="text-sm sm:text-lg text-obsidian-900 font-light group-hover:text-amber-gold-600 transition-colors duration-300 line-clamp-2"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            {name}
          </h3>
        </Link>

        <p className="text-xs sm:text-sm font-medium text-obsidian-900 tracking-wide">
          ${price?.toLocaleString('es-CL') || '0'}
        </p>

        {/* Trust badges compact */}
        <div className="pt-1 flex justify-center">
          <TrustBadges layout="compact" />
        </div>
      </div>
    </div>
  );
}
