import Image from 'next/image';

interface ProductCardImageProps {
  src: string;
  alt: string;
  fallback?: string;
  className?: string;
}

export function ProductCardImage({ src, alt, fallback = '/placeholder-product.svg', className }: ProductCardImageProps) {
  const resolvedSrc = src || fallback;

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      className={`object-contain p-2 ${className ?? ''}`}
    />
  );
}
