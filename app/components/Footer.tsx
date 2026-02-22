'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast.success('Gracias por suscribirte!');
      setEmail('');
    }
  };

  return (
    <footer className="bg-obsidian-900 text-white mt-12 sm:mt-24">
      {/* Newsletter Section */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 lg:px-8 py-10 sm:py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h3
              className="text-2xl sm:text-3xl lg:text-4xl font-light mb-3 sm:mb-4"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Unete a Nuestra Comunidad
            </h3>
            <p className="text-pearl-300 mb-8">
              Recibe noticias exclusivas, ofertas especiales y las ultimas novedades antes que nadie.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Tu correo electronico"
                required
                className="flex-1 px-6 py-4 bg-white/10 border border-white/20 text-white placeholder-pearl-400 focus:outline-none focus:border-amber-gold-500 transition-colors"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-amber-gold-500 text-obsidian-900 text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-400 transition-colors whitespace-nowrap cursor-pointer"
              >
                Suscribirse
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-6">
              <Image
                src="/logo_claro.jpeg"
                alt="Amber"
                width={120}
                height={40}
                className="h-10"
                style={{ width: 'auto' }}
              />
            </div>
            <p className="text-pearl-300 leading-relaxed mb-6">
              Joyeria en Plata 925 y amuletos de proteccion con significado. Mas de 1.400 personas confian en nosotros.
            </p>
            {/* WhatsApp prominente */}
            <a
              href="https://wa.me/56932897499"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#25D366] text-white text-sm font-medium rounded-lg hover:bg-[#20BD5A] transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Escribenos por WhatsApp
            </a>
          </div>

          {/* Tienda */}
          <div>
            <h4 className="text-sm font-medium mb-4 sm:mb-6 uppercase tracking-wider">Tienda</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/catalogo" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Catalogo
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Acerca de */}
          <div>
            <h4 className="text-sm font-medium mb-4 sm:mb-6 uppercase tracking-wider">Acerca de</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/sobre-nosotros" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Nuestra Historia
                </Link>
              </li>
              <li>
                <Link href="/garantia" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Garantia
                </Link>
              </li>
              <li>
                <Link href="/envios" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Envios
                </Link>
              </li>
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <h4 className="text-sm font-medium mb-4 sm:mb-6 uppercase tracking-wider">Ayuda</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/preguntas-frecuentes" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Preguntas Frecuentes
                </Link>
              </li>
              <li>
                <Link href="/politicas-devolucion" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Politicas de Devolucion
                </Link>
              </li>
              <li>
                <Link href="/terminos-condiciones" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Terminos y Condiciones
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-pearl-400">
            <p>&copy; 2025 AMBER Joyas. Todos los derechos reservados.</p>
            <p className="flex items-center gap-1">
              Hecho con
              <svg className="w-3.5 h-3.5 text-amber-gold-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              en Chile
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
