'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CheckoutProgressBar from '../components/marketing/CheckoutProgressBar';
import TrustBadges from '../components/marketing/TrustBadges';
import { useCartStore } from '../lib/stores/cart.store';
import type { CartItem } from '../lib/types';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const items = useCartStore((state) => state.items);
  const getTotal = useCartStore((state) => state.getTotal());
  const clearCart = useCartStore((state) => state.clearCart);
  const [orderNumber] = useState(() => Math.floor(Math.random() * 10000));

  const [step, setStep] = useState<'shipping' | 'payment' | 'confirmation'>('shipping');
  const orderSnapshot = useRef<{ items: CartItem[]; subtotal: number; shipping: number; total: number } | null>(null);
  const [formData, setFormData] = useState({
    // Datos personales y envío
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    apartment: '',
    city: '',
    region: '',
    postalCode: '',
    // NOTA: Los datos de tarjeta NO deben almacenarse en estado del cliente.
    // Se debe integrar una pasarela de pago (MercadoPago/Stripe) que maneje
    // los datos sensibles de forma segura mediante tokenización.
  });

  const subtotal = getTotal;
  const shipping = subtotal > 30000 ? 0 : 5000;
  const total = subtotal + shipping;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target;

    if (name === 'phone') {
      value = value.replace(/[^\d+\s]/g, '');
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmitShipping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.address || !formData.city) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }
    setStep('payment');
    toast.success('Información de envío guardada');
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: Aquí se debe iniciar el flujo de pago con MercadoPago/Stripe
    // La pasarela de pago manejará los datos sensibles de tarjeta
    toast.error('Pasarela de pago pendiente de integración');
  };

  // Get display data: use snapshot for confirmation, live cart otherwise
  const displayItems = step === 'confirmation' && orderSnapshot.current ? orderSnapshot.current.items : items;
  const displaySubtotal = step === 'confirmation' && orderSnapshot.current ? orderSnapshot.current.subtotal : subtotal;
  const displayShipping = step === 'confirmation' && orderSnapshot.current ? orderSnapshot.current.shipping : shipping;
  const displayTotal = step === 'confirmation' && orderSnapshot.current ? orderSnapshot.current.total : total;

  if (items.length === 0 && step !== 'confirmation') {
    return (
      <div className="min-h-screen bg-pearl-50">
        <Header />
        <div className="flex flex-col items-center justify-center py-24">
          <svg className="w-24 h-24 text-platinum-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <h2 className="text-2xl font-light text-obsidian-900 mb-4" style={{ fontFamily: 'var(--font-cormorant)' }}>
            Tu carrito esta vacio
          </h2>
          <p className="text-platinum-600 mb-8">Agrega productos antes de continuar al checkout</p>
          <Link href="/catalogo" className="px-8 py-3 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors">
            Explorar Productos
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pearl-50">
      <Header />

      <div className="container mx-auto px-4 lg:px-8 py-6 sm:py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-platinum-600 mb-4 sm:mb-8">
          <Link href="/" className="hover:text-amber-gold-500 transition-colors">Inicio</Link>
          <span>/</span>
          <Link href="/carrito" className="hover:text-amber-gold-500 transition-colors">Carrito</Link>
          <span>/</span>
          <span className="text-obsidian-900">Checkout</span>
        </div>

        {/* Progress Steps */}
        <CheckoutProgressBar currentStep={step} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
          {/* Forms */}
          <div className="lg:col-span-2">
            {/* Shipping Form */}
            {step === 'shipping' && (
              <form onSubmit={handleSubmitShipping} className="bg-white p-5 sm:p-8 shadow-luxury">
                <h2
                  className="text-2xl sm:text-3xl font-light text-obsidian-900 mb-5 sm:mb-8 pb-4 border-b border-pearl-200"
                  style={{ fontFamily: 'var(--font-cormorant)' }}
                >
                  Información de Envío
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-obsidian-900 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none transition-colors"
                      placeholder="tu@email.com"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-obsidian-900 mb-2">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-obsidian-900 mb-2">
                        Apellido *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-obsidian-900 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none transition-colors"
                      placeholder="+56 9 1234 5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-obsidian-900 mb-2">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none transition-colors"
                      placeholder="Calle Principal 123"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-obsidian-900 mb-2">
                      Apartamento, suite, etc.
                    </label>
                    <input
                      type="text"
                      name="apartment"
                      value={formData.apartment}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none transition-colors"
                      placeholder="Depto 401"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-obsidian-900 mb-2">
                        Ciudad *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-obsidian-900 mb-2">
                        Región *
                      </label>
                      <select
                        name="region"
                        value={formData.region}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none transition-colors"
                      >
                        <option value="">Seleccionar</option>
                        <option value="arica">Arica y Parinacota</option>
                        <option value="tarapaca">Tarapacá</option>
                        <option value="antofagasta">Antofagasta</option>
                        <option value="atacama">Atacama</option>
                        <option value="coquimbo">Coquimbo</option>
                        <option value="valparaiso">Valparaíso</option>
                        <option value="metropolitana">Metropolitana</option>
                        <option value="ohiggins">O'Higgins</option>
                        <option value="maule">Maule</option>
                        <option value="nuble">Ñuble</option>
                        <option value="biobio">Biobío</option>
                        <option value="araucania">Araucanía</option>
                        <option value="losrios">Los Ríos</option>
                        <option value="loslagos">Los Lagos</option>
                        <option value="aysen">Aysén</option>
                        <option value="magallanes">Magallanes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-obsidian-900 mb-2">
                        Código Postal
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors cursor-pointer"
                  >
                    Continuar al Pago
                  </button>
                </div>
              </form>
            )}

            {/* Payment Form */}
            {step === 'payment' && (
              <form onSubmit={handleSubmitPayment} className="bg-white p-5 sm:p-8 shadow-luxury">
                <h2
                  className="text-2xl sm:text-3xl font-light text-obsidian-900 mb-5 sm:mb-8 pb-4 border-b border-pearl-200"
                  style={{ fontFamily: 'var(--font-cormorant)' }}
                >
                  Información de Pago
                </h2>

                <div className="space-y-6">
                  {/* Pasarela de pago - reemplazar con MercadoPago/Stripe */}
                  <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-lg font-medium text-gray-600">Integración de pasarela de pago pendiente</p>
                    <p className="text-sm text-gray-400 mt-2">Aquí se integrará MercadoPago o Stripe para procesamiento seguro de pagos</p>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setStep('shipping')}
                      className="flex-1 py-4 border-2 border-obsidian-900 text-obsidian-900 text-sm uppercase tracking-widest font-medium hover:bg-obsidian-900 hover:text-white transition-colors cursor-pointer"
                    >
                      Volver
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-4 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors cursor-pointer"
                    >
                      Finalizar Compra
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Confirmation */}
            {step === 'confirmation' && (
              <div className="bg-white shadow-luxury">
                {/* Success Header */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 text-center border-b border-green-100">
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  <h2
                    className="text-3xl sm:text-4xl lg:text-5xl font-light text-obsidian-900 mb-3 sm:mb-4"
                    style={{ fontFamily: 'var(--font-cormorant)' }}
                  >
                    Pedido Confirmado
                  </h2>

                  <p className="text-lg text-platinum-700 mb-2">
                    Gracias por tu compra, {formData.firstName}
                  </p>
                  <p className="text-sm text-platinum-600">
                    Recibirás un email de confirmación en <strong>{formData.email}</strong>
                  </p>
                </div>

                {/* Order Details */}
                <div className="p-8 space-y-8">
                  {/* Order Number */}
                  <div className="bg-amber-gold-50 border border-amber-gold-200 p-6 rounded-lg text-center">
                    <p className="text-sm text-amber-gold-700 mb-2 uppercase tracking-wider">Número de Orden</p>
                    <p className="text-3xl font-medium text-obsidian-900" style={{ fontFamily: 'var(--font-cormorant)' }}>
                      #AMB{orderNumber}
                    </p>
                  </div>

                  {/* Delivery Timeline */}
                  <div>
                    <h3 className="text-xl font-medium text-obsidian-900 mb-4">Estimación de Entrega</h3>
                    <div className="bg-pearl-50 p-6 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-obsidian-900">Pedido Confirmado</p>
                            <p className="text-sm text-platinum-600">{new Date().toLocaleDateString('es-CL')}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4 opacity-60">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-pearl-300 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-obsidian-900">En Preparación</p>
                            <p className="text-sm text-platinum-600">1-2 días hábiles</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between opacity-60">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-pearl-300 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-obsidian-900">Entregado</p>
                            <p className="text-sm text-platinum-600">3-5 días hábiles</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shipping & Payment Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Shipping Address */}
                    <div className="border border-pearl-200 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-obsidian-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Dirección de Envío
                      </h3>
                      <div className="text-sm text-platinum-700 space-y-1">
                        <p className="font-medium">{formData.firstName} {formData.lastName}</p>
                        <p>{formData.address}</p>
                        <p>{formData.city}, {formData.region}</p>
                        <p>{formData.postalCode}</p>
                        <p className="pt-2">{formData.phone}</p>
                      </div>
                    </div>

                    {/* Método de Pago */}
                    <div className="border border-pearl-200 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-obsidian-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Método de Pago
                      </h3>
                      <div className="text-sm text-platinum-700 space-y-2">
                        <p className="text-green-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Pago procesado via pasarela de pago
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="text-lg font-medium text-obsidian-900 mb-4">Productos Ordenados</h3>
                    <div className="border border-pearl-200 rounded-lg divide-y divide-pearl-200">
                      {displayItems.map((item) => (
                        <div key={item.product.product_id} className="p-4 flex items-center gap-4">
                          <div className="w-20 h-20 bg-pearl-100 flex-shrink-0 rounded overflow-hidden relative">
                            <Image
                              src={item.product.image_url || '/logo_oscuro.jpeg'}
                              alt={item.product.name}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-obsidian-900">{item.product.name}</p>
                            <p className="text-sm text-platinum-600">Cantidad: {item.quantity}</p>
                          </div>
                          <p className="font-medium text-obsidian-900">
                            ${((item.product.price || 0) * item.quantity).toLocaleString('es-CL')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-pearl-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-obsidian-900 mb-4">Resumen del Pedido</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-platinum-600">Subtotal</span>
                        <span className="text-obsidian-900">${displaySubtotal.toLocaleString('es-CL')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-platinum-600">Envio</span>
                        <span className="text-obsidian-900">
                          {displayShipping === 0 ? 'Gratis' : `$${displayShipping.toLocaleString('es-CL')}`}
                        </span>
                      </div>
                      <div className="pt-3 border-t border-pearl-200 flex justify-between">
                        <span className="font-medium text-obsidian-900 text-lg">Total Pagado</span>
                        <span className="font-medium text-obsidian-900 text-lg">${displayTotal.toLocaleString('es-CL')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Link
                      href="/"
                      className="flex-1 py-4 bg-obsidian-900 text-white text-center text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors"
                    >
                      Ir al Inicio
                    </Link>
                    <Link
                      href="/catalogo"
                      className="flex-1 py-4 text-center border-2 border-obsidian-900 text-obsidian-900 text-sm uppercase tracking-widest font-medium hover:bg-obsidian-900 hover:text-white transition-colors"
                    >
                      Seguir Comprando
                    </Link>
                  </div>

                  {/* Help Section */}
                  <div className="border-t border-pearl-200 pt-6 text-center">
                    <p className="text-sm text-platinum-600 mb-3">¿Necesitas ayuda con tu pedido?</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
                      <Link href="/contacto" className="text-amber-gold-600 hover:text-amber-gold-700 font-medium">
                        Contáctanos
                      </Link>
                      <span className="hidden sm:inline text-platinum-400">•</span>
                      <a href="mailto:contacto@amber.cl" className="text-amber-gold-600 hover:text-amber-gold-700 font-medium">
                        contacto@amber.cl
                      </a>
                      <span className="hidden sm:inline text-platinum-400">•</span>
                      <a href="tel:+56912345678" className="text-amber-gold-600 hover:text-amber-gold-700 font-medium">
                        +56 9 1234 5678
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 shadow-luxury sticky top-24">
              <h3
                className="text-2xl font-light text-obsidian-900 mb-6 pb-4 border-b border-pearl-200"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                Resumen
              </h3>

              <div className="space-y-4 mb-6">
                {displayItems.map((item) => (
                  <div key={item.product.product_id} className="flex gap-4">
                    <div className="w-16 h-16 bg-pearl-100 flex-shrink-0 rounded overflow-hidden relative">
                      <Image
                        src={item.product.image_url || '/logo_oscuro.jpeg'}
                        alt={item.product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-obsidian-900">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-platinum-600">
                        Cantidad: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-obsidian-900">
                      ${((item.product.price || 0) * item.quantity).toLocaleString('es-CL')}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6 pb-6 border-b border-pearl-200">
                <div className="flex justify-between text-sm">
                  <span className="text-platinum-600">Subtotal</span>
                  <span className="text-obsidian-900">${displaySubtotal.toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-platinum-600">Envio</span>
                  <span className="text-obsidian-900">
                    {displayShipping === 0 ? 'Gratis' : `$${displayShipping.toLocaleString('es-CL')}`}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-medium mb-6">
                <span className="text-obsidian-900">Total</span>
                <span className="text-obsidian-900">${displayTotal.toLocaleString('es-CL')}</span>
              </div>

              {/* Trust Badges */}
              <div className="pt-2">
                <TrustBadges layout="vertical" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
