'use client';

import { useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast.success('¡Gracias por suscribirte!');
      setEmail('');
    }
  };

  return (
    <footer className="bg-obsidian-900 text-white mt-24">
      {/* Newsletter Section */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h3
              className="text-3xl lg:text-4xl font-light mb-4"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Únete a Nuestra Comunidad
            </h3>
            <p className="text-pearl-300 mb-8">
              Recibe noticias exclusivas, ofertas especiales y las últimas colecciones antes que nadie.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Tu correo electrónico"
                required
                className="flex-1 px-6 py-4 bg-white/10 border border-white/20 text-white placeholder-pearl-400 focus:outline-none focus:border-amber-gold-500 transition-colors"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-amber-gold-500 text-obsidian-900 text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-400 transition-colors whitespace-nowrap"
              >
                Suscribirse
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <Image
                src="/logo_claro.jpeg"
                alt="Amber"
                width={120}
                height={40}
                className="h-10 w-auto"
              />
            </div>
            <p className="text-pearl-300 leading-relaxed mb-6">
              Joyería artesanal de lujo desde 2004. Cada pieza es única y creada con los más altos
              estándares de calidad y elegancia.
            </p>
            <div className="flex gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center border border-white/20 hover:border-amber-gold-500 hover:bg-amber-gold-500/10 transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center border border-white/20 hover:border-amber-gold-500 hover:bg-amber-gold-500/10 transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="https://pinterest.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center border border-white/20 hover:border-amber-gold-500 hover:bg-amber-gold-500/10 transition-colors"
                aria-label="Pinterest"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.627 0-12 5.372-12 12 0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center border border-white/20 hover:border-amber-gold-500 hover:bg-amber-gold-500/10 transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="text-lg font-medium mb-6 uppercase tracking-wider">Tienda</h4>
            <ul className="space-y-3">
              <li>
                <a href="/catalogo" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Catálogo
                </a>
              </li>
              <li>
                <a href="/colecciones" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Colecciones
                </a>
              </li>
              <li>
                <a href="/favoritos" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Favoritos
                </a>
              </li>
              <li>
                <a href="/carrito" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Carrito
                </a>
              </li>
            </ul>
          </div>

          {/* About Links */}
          <div>
            <h4 className="text-lg font-medium mb-6 uppercase tracking-wider">Acerca de</h4>
            <ul className="space-y-3">
              <li>
                <a href="/sobre-nosotros" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Nuestra Historia
                </a>
              </li>
              <li>
                <a href="/contacto" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Contacto
                </a>
              </li>
              <li>
                <a href="#" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Garantía
                </a>
              </li>
              <li>
                <a href="#" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Envíos
                </a>
              </li>
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <h4 className="text-lg font-medium mb-6 uppercase tracking-wider">Ayuda</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Preguntas Frecuentes
                </a>
              </li>
              <li>
                <a href="#" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Políticas de Devolución
                </a>
              </li>
              <li>
                <a href="#" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Términos y Condiciones
                </a>
              </li>
              <li>
                <a href="#" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Privacidad
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm text-pearl-300">Métodos de pago:</span>
              <div className="flex gap-3">
                <div className="w-12 h-8 bg-white/10 rounded flex items-center justify-center text-xs text-pearl-300">
                  VISA
                </div>
                <div className="w-12 h-8 bg-white/10 rounded flex items-center justify-center text-xs text-pearl-300">
                  MC
                </div>
                <div className="w-12 h-8 bg-white/10 rounded flex items-center justify-center text-xs text-pearl-300">
                  AMEX
                </div>
                <div className="w-12 h-8 bg-white/10 rounded flex items-center justify-center text-xs text-pearl-300">
                  FLOW
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm text-pearl-300">Envíos con:</span>
              <div className="flex gap-3">
                <div className="px-3 h-8 bg-white/10 rounded flex items-center justify-center text-xs text-pearl-300">
                  Chilexpress
                </div>
                <div className="px-3 h-8 bg-white/10 rounded flex items-center justify-center text-xs text-pearl-300">
                  Correos
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-pearl-400">
            <p>&copy; 2025 Amber Joyeria. Todos los derechos reservados.</p>
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
