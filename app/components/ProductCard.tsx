'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ScarcityIndicator from './marketing/ScarcityIndicator';
import { buildProductWhatsAppUrl } from '../lib/whatsapp';
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

  const { display_name, name: rawName, price, image_url, category, stock } = product;
  const name = display_name || rawName;
  // Upgrade MercadoLibre images from thumbnail (-O) to full size (-F)
  const rawImage = image_url || '/placeholder-product.svg';
  const image = rawImage.replace(/-O\.jpg$/, '-F.jpg');

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

        {/* New badge */}
        {isNew && (
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-obsidian-900 text-white px-2 py-1 sm:px-3 sm:py-1.5 text-[9px] sm:text-[10px] uppercase tracking-[0.15em] font-medium pointer-events-none">
            Nuevo
          </div>
        )}

        {/* Scarcity badge */}
        {stock <= 5 && stock > 0 && (
          <div className="absolute bottom-14 left-4 z-10 pointer-events-none">
            <ScarcityIndicator stock={stock} compact />
          </div>
        )}

        {/* Quick WhatsApp button - shows on hover */}
        <div
          className={`absolute bottom-0 left-0 right-0 p-4 transition-all duration-300 z-10 ${
            isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <a
            href={buildProductWhatsAppUrl(product)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-3.5 text-[11px] uppercase tracking-[0.15em] font-medium hover:bg-[#20BD5A] transition-colors duration-300 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {stock === 0 ? 'Consultar Disponibilidad' : 'Consultar'}
          </a>
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

        <p className="text-xs sm:text-sm font-medium text-obsidian-900 tracking-wide">
          ${Math.round(Number(price) || 0).toLocaleString('es-CL')}
        </p>
      </div>
    </div>
  );
}
