'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SearchModal from './SearchModal';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      if (y > 60) setIsScrolled(true);
      else if (y < 10) setIsScrolled(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-white/98 backdrop-blur-xl shadow-luxury'
          : 'bg-white/95 backdrop-blur-md'
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        {/* Barra superior - envio gratis */}
        <div
          className={`border-b border-pearl-200/60 overflow-hidden transition-all duration-500 ${
            isScrolled ? 'max-h-0 py-0 opacity-0' : 'max-h-12 py-2.5 opacity-100'
          }`}
        >
          <p className="text-center text-xs text-platinum-600 tracking-widest uppercase">
            Envio gratuito en compras sobre $30.000 &nbsp;&middot;&nbsp; Plata 925 certificada &nbsp;&middot;&nbsp; Garantia 12 meses
          </p>
        </div>

        {/* Navegacion principal */}
        <nav className="flex items-center justify-between py-4 lg:py-5">
          {/* Logo */}
          <div className="flex-1">
            <Link href="/" className="inline-block group">
              <Image
                src="/logo_oscuro.jpeg"
                alt="Amber Joyeria"
                width={120}
                height={48}
                className="h-10 lg:h-12 object-contain transition-opacity duration-300 group-hover:opacity-80"
                style={{ width: 'auto' }}
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-10 flex-1 justify-center">
            <Link
              href="/catalogo"
              className="luxury-underline text-xs uppercase tracking-widest text-obsidian-700 hover:text-amber-gold-500 transition-colors duration-300 font-medium py-1"
            >
              Catalogo
            </Link>
            <Link
              href="/sobre-nosotros"
              className="luxury-underline text-xs uppercase tracking-widest text-obsidian-700 hover:text-amber-gold-500 transition-colors duration-300 font-medium py-1"
            >
              Sobre Nosotros
            </Link>
            <Link
              href="/contacto"
              className="luxury-underline text-xs uppercase tracking-widest text-obsidian-700 hover:text-amber-gold-500 transition-colors duration-300 font-medium py-1"
            >
              Contacto
            </Link>
          </div>

          {/* Iconos */}
          <div className="flex items-center gap-1 sm:gap-3 lg:gap-5 flex-1 justify-end">
            {/* Buscar */}
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Buscar"
              className="w-11 h-11 flex items-center justify-center text-obsidian-700 hover:text-amber-gold-500 transition-colors duration-300 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* WhatsApp */}
            <a
              href="https://wa.me/56932897499"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="w-11 h-11 flex items-center justify-center text-obsidian-700 hover:text-[#25D366] transition-colors duration-300"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>

            {/* Menu mobile */}
            <button
              aria-label="Menu"
              className="lg:hidden w-11 h-11 flex items-center justify-center text-obsidian-700 cursor-pointer"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </nav>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-pearl-200/60 py-6 animate-fade-in">
            <div className="flex flex-col">
              {[
                { label: 'Catalogo', href: '/catalogo' },
                { label: 'Sobre Nosotros', href: '/sobre-nosotros' },
                { label: 'Contacto', href: '/contacto' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="py-3.5 text-sm uppercase tracking-widest text-obsidian-700 hover:text-amber-gold-500 transition-colors duration-300 font-medium border-b border-pearl-100 last:border-b-0"
                >
                  {link.label}
                </Link>
              ))}
              {/* WhatsApp link en mobile */}
              <a
                href="https://wa.me/56932897499"
                target="_blank"
                rel="noopener noreferrer"
                className="py-3.5 text-sm uppercase tracking-widest text-[#25D366] font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
}
