'use client';

import { useState, useRef, MouseEvent } from 'react';

interface ZoomLensProps {
  imageSrc: string;
  alt?: string;
  zoomLevel?: number;
  className?: string;
}

export default function ZoomLens({ imageSrc, alt = 'Product', zoomLevel = 2, className = '' }: ZoomLensProps) {
  const [isZooming, setIsZooming] = useState(false);
  const [backgroundPosition, setBackgroundPosition] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setBackgroundPosition({ x, y });
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main image container */}
      <div
        ref={containerRef}
        className="relative h-full bg-white border border-pearl-200 rounded-lg cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
      >
        <img
          src={imageSrc}
          alt={alt}
          className="w-full h-full object-contain p-4"
          draggable={false}
        />
      </div>

      {/* Zoom panel - appears to the right on hover (desktop only) */}
      {isZooming && (
        <div
          className="hidden lg:block absolute top-0 left-[calc(100%+16px)] w-[500px] h-full rounded-lg border border-pearl-200 shadow-xl overflow-hidden z-50 bg-white"
          style={{
            backgroundImage: `url(${imageSrc})`,
            backgroundSize: `${zoomLevel * 100}%`,
            backgroundPosition: `${backgroundPosition.x}% ${backgroundPosition.y}%`,
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}
    </div>
  );
}
