'use client';

import { useState } from 'react';
import Image from 'next/image';
import Header from '../components/Header';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      toast.success('¡Mensaje enviado exitosamente! Te contactaremos pronto.');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-pearl-50">
      <Header />

      {/* Hero Section */}
      <section className="relative h-[40vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian-900/70 to-obsidian-900/50 z-10" />
        <Image
          src="https://images.unsplash.com/photo-1596009190743-cde170386fae?w=1920&h=800&fit=crop"
          alt="Contacto"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="text-center text-white space-y-4 px-4 animate-fade-in">
            <h1
              className="text-5xl lg:text-6xl font-light tracking-wider"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Contáctanos
            </h1>
            <p className="text-lg lg:text-xl tracking-wide font-light max-w-2xl mx-auto">
              Estamos aquí para ayudarte
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="container mx-auto px-4 lg:px-8 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div>
              <h2
                className="text-3xl lg:text-4xl font-light text-obsidian-900 mb-6"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                Envíanos un Mensaje
              </h2>
              <p className="text-platinum-600 mb-8">
                Completa el formulario y nos pondremos en contacto contigo lo antes posible.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-obsidian-900 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-obsidian-900 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-obsidian-900 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-obsidian-900 mb-2">
                    Asunto *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none transition-colors"
                  >
                    <option value="">Selecciona un asunto</option>
                    <option value="consulta-producto">Consulta sobre Producto</option>
                    <option value="pedido">Estado de Pedido</option>
                    <option value="personalizado">Diseño Personalizado</option>
                    <option value="devoluciones">Devoluciones y Cambios</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-obsidian-900 mb-2">
                    Mensaje *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors disabled:bg-platinum-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-12">
              <div>
                <h2
                  className="text-3xl lg:text-4xl font-light text-obsidian-900 mb-6"
                  style={{ fontFamily: 'var(--font-cormorant)' }}
                >
                  Información de Contacto
                </h2>
                <p className="text-platinum-600 mb-8">
                  Visítanos en nuestro atelier o comunícate con nosotros a través de los siguientes canales.
                </p>
              </div>

              {/* Contact Cards */}
              <div className="space-y-6">
                {/* Address */}
                <div className="bg-white p-6 rounded-lg shadow-luxury hover-lift transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-gold-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-amber-gold-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-obsidian-900 mb-2">Dirección</h3>
                      <p className="text-platinum-700 leading-relaxed">
                        Av. Alonso de Córdova 5320<br />
                        Las Condes, Santiago<br />
                        Región Metropolitana
                      </p>
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="bg-white p-6 rounded-lg shadow-luxury hover-lift transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-gold-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-amber-gold-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-obsidian-900 mb-2">Teléfono</h3>
                      <p className="text-platinum-700">
                        <a href="tel:+56912345678" className="hover:text-amber-gold-600 transition-colors">
                          +56 9 1234 5678
                        </a>
                      </p>
                      <p className="text-sm text-platinum-600 mt-1">Lun - Vie: 10:00 - 19:00</p>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="bg-white p-6 rounded-lg shadow-luxury hover-lift transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-gold-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-amber-gold-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-obsidian-900 mb-2">Email</h3>
                      <p className="text-platinum-700">
                        <a href="mailto:contacto@amber.cl" className="hover:text-amber-gold-600 transition-colors">
                          contacto@amber.cl
                        </a>
                      </p>
                      <p className="text-sm text-platinum-600 mt-1">Respuesta en 24 horas</p>
                    </div>
                  </div>
                </div>

                {/* Social */}
                <div className="bg-white p-6 rounded-lg shadow-luxury hover-lift transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-gold-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-amber-gold-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-obsidian-900 mb-3">Redes Sociales</h3>
                      <div className="flex gap-3">
                        <a
                          href="https://facebook.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 flex items-center justify-center border border-pearl-300 hover:border-amber-gold-500 hover:bg-amber-gold-50 transition-colors"
                        >
                          <svg className="w-5 h-5 text-obsidian-900" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                        </a>
                        <a
                          href="https://instagram.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 flex items-center justify-center border border-pearl-300 hover:border-amber-gold-500 hover:bg-amber-gold-50 transition-colors"
                        >
                          <svg className="w-5 h-5 text-obsidian-900" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="bg-pearl-200 h-64 rounded-lg overflow-hidden shadow-luxury">
                <div className="w-full h-full flex items-center justify-center text-platinum-600">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-2 text-platinum-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm">Mapa de ubicación</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
