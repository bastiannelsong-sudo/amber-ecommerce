'use client';

import { useState, useRef, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ZoomLensProps {
  imageSrc: string;
  alt?: string;
  zoomLevel?: number;
  className?: string;
}

export default function ZoomLens({ imageSrc, alt = 'Product', zoomLevel = 2.5, className = '' }: ZoomLensProps) {
  const [isZooming, setIsZooming] = useState(false);
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
  const [backgroundPosition, setBackgroundPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    // Calculate mouse position relative to container
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Lens dimensions
    const lensSize = 200;
    const lensRadius = lensSize / 2;

    // Keep lens within bounds
    const lensX = Math.max(lensRadius, Math.min(x, rect.width - lensRadius));
    const lensY = Math.max(lensRadius, Math.min(y, rect.height - lensRadius));

    setLensPosition({ x: lensX, y: lensY });

    // Calculate background position for zoomed image
    const bgX = (lensX / rect.width) * 100;
    const bgY = (lensY / rect.height) * 100;

    setBackgroundPosition({ x: bgX, y: bgY });
  };

  const handleMouseEnter = () => {
    setIsZooming(true);
  };

  const handleMouseLeave = () => {
    setIsZooming(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div
        ref={containerRef}
        className="relative overflow-hidden cursor-crosshair bg-white border border-pearl-200"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <img
          src={imageSrc}
          alt={alt}
          className="w-full h-full object-contain p-8"
          draggable={false}
        />

        {/* Zoom Lens */}
        <AnimatePresence>
          {isZooming && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="absolute pointer-events-none"
              style={{
                left: lensPosition.x,
                top: lensPosition.y,
                transform: 'translate(-50%, -50%)',
                width: '200px',
                height: '200px',
              }}
            >
              <div
                className="w-full h-full rounded-full border-4 border-white shadow-2xl overflow-hidden"
                style={{
                  backgroundImage: `url(${imageSrc})`,
                  backgroundSize: `${zoomLevel * 100}%`,
                  backgroundPosition: `${backgroundPosition.x}% ${backgroundPosition.y}%`,
                  backgroundRepeat: 'no-repeat',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Zoom Instructions */}
      <AnimatePresence>
        {isZooming && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 right-4 bg-black/80 text-white text-xs px-3 py-2 rounded-full pointer-events-none"
          >
            Mueve el cursor para explorar
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
