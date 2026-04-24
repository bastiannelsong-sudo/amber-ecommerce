'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import ScarcityIndicator from './marketing/ScarcityIndicator';
import { useCartStore } from '../lib/stores/cart.store';
import type { Product } from '../lib/types';

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
  const addItem = useCartStore((state) => state.addItem);

  const { display_name, name: rawName, price, compare_at_price, image_url, category, stock } = product;
  const name = display_name || rawName;
  // Upgrade MercadoLibre images from thumbnail (-O) to full size (-F)
  const rawImage = image_url || '/placeholder-product.svg';
  const image = rawImage.replace(/-O\.jpg$/, '-F.jpg');
  const hasDiscount = compare_at_price && Number(compare_at_price) > Number(price);
  const discountPercent = hasDiscount
    ? Math.round((1 - Number(price) / Number(compare_at_price)) * 100)
    : 0;

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image container */}
      <div className="relative aspect-square bg-white overflow-hidden mb-3 sm:mb-5">
        <Link
          href={`/producto/${product.slug || product.product_id}`}
          className="block absolute inset-0 cursor-pointer"
        >
          {/* Main image */}
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className={`object-contain p-2 transition-all duration-700 ${
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
              className={`absolute inset-0 object-contain p-2 transition-all duration-700 ${
                isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
            />
          )}
        </Link>

        {/* Badges */}
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex flex-col gap-1.5 pointer-events-none z-10">
          {isNew && (
            <div className="bg-obsidian-900 text-white px-2 py-1 sm:px-3 sm:py-1.5 text-[9px] sm:text-[10px] uppercase tracking-[0.15em] font-medium">
              Nuevo
            </div>
          )}
          {hasDiscount && (
            <div className="bg-amber-gold-500 text-obsidian-900 px-2 py-1 sm:px-3 sm:py-1.5 text-[9px] sm:text-[10px] uppercase tracking-[0.15em] font-bold">
              -{discountPercent}%
            </div>
          )}
        </div>

        {/* Scarcity badge */}
        {stock <= 5 && stock > 0 && (
          <div className="absolute bottom-14 left-4 z-10 pointer-events-none">
            <ScarcityIndicator stock={stock} compact />
          </div>
        )}

        {/* Quick Add to Cart button - desktop-only, shows on hover.
            Hidden on mobile because there's no hover and tapping an invisible
            button feels broken (ghost-tap). Mobile users tap the card to open
            the product page and add from there. */}
        <div
          className={`hidden md:block absolute bottom-0 left-0 right-0 p-4 transition-all duration-300 z-10 ${
            isHovered
              ? 'translate-y-0 opacity-100 pointer-events-auto'
              : 'translate-y-4 opacity-0 pointer-events-none'
          }`}
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (stock > 0) {
                addItem(product, 1);
                toast.success(`${name} agregado al carrito`);
              }
            }}
            disabled={stock === 0}
            className={`w-full flex items-center justify-center gap-2 py-3.5 text-[11px] uppercase tracking-[0.15em] font-medium transition-colors duration-300 ${
              stock === 0
                ? 'bg-platinum-300 text-platinum-500 cursor-not-allowed'
                : 'bg-obsidian-900 text-white hover:bg-amber-gold-500 cursor-pointer'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            {stock === 0 ? 'Agotado' : 'Agregar al Carrito'}
          </button>
        </div>
      </div>

      {/* Product info */}
      <div className="text-center space-y-1">
        <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-platinum-500 font-medium">
          {category?.name || 'Joyeria'}
        </p>

        <Link href={`/producto/${product.slug || product.product_id}`} className="cursor-pointer">
          <h3
            className="text-sm sm:text-lg text-obsidian-900 font-light group-hover:text-amber-gold-600 transition-colors duration-300 line-clamp-2"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            {name}
          </h3>
        </Link>

        <div className="flex items-center justify-center gap-2">
          <p className="text-xs sm:text-sm font-medium text-obsidian-900 tracking-wide">
            ${Math.round(Number(price) || 0).toLocaleString('es-CL')}
          </p>
          {hasDiscount && (
            <p className="text-[10px] sm:text-xs text-platinum-500 line-through">
              ${Math.round(Number(compare_at_price)).toLocaleString('es-CL')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
