/**
 * CARTUI-ATOM-2 — next/image wrapper with fallback on missing src.
 * Zero store/hook imports: pure presentational atom.
 */
import Image from 'next/image';

const FALLBACK_URL =
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop';

export interface CartItemImageProps {
  src: string | undefined;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export function CartItemImage({ src, alt, width, height, className }: CartItemImageProps) {
  const resolvedSrc = src || FALLBACK_URL;

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  );
}
