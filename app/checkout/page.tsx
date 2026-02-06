'use client';

import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CheckoutProgressBar from '../components/marketing/CheckoutProgressBar';
import TrustBadges from '../components/marketing/TrustBadges';
import { useCartStore } from '../lib/stores/cart.store';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const getTotal = useCartStore((state) => state.getTotal());
  const clearCart = useCartStore((state) => state.clearCart);

  const [step, setStep] = useState<'shipping' | 'payment' | 'confirmation'>('shipping');
  const [formData, setFormData] = useState({
    // Shipping
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    apartment: '',
    city: '',
    region: '',
    postalCode: '',
    // Payment
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvv: '',
  });

  const subtotal = getTotal;
  const shipping = subtotal > 50000 ? 0 : 5000;
  const total = subtotal + shipping;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    if (!formData.cardNumber || !formData.cardName || !formData.cardExpiry || !formData.cardCvv) {
      toast.error('Por favor completa todos los campos de pago');
      return;
    }

    // Simulate payment processing
    toast.loading('Procesando pago...', { duration: 2000 });

    setTimeout(() => {
      setStep('confirmation');
      toast.success('¡Pago procesado exitosamente!');
    }, 2000);
  };

  if (items.length === 0 && step !== 'confirmation') {
    router.push('/carrito');
    return null;
  }

  return (
    <div className="min-h-screen bg-pearl-50">
      <Header />

      <div className="container mx-auto px-4 lg:px-8 py-12">
        {/* Progress Steps */}
        <CheckoutProgressBar currentStep={step} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Forms */}
          <div className="lg:col-span-2">
            {/* Shipping Form */}
            {step === 'shipping' && (
              <form onSubmit={handleSubmitShipping} className="bg-white p-8 shadow-luxury">
                <h2
                  className="text-3xl font-light text-obsidian-900 mb-8 pb-4 border-b border-pearl-200"
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
                        <option value="metropolitana">Metropolitana</option>
                        <option value="valparaiso">Valparaíso</option>
                        <option value="biobio">Biobío</option>
                        <option value="araucania">Araucanía</option>
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
                    className="w-full py-4 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors"
                  >
                    Continuar al Pago
                  </button>
                </div>
              </form>
            )}

            {/* Payment Form */}
            {step === 'payment' && (
              <form onSubmit={handleSubmitPayment} className="bg-white p-8 shadow-luxury">
                <h2
                  className="text-3xl font-light text-obsidian-900 mb-8 pb-4 border-b border-pearl-200"
                  style={{ fontFamily: 'var(--font-cormorant)' }}
                >
                  Información de Pago
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-obsidian-900 mb-2">
                      Número de Tarjeta *
                    </label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      required
                      maxLength={19}
                      className="w-full px-4 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none transition-colors"
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-obsidian-900 mb-2">
                      Nombre en la Tarjeta *
                    </label>
                    <input
                      type="text"
                      name="cardName"
                      value={formData.cardName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none transition-colors"
                      placeholder="JUAN PÉREZ"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-obsidian-900 mb-2">
                        Fecha de Expiración *
                      </label>
                      <input
                        type="text"
                        name="cardExpiry"
                        value={formData.cardExpiry}
                        onChange={handleInputChange}
                        required
                        maxLength={5}
                        className="w-full px-4 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none transition-colors"
                        placeholder="MM/AA"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-obsidian-900 mb-2">
                        CVV *
                      </label>
                      <input
                        type="text"
                        name="cardCvv"
                        value={formData.cardCvv}
                        onChange={handleInputChange}
                        required
                        maxLength={4}
                        className="w-full px-4 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none transition-colors"
                        placeholder="123"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setStep('shipping')}
                      className="flex-1 py-4 border-2 border-obsidian-900 text-obsidian-900 text-sm uppercase tracking-widest font-medium hover:bg-obsidian-900 hover:text-white transition-colors"
                    >
                      Volver
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-4 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors"
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
                    className="text-4xl lg:text-5xl font-light text-obsidian-900 mb-4"
                    style={{ fontFamily: 'var(--font-cormorant)' }}
                  >
                    ¡Pedido Confirmado!
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
                      #AMB{Math.floor(Math.random() * 10000)}
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

                    {/* Payment Method */}
                    <div className="border border-pearl-200 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-obsidian-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Método de Pago
                      </h3>
                      <div className="text-sm text-platinum-700 space-y-2">
                        <p className="font-medium">Tarjeta de Crédito</p>
                        <p>•••• •••• •••• {formData.cardNumber.slice(-4)}</p>
                        <p className="text-green-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Pago Procesado
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="text-lg font-medium text-obsidian-900 mb-4">Productos Ordenados</h3>
                    <div className="border border-pearl-200 rounded-lg divide-y divide-pearl-200">
                      {items.map((item) => (
                        <div key={item.product.product_id} className="p-4 flex items-center gap-4">
                          <div className="w-20 h-20 bg-pearl-100 flex-shrink-0 rounded overflow-hidden">
                            <img
                              src={item.product.image_url || ''}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
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
                        <span className="text-obsidian-900">${subtotal.toLocaleString('es-CL')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-platinum-600">Envío</span>
                        <span className="text-obsidian-900">
                          {shipping === 0 ? 'Gratis' : `$${shipping.toLocaleString('es-CL')}`}
                        </span>
                      </div>
                      <div className="pt-3 border-t border-pearl-200 flex justify-between">
                        <span className="font-medium text-obsidian-900 text-lg">Total Pagado</span>
                        <span className="font-medium text-obsidian-900 text-lg">${total.toLocaleString('es-CL')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button
                      onClick={() => {
                        clearCart();
                        router.push('/');
                      }}
                      className="flex-1 py-4 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors"
                    >
                      Ir al Inicio
                    </button>
                    <a
                      href="/catalogo"
                      className="flex-1 py-4 text-center border-2 border-obsidian-900 text-obsidian-900 text-sm uppercase tracking-widest font-medium hover:bg-obsidian-900 hover:text-white transition-colors"
                    >
                      Seguir Comprando
                    </a>
                  </div>

                  {/* Help Section */}
                  <div className="border-t border-pearl-200 pt-6 text-center">
                    <p className="text-sm text-platinum-600 mb-3">¿Necesitas ayuda con tu pedido?</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
                      <a href="/contacto" className="text-amber-gold-600 hover:text-amber-gold-700 font-medium">
                        Contáctanos
                      </a>
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
                {items.map((item) => (
                  <div key={item.product.product_id} className="flex gap-4">
                    <div className="w-16 h-16 bg-pearl-100 flex-shrink-0 rounded overflow-hidden">
                      <img
                        src={item.product.image_url || ''}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
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
                  <span className="text-obsidian-900">${subtotal.toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-platinum-600">Envío</span>
                  <span className="text-obsidian-900">
                    {shipping === 0 ? 'Gratis' : `$${shipping.toLocaleString('es-CL')}`}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-medium mb-6">
                <span className="text-obsidian-900">Total</span>
                <span className="text-obsidian-900">${total.toLocaleString('es-CL')}</span>
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
