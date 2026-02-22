'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Header from '../components/Header';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import { contactService } from '../lib/services/contact.service';

const WHATSAPP_NUMBER = '56932897499';

const SUBJECT_LABELS: Record<string, string> = {
  'consulta-producto': 'Consulta sobre Producto',
  pedido: 'Estado de Pedido',
  personalizado: 'Diseño Personalizado',
  devoluciones: 'Devoluciones y Cambios',
  otro: 'Otro',
};

function buildWhatsAppUrl(subject: string, message: string) {
  const parts: string[] = [];
  if (subject && SUBJECT_LABELS[subject]) {
    parts.push(`Hola, me comunico por: ${SUBJECT_LABELS[subject]}.`);
  } else {
    parts.push('Hola, me comunico desde la web de AMBER Joyas.');
  }
  if (message) {
    parts.push(message);
  }
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(parts.join('\n\n'))}`;
}

const FAQS = [
  {
    question: '¿Cuánto demoran en responder?',
    answer: 'Por WhatsApp respondemos en minutos durante horario laboral. Por email y formulario, en menos de 24 horas.',
  },
  {
    question: '¿Puedo solicitar un diseño personalizado?',
    answer: 'Sí, trabajamos diseños a medida en plata 925. Selecciona "Diseño Personalizado" en el formulario o escríbenos por WhatsApp con tu idea.',
  },
  {
    question: '¿Cuál es la política de devoluciones?',
    answer: 'Tienes 30 días para cambios y devoluciones. Las piezas deben estar en su estado original con empaque. El envío de devolución es gratuito.',
  },
  {
    question: '¿Hacen envíos a todo Chile?',
    answer: 'Sí, enviamos a todo Chile con Chilexpress y Correos de Chile. Envío gratuito en compras sobre $30.000.',
  },
];

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await contactService.sendMessage(formData);
      toast.success('¡Mensaje enviado exitosamente! Te contactaremos pronto.');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch {
      toast.error('Error al enviar el mensaje. Intenta nuevamente o escríbenos por WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-pearl-50">
      <Header />

      {/* Hero Section — Elevated with stronger value proposition */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian-900/80 via-obsidian-900/60 to-obsidian-900/40 z-10" />
        <Image
          src="https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=1920&h=800&fit=crop"
          alt="AMBER Joyas — Atención personalizada"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="text-center text-white space-y-6 px-4 animate-fade-in max-w-3xl">
            <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-amber-gold-300 font-medium">
              Atención Personalizada
            </p>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-wider"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              ¿En Qué Podemos Ayudarte?
            </h1>
            <p className="text-base sm:text-lg tracking-wide font-light max-w-xl mx-auto text-pearl-200 leading-relaxed">
              Cada consulta es importante para nosotros. Respondemos en menos de 24 horas por email y en minutos por WhatsApp.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <a
                href={buildWhatsAppUrl('', '')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-3.5 bg-[#25D366] text-white text-sm font-medium rounded-full hover:bg-[#1ebe57] transition-all duration-300 hover:shadow-lg hover:shadow-[#25D366]/25 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Respuesta Inmediata
              </a>
              <button
                onClick={scrollToForm}
                className="inline-flex items-center gap-2 px-8 py-3.5 border border-white/40 text-white text-sm font-medium rounded-full hover:bg-white/10 transition-all duration-300 cursor-pointer"
              >
                Enviar Formulario
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar — Social proof strip */}
      <section className="bg-white border-b border-pearl-200">
        <div className="container mx-auto px-4 lg:px-8 py-5">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-sm text-platinum-600">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Respuesta en <strong className="text-obsidian-900">menos de 24h</strong></span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-pearl-300" />
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0l-4.725 2.885a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
              <span><strong className="text-obsidian-900">+1.400</strong> clientes confían en nosotros</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-pearl-300" />
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <span>Garantía de <strong className="text-obsidian-900">12 meses</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Contact Channels — Above the form for hierarchy */}
      <section className="container mx-auto px-4 lg:px-8 py-16 lg:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl lg:text-4xl font-light text-obsidian-900 mb-4"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Elige Cómo Contactarnos
            </h2>
            <p className="text-platinum-600 max-w-lg mx-auto">
              Selecciona el canal que prefieras. Todos llegan directamente a nuestro equipo.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {/* WhatsApp — Primary channel */}
            <a
              href={buildWhatsAppUrl('', '')}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative bg-white p-6 rounded-xl shadow-luxury hover-lift transition-all cursor-pointer border-2 border-[#25D366]/20 hover:border-[#25D366]/50"
            >
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#25D366]/10 text-[#25D366] uppercase tracking-wider">
                  Más rápido
                </span>
              </div>
              <div className="w-12 h-12 bg-[#25D366]/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-obsidian-900 mb-1">WhatsApp</h3>
              <p className="text-sm text-platinum-600 mb-2">+56 9 3289 7499</p>
              <p className="text-xs text-[#25D366] font-medium">Respuesta en minutos</p>
            </a>

            {/* Phone */}
            <a
              href="tel:+56932897499"
              className="group bg-white p-6 rounded-xl shadow-luxury hover-lift transition-all cursor-pointer"
            >
              <div className="w-12 h-12 bg-amber-gold-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-amber-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-obsidian-900 mb-1">Teléfono</h3>
              <p className="text-sm text-platinum-600 mb-2">+56 9 3289 7499</p>
              <p className="text-xs text-platinum-500">Lun - Vie: 10:00 - 19:00</p>
            </a>

            {/* Email */}
            <a
              href="mailto:contacto@amberjoyeria.cl"
              className="group bg-white p-6 rounded-xl shadow-luxury hover-lift transition-all cursor-pointer"
            >
              <div className="w-12 h-12 bg-amber-gold-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-amber-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-obsidian-900 mb-1">Email</h3>
              <p className="text-sm text-platinum-600 mb-2">contacto@amberjoyeria.cl</p>
              <p className="text-xs text-platinum-500">Respuesta en 24 horas</p>
            </a>

            {/* Visit */}
            <div className="group bg-white p-6 rounded-xl shadow-luxury hover-lift transition-all">
              <div className="w-12 h-12 bg-amber-gold-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-amber-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-obsidian-900 mb-1">Visítanos</h3>
              <p className="text-sm text-platinum-600 mb-1">Av. Alonso de Córdova 5320</p>
              <p className="text-xs text-platinum-500">Las Condes, Santiago</p>
            </div>
          </div>
        </div>
      </section>

      {/* Form + Info Section */}
      <section className="bg-white">
        <div className="container mx-auto px-4 lg:px-8 py-16 lg:py-24">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
              {/* Contact Form — 3 columns */}
              <div className="lg:col-span-3">
                <div className="mb-8">
                  <h2
                    className="text-3xl lg:text-4xl font-light text-obsidian-900 mb-4"
                    style={{ fontFamily: 'var(--font-cormorant)' }}
                  >
                    Envíanos un Mensaje
                  </h2>
                  <p className="text-platinum-600">
                    Completa el formulario y te responderemos en menos de 24 horas. Los campos marcados con * son obligatorios.
                  </p>
                </div>

                <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
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
                      placeholder="Tu nombre completo"
                      className="w-full px-4 py-3.5 bg-pearl-50 border border-pearl-300 rounded-lg focus:border-amber-gold-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-gold-500/20 transition-all duration-200"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                        placeholder="tu@email.com"
                        className="w-full px-4 py-3.5 bg-pearl-50 border border-pearl-300 rounded-lg focus:border-amber-gold-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-gold-500/20 transition-all duration-200"
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
                        placeholder="+56 9 1234 5678"
                        className="w-full px-4 py-3.5 bg-pearl-50 border border-pearl-300 rounded-lg focus:border-amber-gold-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-gold-500/20 transition-all duration-200"
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
                      className="w-full px-4 py-3.5 bg-pearl-50 border border-pearl-300 rounded-lg focus:border-amber-gold-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-gold-500/20 transition-all duration-200 cursor-pointer"
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
                      rows={5}
                      placeholder="Cuéntanos cómo podemos ayudarte..."
                      className="w-full px-4 py-3.5 bg-pearl-50 border border-pearl-300 rounded-lg focus:border-amber-gold-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-gold-500/20 transition-all duration-200 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium rounded-lg hover:bg-amber-gold-500 hover:text-obsidian-900 transition-all duration-300 disabled:bg-platinum-400 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Enviando...
                      </span>
                    ) : (
                      'Enviar Mensaje'
                    )}
                  </button>

                  {/* Reassurance below submit */}
                  <div className="flex items-center justify-center gap-4 pt-1 text-xs text-platinum-500">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      Datos protegidos
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Respuesta en 24h
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      Sin spam
                    </span>
                  </div>
                </form>

                {/* WhatsApp alternative — contextual CTA */}
                <div className="mt-10 p-6 bg-pearl-50 rounded-xl border border-pearl-200">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-12 h-12 bg-[#25D366]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </div>
                    <div className="text-center sm:text-left flex-1">
                      <p className="text-sm font-medium text-obsidian-900">¿Prefieres una respuesta más rápida?</p>
                      <p className="text-xs text-platinum-600 mt-0.5">Tu mensaje del formulario se enviará automáticamente</p>
                    </div>
                    <a
                      href={buildWhatsAppUrl(formData.subject, formData.message)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] text-white text-sm font-medium rounded-lg hover:bg-[#1ebe57] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Abrir WhatsApp
                    </a>
                  </div>
                </div>
              </div>

              {/* Sidebar — FAQ + Social — 2 columns */}
              <div className="lg:col-span-2 space-y-10">
                {/* FAQ Section */}
                <div>
                  <h3
                    className="text-2xl font-light text-obsidian-900 mb-6"
                    style={{ fontFamily: 'var(--font-cormorant)' }}
                  >
                    Preguntas Frecuentes
                  </h3>
                  <div className="space-y-3">
                    {FAQS.map((faq, index) => (
                      <div
                        key={index}
                        className="border border-pearl-200 rounded-lg overflow-hidden transition-colors hover:border-pearl-300"
                      >
                        <button
                          onClick={() => setOpenFaq(openFaq === index ? null : index)}
                          className="w-full flex items-center justify-between gap-3 p-4 text-left cursor-pointer"
                        >
                          <span className="text-sm font-medium text-obsidian-900">{faq.question}</span>
                          <svg
                            className={`w-4 h-4 text-platinum-500 flex-shrink-0 transition-transform duration-200 ${
                              openFaq === index ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <div
                          className={`overflow-hidden transition-all duration-300 ${
                            openFaq === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                          }`}
                        >
                          <p className="px-4 pb-4 text-sm text-platinum-600 leading-relaxed">{faq.answer}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Business hours */}
                <div className="bg-pearl-50 p-6 rounded-xl border border-pearl-200">
                  <h3 className="text-lg font-medium text-obsidian-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Horario de Atención
                  </h3>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-platinum-600">Lunes - Viernes</span>
                      <span className="font-medium text-obsidian-900">10:00 - 19:00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-platinum-600">Sábado</span>
                      <span className="font-medium text-obsidian-900">11:00 - 15:00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-platinum-600">Domingo</span>
                      <span className="text-platinum-500">Cerrado</span>
                    </div>
                    <div className="separator-luxury my-3" />
                    <p className="text-xs text-platinum-500">
                      WhatsApp disponible fuera de horario — respondemos al siguiente día hábil.
                    </p>
                  </div>
                </div>

                {/* Social Media */}
                <div>
                  <h3 className="text-lg font-medium text-obsidian-900 mb-4">Síguenos</h3>
                  <div className="flex gap-3">
                    <a
                      href="https://facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                      className="w-11 h-11 flex items-center justify-center border border-pearl-300 rounded-lg hover:border-amber-gold-500 hover:bg-amber-gold-50 transition-all duration-200 cursor-pointer"
                    >
                      <svg className="w-5 h-5 text-obsidian-700" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </a>
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      className="w-11 h-11 flex items-center justify-center border border-pearl-300 rounded-lg hover:border-amber-gold-500 hover:bg-amber-gold-50 transition-all duration-200 cursor-pointer"
                    >
                      <svg className="w-5 h-5 text-obsidian-700" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    </a>
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
