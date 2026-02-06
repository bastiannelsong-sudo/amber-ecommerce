'use client';

import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';

export default function GiftCardPage() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(50000);
  const [customAmount, setCustomAmount] = useState('');
  const [formData, setFormData] = useState({
    senderName: '',
    senderEmail: '',
    recipientName: '',
    recipientEmail: '',
    message: '',
    deliveryDate: '',
  });

  const predefinedAmounts = [25000, 50000, 100000, 150000, 200000];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = selectedAmount || parseInt(customAmount);

    if (!amount || amount < 10000) {
      toast.error('El monto mínimo es $10.000');
      return;
    }

    toast.success('¡Gift Card creada! Redirigiendo al pago...');
    // Redirect to checkout logic here
  };

  return (
    <div className="min-h-screen bg-pearl-50">
      <Header />

      {/* Hero */}
      <section className="relative h-[50vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-gold-900/80 to-amber-gold-800/70 z-10" />
        <img
          src="https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=1920&h=800&fit=crop"
          alt="Gift Card"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 z-20 flex items-center justify-center px-4">
          <div className="text-center text-white max-w-3xl">
            <h1
              className="text-5xl lg:text-7xl font-light mb-4"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Gift Card Virtual
            </h1>
            <p className="text-xl font-light">
              El regalo perfecto para quienes amas. Elegancia que perdura.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 lg:px-8 py-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Form */}
          <div>
            <h2
              className="text-4xl font-light text-obsidian-900 mb-8"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Personaliza tu Gift Card
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount Selection */}
              <div>
                <label className="block text-sm font-medium text-obsidian-900 mb-4">
                  Selecciona el Monto
                </label>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {predefinedAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amount);
                        setCustomAmount('');
                      }}
                      className={`py-4 rounded-lg border-2 transition-all ${
                        selectedAmount === amount
                          ? 'border-amber-gold-500 bg-amber-gold-50 text-amber-gold-700'
                          : 'border-pearl-300 hover:border-amber-gold-300'
                      }`}
                    >
                      ${amount.toLocaleString('es-CL')}
                    </button>
                  ))}
                  <div className="col-span-3">
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setSelectedAmount(null);
                      }}
                      placeholder="Otro monto (mín. $10.000)"
                      className="w-full px-4 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Sender Info */}
              <div className="space-y-4">
                <h3 className="font-medium text-obsidian-900">Tus Datos</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    value={formData.senderName}
                    onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                    placeholder="Tu nombre"
                    className="px-4 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none"
                  />
                  <input
                    type="email"
                    required
                    value={formData.senderEmail}
                    onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                    placeholder="Tu email"
                    className="px-4 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Recipient Info */}
              <div className="space-y-4">
                <h3 className="font-medium text-obsidian-900">Destinatario</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    placeholder="Nombre del destinatario"
                    className="px-4 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none"
                  />
                  <input
                    type="email"
                    required
                    value={formData.recipientEmail}
                    onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                    placeholder="Email del destinatario"
                    className="px-4 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Message & Delivery */}
              <div>
                <label className="block text-sm font-medium text-obsidian-900 mb-2">
                  Mensaje Personal (Opcional)
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  placeholder="Escribe un mensaje especial..."
                  className="w-full px-4 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-obsidian-900 mb-2">
                  Fecha de Entrega
                </label>
                <input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none"
                />
                <p className="text-sm text-platinum-600 mt-2">
                  Dejar vacío para envío inmediato
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors"
              >
                Continuar al Pago
              </button>
            </form>
          </div>

          {/* Preview Card */}
          <div>
            <h2
              className="text-4xl font-light text-obsidian-900 mb-8"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Vista Previa
            </h2>

            <div className="sticky top-24">
              <div className="bg-gradient-to-br from-obsidian-900 via-obsidian-800 to-amber-gold-900 p-8 rounded-lg shadow-2xl text-white aspect-[16/10] flex flex-col justify-between relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-gold-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />

                <div className="relative z-10">
                  <img
                    src="/logo_claro.jpeg"
                    alt="Amber"
                    className="h-8 w-auto object-contain mb-6"
                  />
                  <p className="text-sm uppercase tracking-widest text-pearl-300">Gift Card</p>
                </div>

                <div className="relative z-10">
                  {formData.recipientName && (
                    <p className="text-sm text-pearl-300 mb-2">Para: {formData.recipientName}</p>
                  )}
                  <p
                    className="text-5xl font-light"
                    style={{ fontFamily: 'var(--font-cormorant)' }}
                  >
                    ${(selectedAmount || parseInt(customAmount) || 0).toLocaleString('es-CL')}
                  </p>
                  {formData.message && (
                    <p className="text-sm text-pearl-300 mt-4 italic">"{formData.message}"</p>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="mt-8 space-y-4">
                {[
                  { icon: '✓', text: 'Válida por 12 meses' },
                  { icon: '✓', text: 'Entrega inmediata por email' },
                  { icon: '✓', text: 'Sin costos de mantenimiento' },
                  { icon: '✓', text: 'Válida en todo el catálogo' },
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 text-platinum-700">
                    <span className="w-6 h-6 bg-amber-gold-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {feature.icon}
                    </span>
                    {feature.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
