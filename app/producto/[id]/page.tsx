'use client';

import { useState, useEffect, useRef } from 'react';
import { use } from 'react';
import Header from '@/app/components/Header';
import RelatedProducts from '@/app/components/RelatedProducts';
import Footer from '@/app/components/Footer';
import ZoomLens from '@/app/components/ZoomLens';
import StickyAddToCart from '@/app/components/StickyAddToCart';
import SocialProofBadge from '@/app/components/marketing/SocialProofBadge';
import ScarcityIndicator from '@/app/components/marketing/ScarcityIndicator';
import PriceAnchor from '@/app/components/marketing/PriceAnchor';
import TrustBadges from '@/app/components/marketing/TrustBadges';
import { useCartStore } from '@/app/lib/stores/cart.store';
import { useWishlistStore } from '@/app/lib/stores/wishlist.store';
import { productsService } from '@/app/lib/services/products.service';
import type { Product, Review } from '@/app/lib/types';
import toast, { Toaster } from 'react-hot-toast';

// Mock reviews data
const mockReviews: Review[] = [
  {
    review_id: 1,
    product_id: 1,
    user: { id: '1', email: 'user@example.com', name: 'Maria Gonzalez' },
    rating: 5,
    title: 'Producto excepcional',
    comment: 'La calidad es increible, supero mis expectativas. El acabado es perfecto y llego muy bien empacado.',
    created_at: new Date().toISOString(),
    helpful_count: 12,
  },
  {
    review_id: 2,
    product_id: 1,
    user: { id: '2', email: 'user2@example.com', name: 'Carla Perez' },
    rating: 4,
    title: 'Muy bonito',
    comment: 'Me encanto, aunque el envio tardo un poco mas de lo esperado.',
    created_at: new Date().toISOString(),
    helpful_count: 8,
  },
];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const productId = parseInt(resolvedParams.id);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState<'description' | 'reviews'>('description');

  const addToCart = useCartStore((state) => state.addItem);
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const isInWishlist = useWishlistStore((state) => state.isInWishlist(productId));

  // Ref for tracking the add to cart button position
  const addToCartButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await productsService.getById(productId);
      setProduct(data);
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Error al cargar el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      toast.success(`${product.name} agregado al carrito`);
    }
  };

  const handleToggleWishlist = () => {
    if (product) {
      toggleWishlist(product);
      toast.success(
        isInWishlist ? 'Eliminado de favoritos' : 'Agregado a favoritos'
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-24 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-gold-500 border-t-transparent"></div>
            <p className="mt-4 text-platinum-600">Cargando producto...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-light text-obsidian-900 mb-4">
            Producto no encontrado
          </h1>
          <a
            href="/"
            className="text-amber-gold-500 hover:text-amber-gold-600 transition-colors"
          >
            Volver al catalogo
          </a>
        </div>
      </div>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : [product.image_url || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=800&fit=crop'];

  const averageRating = mockReviews.reduce((acc, review) => acc + review.rating, 0) / mockReviews.length;

  return (
    <div className="min-h-screen bg-pearl-50">
      <Toaster position="top-right" />
      <Header />

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 lg:px-8 pt-8">
        <div className="flex items-center gap-2 text-sm text-platinum-600">
          <a href="/" className="hover:text-amber-gold-500 transition-colors">
            Inicio
          </a>
          <span>/</span>
          <a href="/catalogo" className="hover:text-amber-gold-500 transition-colors">
            Catalogo
          </a>
          <span>/</span>
          <span className="text-obsidian-900">{product.name}</span>
        </div>
      </div>

      {/* Product Details */}
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Image Gallery */}
          <div className="space-y-6">
            {/* Main Image with Advanced Zoom Lens */}
            <ZoomLens
              imageSrc={images[selectedImage]}
              alt={product.name}
              zoomLevel={2.5}
              className="aspect-square bg-white rounded-lg overflow-hidden shadow-luxury"
            />

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
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
          <div className="space-y-8">
            <div>
              <p className="text-sm uppercase tracking-widest text-platinum-600 mb-2">
                {product.category?.name || 'Joyeria'}
              </p>
              <h1
                className="text-4xl lg:text-5xl font-light text-obsidian-900 mb-4"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-5 h-5 ${
                        star <= averageRating
                          ? 'text-amber-gold-500'
                          : 'text-pearl-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-platinum-600">
                  {averageRating.toFixed(1)} ({mockReviews.length} reviews)
                </span>
              </div>

              {/* Price with anchoring */}
              <PriceAnchor
                price={product.price}
                secondarySkus={product.secondarySkus}
              />

              <p className="text-platinum-700 leading-relaxed mt-6">
                Pieza unica de joyeria artesanal. Cada detalle ha sido cuidadosamente
                elaborado para garantizar la mas alta calidad y elegancia. Perfecto
                para ocasiones especiales o como regalo memorable.
              </p>
            </div>

            {/* Social Proof */}
            <SocialProofBadge
              productId={productId}
              soldThisWeek={Math.floor(Math.random() * 15) + 3}
              showViewers
            />

            {/* Scarcity Indicator */}
            <ScarcityIndicator stock={product.stock} />

            {/* Stock Info (only if not scarce - ScarcityIndicator handles low stock) */}
            {product.stock > 5 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-obsidian-700">
                  En stock
                </span>
              </div>
            )}

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-sm uppercase tracking-wide text-obsidian-700">
                  Cantidad:
                </span>
                <div className="flex items-center border border-pearl-300">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-pearl-100 transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-6 py-2 border-x border-pearl-300">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-4 py-2 hover:bg-pearl-100 transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div ref={addToCartButtonRef} className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 py-4 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors disabled:bg-platinum-400 disabled:cursor-not-allowed cursor-pointer"
              >
                {product.stock > 0 ? 'Agregar al Carrito' : 'Agotado'}
              </button>
              <button
                onClick={handleToggleWishlist}
                className="w-14 h-14 flex items-center justify-center border-2 border-obsidian-900 hover:bg-obsidian-900 group transition-colors cursor-pointer"
              >
                <svg
                  className={`w-6 h-6 transition-colors ${
                    isInWishlist
                      ? 'text-amber-gold-500 fill-current'
                      : 'text-obsidian-900 group-hover:text-white'
                  }`}
                  fill={isInWishlist ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
            </div>

            {/* Trust Badges */}
            <TrustBadges layout="vertical" />

            {/* Product Details */}
            <div className="border-t border-pearl-200 pt-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-platinum-600">SKU:</span>
                <span className="text-obsidian-900 font-medium">
                  {product.internal_sku}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-platinum-600">Material:</span>
                <span className="text-obsidian-900">Oro 18k</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-platinum-600">Garantia:</span>
                <span className="text-obsidian-900">12 meses</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs: Description & Reviews */}
        <div className="mt-24">
          <div className="border-b border-pearl-200">
            <div className="flex gap-8">
              <button
                onClick={() => setSelectedTab('description')}
                className={`pb-4 text-sm uppercase tracking-widest font-medium transition-colors relative cursor-pointer ${
                  selectedTab === 'description'
                    ? 'text-obsidian-900'
                    : 'text-platinum-600 hover:text-obsidian-700'
                }`}
              >
                Descripcion
                {selectedTab === 'description' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-gold-500"></div>
                )}
              </button>
              <button
                onClick={() => setSelectedTab('reviews')}
                className={`pb-4 text-sm uppercase tracking-widest font-medium transition-colors relative cursor-pointer ${
                  selectedTab === 'reviews'
                    ? 'text-obsidian-900'
                    : 'text-platinum-600 hover:text-obsidian-700'
                }`}
              >
                Reviews ({mockReviews.length})
                {selectedTab === 'reviews' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-gold-500"></div>
                )}
              </button>
            </div>
          </div>

          <div className="py-12">
            {selectedTab === 'description' ? (
              <div className="max-w-3xl space-y-6 text-platinum-700 leading-relaxed">
                <p>
                  Nuestra coleccion de joyeria artesanal combina tecnicas tradicionales
                  con diseno contemporaneo. Cada pieza es unica y esta elaborada con los
                  mas altos estandares de calidad.
                </p>
                <p>
                  Utilizamos materiales preciosos certificados y piedras seleccionadas
                  cuidadosamente para garantizar la autenticidad y durabilidad de cada
                  joya. Nuestros artesanos dedican horas de trabajo meticuloso para
                  crear piezas que perduraran generaciones.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Material: Oro 18k certificado</li>
                  <li>Acabado premium pulido a mano</li>
                  <li>Garantia de 12 meses</li>
                  <li>Certificado de autenticidad incluido</li>
                  <li>Estuche de presentacion luxury</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-8">
                {mockReviews.map((review) => (
                  <div
                    key={review.review_id}
                    className="border-b border-pearl-200 pb-8 last:border-0"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? 'text-amber-gold-500'
                                  : 'text-pearl-300'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <h3 className="font-medium text-obsidian-900 mb-1">
                          {review.title}
                        </h3>
                        <p className="text-sm text-platinum-600">
                          Por {review.user.name} - {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-platinum-700 mb-4">{review.comment}</p>
                    <button className="text-sm text-platinum-600 hover:text-amber-gold-500 transition-colors cursor-pointer">
                      Te resulto util? ({review.helpful_count})
                    </button>
                  </div>
                ))}

                <button className="w-full py-4 border-2 border-obsidian-900 text-obsidian-900 text-sm uppercase tracking-widest font-medium hover:bg-obsidian-900 hover:text-white transition-colors cursor-pointer">
                  Escribir una review
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Trust Badges - horizontal below content */}
        <div className="mb-16">
          <TrustBadges layout="horizontal" />
        </div>

        {/* Related Products */}
        <RelatedProducts
          currentProductId={productId}
          categoryId={product.category?.category_id}
        />
      </div>

      {/* Footer */}
      <Footer />

      {/* Sticky Add to Cart */}
      <StickyAddToCart
        product={product}
        onAddToCart={handleAddToCart}
        targetRef={addToCartButtonRef}
      />
    </div>
  );
}
