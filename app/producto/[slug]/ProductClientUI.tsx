'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import RelatedProducts from '@/app/components/RelatedProducts';
import ZoomLens from '@/app/components/ZoomLens';
import ScarcityIndicator from '@/app/components/marketing/ScarcityIndicator';
import SocialProofBadge from '@/app/components/marketing/SocialProofBadge';
import PriceAnchor from '@/app/components/marketing/PriceAnchor';
import ReviewList from '@/app/components/marketing/ReviewList';
import { ecommerceService } from '@/app/lib/services/ecommerce.service';
import { useCartStore } from '@/app/lib/stores/cart.store';
import { trackViewItem } from '@/app/lib/analytics';
import toast from 'react-hot-toast';
import type { Product } from '@/app/lib/types';

interface ProductClientUIProps {
  product: Product;
}

/* --- Animation variants --- */
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export default function ProductClientUI({ product }: ProductClientUIProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);
  const [activeAccordion, setActiveAccordion] = useState<string | null>('details');
  const [reviewSummary, setReviewSummary] = useState<{
    average_rating: number;
    total_reviews: number;
  } | null>(null);

  // GA4 view_item: una vez por mount, no en cada re-render.
  useEffect(() => {
    trackViewItem(product);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.product_id]);

  useEffect(() => {
    ecommerceService
      .getProductReviews(product.product_id)
      .then((reviewData) => {
        setReviewSummary({
          average_rating: reviewData.average_rating,
          total_reviews: reviewData.total_reviews,
        });
      })
      .catch(() => {});
  }, [product.product_id]);

  // Upgrade MercadoLibre images from thumbnail (-O) to full size (-F)
  const upgradeMLImage = (url: string) => url.replace(/-O\.jpg$/, '-F.jpg');
  const rawImages = product.images && product.images.length > 0
    ? product.images
    : [product.image_url || '/placeholder-product.svg'];
  const images = rawImages.map(upgradeMLImage);

  const displayName = product.display_name || product.name;

  return (
    <>
      {/* Product Details */}
      <div className="container mx-auto px-4 lg:px-8 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 xl:gap-20">

          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex gap-3 sm:gap-4">
              {/* Vertical thumbnails (desktop) */}
              {images.length > 1 && (
                <div className="hidden sm:flex flex-col gap-2 w-16 lg:w-[72px] shrink-0">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onMouseEnter={() => setSelectedImage(index)}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded overflow-hidden border-2 transition-all duration-300 ${
                        selectedImage === index
                          ? 'border-amber-gold-500 shadow-gold'
                          : 'border-pearl-200 hover:border-pearl-400'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${displayName} - Vista ${index + 1}`}
                        className="w-full h-full object-contain p-0.5 bg-white"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Main Image with crossfade */}
              <div className="flex-1 min-w-0 relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full"
                  >
                    <ZoomLens
                      imageSrc={images[selectedImage]}
                      alt={displayName}
                      zoomLevel={2}
                      className="aspect-square bg-white rounded-lg overflow-hidden"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile thumbnails */}
            {images.length > 1 && (
              <div className="flex sm:hidden gap-2 overflow-x-auto pb-2 mt-3 scrollbar-hide">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-14 h-14 shrink-0 rounded overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? 'border-amber-gold-500'
                        : 'border-pearl-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${displayName} - Vista ${index + 1}`}
                      className="w-full h-full object-contain p-0.5 bg-white"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Image counter - mobile */}
            {images.length > 1 && (
              <p className="sm:hidden text-center text-xs text-platinum-500 mt-2">
                {selectedImage + 1} / {images.length}
              </p>
            )}
          </motion.div>

          {/* Product Info - staggered entrance */}
          <motion.div
            className="lg:max-w-lg lg:pt-2"
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            {/* Category */}
            <motion.p
              variants={fadeUp}
              className="text-[11px] uppercase tracking-[0.25em] text-amber-gold-500 font-semibold mb-4"
            >
              {product.category?.name || 'Joyeria Amber'}
            </motion.p>

            {/* Name */}
            <motion.h1
              variants={fadeUp}
              className="text-2xl sm:text-3xl lg:text-[2.75rem] lg:leading-[1.1] font-light text-obsidian-900 mb-6"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              {displayName}
            </motion.h1>

            {/* Review summary - above the fold social proof */}
            {reviewSummary && (
              <motion.div variants={fadeUp} className="mb-4">
                <button
                  onClick={() => {
                    document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 group cursor-pointer"
                >
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const avg = reviewSummary.average_rating;
                      const isFull = star <= Math.floor(avg);
                      const isHalf = !isFull && star === Math.ceil(avg) && avg % 1 >= 0.25;
                      return (
                        <svg
                          key={star}
                          className="w-3.5 h-3.5"
                          viewBox="0 0 20 20"
                        >
                          {isHalf ? (
                            <>
                              <defs>
                                <clipPath id={`half-star-${star}`}>
                                  <rect x="0" y="0" width="10" height="20" />
                                </clipPath>
                              </defs>
                              <path
                                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                                fill="#e8e8e8"
                              />
                              <path
                                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                                fill="#c5a028"
                                clipPath={`url(#half-star-${star})`}
                              />
                            </>
                          ) : (
                            <path
                              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                              fill={isFull ? '#c5a028' : '#e8e8e8'}
                            />
                          )}
                        </svg>
                      );
                    })}
                  </div>
                  <span className="text-xs text-platinum-600 group-hover:text-amber-gold-500 transition-colors underline-offset-2 group-hover:underline">
                    {reviewSummary.total_reviews > 0
                      ? `${reviewSummary.total_reviews} ${reviewSummary.total_reviews === 1 ? 'resena' : 'resenas'}`
                      : 'Se el primero en opinar'}
                  </span>
                </button>
              </motion.div>
            )}

            {/* Gold accent line */}
            <motion.div
              variants={fadeUp}
              className="w-16 h-px mb-6"
              style={{ background: 'linear-gradient(90deg, #d4af37, transparent)' }}
            />

            {/* Price */}
            <motion.div variants={fadeUp} className="mb-6">
              <PriceAnchor
                price={product.price}
                secondarySkus={product.secondarySkus}
              />
            </motion.div>

            {/* Description */}
            <motion.div variants={fadeUp}>
              {product.description ? (
                <p className="text-sm text-platinum-700 leading-[1.8] mb-6">
                  {product.description}
                </p>
              ) : (
                <p className="text-sm text-platinum-700 leading-[1.8] mb-6">
                  Pieza seleccionada cuidadosamente por AMBER. Calidad premium con acabado de alta durabilidad, ideal para uso diario o como regalo especial.
                </p>
              )}
            </motion.div>

            {/* Scarcity */}
            <motion.div variants={fadeUp} className="mb-6">
              <ScarcityIndicator stock={product.stock} />
              <SocialProofBadge productId={product.product_id} />
            </motion.div>

            {/* Cantidad + Agregar al Carrito */}
            <motion.div variants={fadeUp} className="space-y-4 mb-6">
              {product.stock > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-wider text-platinum-600 w-20">Cantidad</span>
                  <div className="inline-flex items-center border border-pearl-300">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-11 h-11 flex items-center justify-center hover:bg-pearl-100 transition-colors cursor-pointer text-obsidian-700"
                      aria-label="Disminuir cantidad"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="w-12 text-center text-sm font-medium text-obsidian-900 tabular-nums">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="w-11 h-11 flex items-center justify-center hover:bg-pearl-100 transition-colors cursor-pointer text-obsidian-700"
                      aria-label="Aumentar cantidad"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  if (product.stock > 0) {
                    addItem(product, quantity);
                    toast.success(`${product.display_name || product.name} agregado al carrito`);
                    openCart();
                  }
                }}
                disabled={product.stock === 0}
                className={`group relative w-full flex items-center justify-center gap-3 py-4 text-xs uppercase tracking-[0.2em] font-medium overflow-hidden active:scale-[0.98] transition-all ${
                  product.stock === 0
                    ? 'bg-platinum-300 text-platinum-500 cursor-not-allowed'
                    : 'bg-obsidian-900 text-white cursor-pointer hover:bg-amber-gold-500'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                {product.stock === 0 ? 'Agotado' : 'Agregar al Carrito'}
              </button>

              <p className="text-center text-[11px] text-platinum-500">
                Envio gratuito sobre $50.000 en Chile &middot; Cambios sin costo
              </p>
            </motion.div>

            {/* Premium packaging badge */}
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6 px-4 py-3 bg-amber-gold-50/60 border border-amber-gold-200/50">
              <svg className="w-5 h-5 text-amber-gold-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-obsidian-800 uppercase tracking-wider">Empaque premium incluido</p>
                <p className="text-[11px] text-platinum-600 mt-0.5">Listo para regalar en caja de presentacion AMBER</p>
              </div>
            </motion.div>

            {/* Trust strip - enhanced */}
            <motion.div variants={fadeUp} className="grid grid-cols-3 gap-4 py-5 border-y border-pearl-200 mb-6">
              <div className="flex flex-col items-center text-center gap-1.5">
                <svg className="w-5 h-5 text-amber-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-obsidian-800">Cambios sin costo</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5">
                <svg className="w-5 h-5 text-amber-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-obsidian-800">Pago 100% seguro</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5">
                <svg className="w-5 h-5 text-amber-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-obsidian-800">Envio gratis +$50k</span>
              </div>
            </motion.div>

            {/* Accordion sections */}
            <motion.div variants={fadeUp} className="space-y-0">
              <AccordionItem
                id="details"
                title="Detalles del Producto"
                isOpen={activeAccordion === 'details'}
                onToggle={() => setActiveAccordion(activeAccordion === 'details' ? null : 'details')}
              >
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                  <div>
                    <span className="text-platinum-500 text-[10px] uppercase tracking-widest">SKU</span>
                    <p className="text-obsidian-900 mt-1 font-light">{product.internal_sku}</p>
                  </div>
                  {product.material && (
                    <div>
                      <span className="text-platinum-500 text-[10px] uppercase tracking-widest">Material</span>
                      <p className="text-obsidian-900 mt-1 font-light capitalize">{product.material}</p>
                    </div>
                  )}
                  {product.style && (
                    <div>
                      <span className="text-platinum-500 text-[10px] uppercase tracking-widest">Estilo</span>
                      <p className="text-obsidian-900 mt-1 font-light capitalize">{product.style}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-platinum-500 text-[10px] uppercase tracking-widest">Devoluciones</span>
                    <p className="text-obsidian-900 mt-1 font-light">Cambios sin costo</p>
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem
                id="care"
                title="Cuidados"
                isOpen={activeAccordion === 'care'}
                onToggle={() => setActiveAccordion(activeAccordion === 'care' ? null : 'care')}
              >
                <ul className="space-y-3 text-sm text-platinum-700">
                  {[
                    'Evitar contacto con perfumes, cremas y agua',
                    'Guardar en bolsa individual o caja cerrada',
                    'Limpiar con pano suave y seco',
                    'Retirar antes de dormir o hacer ejercicio',
                  ].map((tip) => (
                    <li key={tip} className="flex items-start gap-3">
                      <span className="w-1 h-1 rounded-full bg-amber-gold-400 mt-2 flex-shrink-0" />
                      <span className="leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </AccordionItem>

              <AccordionItem
                id="shipping"
                title="Envio y Devoluciones"
                isOpen={activeAccordion === 'shipping'}
                onToggle={() => setActiveAccordion(activeAccordion === 'shipping' ? null : 'shipping')}
              >
                <div className="space-y-3 text-sm text-platinum-700">
                  {[
                    'Envio gratis en compras sobre $50.000',
                    'Despacho en 1-3 dias habiles a todo Chile',
                    '30 dias para cambios y devoluciones',
                  ].map((info) => (
                    <div key={info} className="flex items-start gap-3">
                      <svg className="w-4 h-4 text-amber-gold-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="leading-relaxed">{info}</span>
                    </div>
                  ))}
                </div>
              </AccordionItem>
            </motion.div>
          </motion.div>
        </div>

        {/* Brand Promise Strip */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="mt-20 sm:mt-28 py-16 sm:py-20 border-y border-pearl-200 relative overflow-hidden"
        >
          {/* Decorative background */}
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #d4af37 1px, transparent 0)', backgroundSize: '40px 40px' }} />

          <motion.div variants={fadeUp} className="text-center mb-12">
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-gold-500 font-semibold mb-3">La Promesa</p>
            <h2
              className="text-3xl sm:text-4xl font-light text-obsidian-900"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Experiencia AMBER
            </h2>
            <div className="w-12 h-px mx-auto mt-5" style={{ background: 'linear-gradient(90deg, transparent, #d4af37, transparent)' }} />
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 max-w-4xl mx-auto relative">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                ),
                title: 'Seleccion Curada',
                desc: 'Cada pieza pasa por control de calidad manual',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                ),
                title: 'Empaque Premium',
                desc: 'Caja exclusiva lista para regalar',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ),
                title: 'Garantia Real',
                desc: 'Cambios y devoluciones sin costo',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                ),
                title: 'Hecho con Amor',
                desc: 'Desde Chile, para el mundo',
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-12 h-12 flex items-center justify-center text-amber-gold-500 mb-4 group-hover:scale-110 transition-transform duration-500">
                  {item.icon}
                </div>
                <h3 className="text-xs uppercase tracking-[0.15em] font-semibold text-obsidian-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-platinum-600 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Reviews Section */}
        <section id="reviews" className="mt-16 sm:mt-24 scroll-mt-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-12">
              <p className="text-[10px] uppercase tracking-[0.3em] text-amber-gold-500 font-semibold mb-3">
                Resenas
              </p>
              <h2
                className="text-3xl sm:text-4xl font-light text-obsidian-900"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                Lo que dicen nuestros clientes
              </h2>
              <div
                className="w-12 h-px mx-auto mt-5"
                style={{ background: 'linear-gradient(90deg, transparent, #d4af37, transparent)' }}
              />
            </motion.div>

            <motion.div variants={fadeUp}>
              <ReviewList productId={product.product_id} />
            </motion.div>
          </motion.div>
        </section>

        {/* Related Products */}
        <div className="mt-16 sm:mt-24">
          <RelatedProducts
            currentProductId={product.product_id}
            categoryId={product.category?.category_id}
            material={product.material}
          />
        </div>
      </div>
    </>
  );
}

/* Accordion Component - Enhanced */
function AccordionItem({
  id,
  title,
  isOpen,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-pearl-200">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left cursor-pointer group"
        aria-expanded={isOpen}
        aria-controls={`accordion-${id}`}
      >
        <span className={`text-xs uppercase tracking-[0.15em] font-medium transition-colors duration-300 ${
          isOpen ? 'text-amber-gold-600' : 'text-obsidian-900 group-hover:text-amber-gold-600'
        }`}>
          {title}
        </span>
        <svg
          className={`w-4 h-4 transition-all duration-400 ${
            isOpen ? 'rotate-180 text-amber-gold-500' : 'text-platinum-500'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`accordion-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-6">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
