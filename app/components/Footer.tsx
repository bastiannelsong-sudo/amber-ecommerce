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
      toast.success('Gracias por suscribirte! Revisa tu correo para tu codigo de descuento.');
      setEmail('');
    }
  };

  return (
    <footer className="bg-obsidian-900 text-white mt-12 sm:mt-24">
      {/* Newsletter Section - con incentivo */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 lg:px-8 py-10 sm:py-16">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-gold-400 font-medium mb-3">
              Exclusivo para suscriptoras
            </p>
            <h3
              className="text-2xl sm:text-3xl lg:text-4xl font-light mb-3 sm:mb-4"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              10% de Descuento en tu Primera Compra
            </h3>
            <p className="text-pearl-300 mb-8">
              Suscribete y recibe tu codigo de descuento exclusivo, acceso anticipado a nuevas colecciones y ofertas especiales.
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
                Obtener 10%
              </button>
            </form>
            <p className="text-[11px] text-platinum-600 mt-3">
              Sin spam. Solo joyas, descuentos y novedades.
            </p>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Brand Column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-6">
              <Image
                src="/logo_amarillo.png"
                alt="Amber"
                width={180}
                height={180}
                className="h-28 lg:h-32 object-contain -ml-4"
                style={{ width: 'auto' }}
              />
            </div>
            <p className="text-pearl-300 leading-relaxed mb-6">
              Joyeria en Plata 925 y amuletos de proteccion con significado. Mas de 1.400 clientas confian en nosotros.
            </p>

            {/* Redes Sociales */}
            <div className="flex items-center gap-3 mb-6">
              <a
                href="https://www.instagram.com/amber.joyeria"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 flex items-center justify-center border border-white/20 hover:border-amber-gold-500 hover:bg-amber-gold-500/10 text-pearl-300 hover:text-amber-gold-400 transition-all duration-300"
              >
                <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@amber.joyeria"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="w-10 h-10 flex items-center justify-center border border-white/20 hover:border-amber-gold-500 hover:bg-amber-gold-500/10 text-pearl-300 hover:text-amber-gold-400 transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48v-7.1a8.16 8.16 0 005.58 2.2v-3.45a4.85 4.85 0 01-1.81-.35 4.86 4.86 0 01-1.19-.69V6.69h3z" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/amber.joyeria"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-10 h-10 flex items-center justify-center border border-white/20 hover:border-amber-gold-500 hover:bg-amber-gold-500/10 text-pearl-300 hover:text-amber-gold-400 transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            </div>

            {/* Contacto de ayuda */}
            <p className="text-sm text-pearl-400">
              Necesitas ayuda? <a href="/contacto" className="text-amber-gold-400 hover:text-amber-gold-300 underline underline-offset-4 transition-colors">Contactanos</a>
            </p>
          </div>

          {/* Categorías */}
          <div>
            <h4 className="text-sm font-medium mb-4 sm:mb-6 uppercase tracking-wider">Categorías</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/pulseras" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Pulseras
                </Link>
              </li>
              <li>
                <Link href="/collares" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Collares
                </Link>
              </li>
              <li>
                <Link href="/aros" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Aros
                </Link>
              </li>
              <li>
                <Link href="/anillos" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Anillos
                </Link>
              </li>
              <li>
                <Link href="/cadenas" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Cadenas
                </Link>
              </li>
              <li>
                <Link href="/conjuntos" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Conjuntos
                </Link>
              </li>
              <li>
                <Link href="/medallas" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Medallas y prendedores
                </Link>
              </li>
              <li>
                <Link href="/catalogo" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Ver todo el catálogo
                </Link>
              </li>
            </ul>
          </div>

          {/* Amuletos */}
          <div>
            <h4 className="text-sm font-medium mb-4 sm:mb-6 uppercase tracking-wider">Amuletos</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/amuletos/san-benito" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  San Benito
                </Link>
              </li>
              <li>
                <Link href="/amuletos/nudo-de-brujas" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Nudo de Brujas
                </Link>
              </li>
              <li>
                <Link href="/amuletos/hilo-rojo" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Hilo Rojo
                </Link>
              </li>
              <li>
                <Link href="/amuletos/mano-de-fatima" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Mano de Fátima
                </Link>
              </li>
              <li>
                <Link href="/amuletos/ojo-turco" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Ojo Turco
                </Link>
              </li>
              <li>
                <Link href="/amuletos/arbol-de-la-vida" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Árbol de la Vida
                </Link>
              </li>
              <li>
                <Link href="/amuletos/regalo" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Ideas de regalo
                </Link>
              </li>
              <li>
                <Link href="/colecciones" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Ver colecciones
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
                  Garantía
                </Link>
              </li>
              <li>
                <Link href="/envios" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Envíos
                </Link>
              </li>
              <li>
                <Link href="/lookbook" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Lookbook
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Contacto
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
                  Políticas de Devolución
                </Link>
              </li>
              <li>
                <Link href="/terminos-condiciones" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="text-pearl-300 hover:text-amber-gold-400 transition-colors">
                  Política de Privacidad
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Metodos de Pago + Trust */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="flex flex-col items-center gap-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-platinum-600 font-medium">
              Metodos de pago seguros
            </p>
            <div className="flex items-center gap-5 flex-wrap justify-center">
              {/* Visa */}
              <div className="flex items-center gap-1.5 text-pearl-400 opacity-70 hover:opacity-100 transition-opacity">
                <svg className="w-10 h-7" viewBox="0 0 48 32" fill="none">
                  <rect width="48" height="32" rx="4" fill="#1A1F71"/>
                  <path d="M19.5 21H17L18.8 11H21.3L19.5 21ZM15.3 11L12.9 18L12.6 16.5L11.7 12C11.7 12 11.6 11 10.2 11H6.1L6 11.2C6 11.2 7.6 11.5 9.4 12.6L11.6 21H14.2L17.9 11H15.3ZM35 21H37.3L35.3 11H33.3C32.1 11 31.8 11.9 31.8 11.9L28.1 21H30.7L31.2 19.5H34.4L34.7 21H35ZM32 17.5L33.3 13.8L34 17.5H32ZM28.2 13.5L28.5 11.7C28.5 11.7 27.1 11.2 25.6 11.2C24 11.2 20.5 11.8 20.5 15C20.5 17.9 24.5 17.9 24.5 19.4C24.5 20.9 21 20.7 19.7 19.7L19.4 21.6C19.4 21.6 20.8 22.2 22.8 22.2C24.8 22.2 27.7 21.1 27.7 18.2C27.7 15.2 23.7 15 23.7 13.7C23.7 12.4 26.4 12.5 27.5 13.2L28.2 13.5Z" fill="white"/>
                </svg>
              </div>
              {/* Mastercard */}
              <div className="flex items-center gap-1.5 text-pearl-400 opacity-70 hover:opacity-100 transition-opacity">
                <svg className="w-10 h-7" viewBox="0 0 48 32" fill="none">
                  <rect width="48" height="32" rx="4" fill="#252525"/>
                  <circle cx="19" cy="16" r="8" fill="#EB001B"/>
                  <circle cx="29" cy="16" r="8" fill="#F79E1B"/>
                  <path d="M24 9.8A8 8 0 0024 22.2 8 8 0 0024 9.8Z" fill="#FF5F00"/>
                </svg>
              </div>
              {/* Mercado Pago */}
              <div className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity">
                <div className="bg-[#00B1EA] px-2 py-1 rounded flex items-center gap-1">
                  <span className="text-white text-[10px] font-bold tracking-tight">Mercado Pago</span>
                </div>
              </div>
              {/* Transferencia */}
              <div className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity">
                <div className="border border-white/30 px-2.5 py-1 rounded flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-pearl-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                  <span className="text-pearl-400 text-[10px] font-medium">Transferencia</span>
                </div>
              </div>
            </div>
            {/* Trust seals */}
            <div className="flex items-center gap-6 text-platinum-500">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <span className="text-[10px] uppercase tracking-wider">Compra segura SSL</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <span className="text-[10px] uppercase tracking-wider">Datos protegidos</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-pearl-400">
            <p>&copy; 2026 AMBER Joyas. Todos los derechos reservados.</p>
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
