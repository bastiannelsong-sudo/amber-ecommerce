'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import SearchModal from './SearchModal';
import AuthButton from './AuthButton';
import { useCartStore } from '../lib/stores/cart.store';
import { buildWhatsAppUrl } from '../lib/whatsapp';

const PROMO_MESSAGES = [
  'Envio gratuito en compras sobre $50.000',
  'Plata 925 · Cambios y devoluciones sin costo',
  'Usa el codigo BIENVENIDA10 y obten 10% de descuento',
  'Amuletos de proteccion con significado real',
];

const CATEGORIES = [
  { name: 'Pulseras', href: '/pulseras', description: 'Plata 925, hilo rojo y amuletos' },
  { name: 'Collares', href: '/collares', description: 'Cadenas y dijes con significado' },
  { name: 'Aros', href: '/aros', description: 'Diseños para cada estilo' },
  { name: 'Anillos', href: '/anillos', description: 'Elegancia en plata fina' },
  { name: 'Cadenas', href: '/cadenas', description: 'Grumet, cartier, veneciana' },
  { name: 'Conjuntos', href: '/conjuntos', description: 'Collar y aros a juego' },
  { name: 'Charms', href: '/charms', description: 'Personaliza tu pulsera' },
  { name: 'Bebés', href: '/medallas', description: 'Medallas y prendedores' },
];

const AMULETS = [
  { name: 'San Benito', href: '/amuletos/san-benito', description: 'Protección espiritual' },
  { name: 'Nudo de Brujas', href: '/amuletos/nudo-de-brujas', description: 'Escudo energético' },
  { name: 'Hilo Rojo', href: '/amuletos/hilo-rojo', description: '7 nudos tradicionales' },
  { name: 'Mano de Fátima', href: '/amuletos/mano-de-fatima', description: 'Contra el mal de ojo' },
  { name: 'Ojo Turco', href: '/amuletos/ojo-turco', description: 'Aleja la envidia' },
  { name: 'Árbol de la Vida', href: '/amuletos/arbol-de-la-vida', description: 'Equilibrio y raíces' },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [promoIndex, setPromoIndex] = useState(0);
  // Evitar hydration mismatch: el carrito vive en localStorage (zustand/persist),
  // el server renderiza con 0 items y el cliente puede tener N > 0 tras rehidratar.
  // Mostramos el badge solo después del primer efecto en cliente.
  const [hasMounted, setHasMounted] = useState(false);
  const catalogTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const openCart = useCartStore((state) => state.openCart);
  const itemCount = useCartStore((state) => state.getItemCount());

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      if (y > 60) setIsScrolled(true);
      else if (y < 10) setIsScrolled(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Bloquear scroll cuando el menu mobile esta abierto
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  // Rotacion del promo banner
  useEffect(() => {
    const interval = setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % PROMO_MESSAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCatalogEnter = () => {
    if (catalogTimeoutRef.current) clearTimeout(catalogTimeoutRef.current);
    setIsCatalogOpen(true);
  };

  const handleCatalogLeave = () => {
    catalogTimeoutRef.current = setTimeout(() => setIsCatalogOpen(false), 200);
  };

  return (
    <>
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-white/98 backdrop-blur-xl shadow-luxury'
          : 'bg-white/95 backdrop-blur-md'
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        {/* Barra superior - promo rotativa */}
        <div
          className={`border-b border-pearl-200/60 overflow-hidden transition-all duration-500 ${
            isScrolled ? 'max-h-0 py-0 opacity-0' : 'max-h-16 py-2 sm:py-2.5 opacity-100'
          }`}
        >
          <div className="relative h-4 overflow-hidden">
            {PROMO_MESSAGES.map((msg, i) => (
              <p
                key={i}
                className={`absolute inset-0 text-center text-[10px] sm:text-xs text-platinum-600 tracking-wider sm:tracking-widest uppercase transition-all duration-500 ${
                  i === promoIndex
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 -translate-y-3'
                }`}
              >
                {msg}
              </p>
            ))}
          </div>
        </div>

        {/* Navegacion principal */}
        <nav className="flex items-center justify-between py-4 lg:py-5">
          {/* Logo */}
          <div className="flex-1">
            <Link href="/" className="inline-block group">
              <Image
                src="/logo_claro.png"
                alt="Amber Joyeria"
                width={180}
                height={72}
                className="h-10 sm:h-12 lg:h-14 object-contain transition-opacity duration-300 group-hover:opacity-80"
                style={{ width: 'auto' }}
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-10 flex-1 justify-center">
            {/* Catalogo con dropdown */}
            <div
              className="relative"
              onMouseEnter={handleCatalogEnter}
              onMouseLeave={handleCatalogLeave}
            >
              <Link
                href="/catalogo"
                className="luxury-underline text-xs uppercase tracking-widest text-obsidian-700 hover:text-amber-gold-500 transition-colors duration-300 font-medium py-1"
              >
                Catalogo
              </Link>

              {/* Dropdown de categorías + amuletos */}
              <div
                className={`absolute top-full left-1/2 -translate-x-1/2 pt-4 transition-all duration-300 ${
                  isCatalogOpen
                    ? 'opacity-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 -translate-y-2 pointer-events-none'
                }`}
              >
                <div className="bg-white shadow-luxury-lg border border-pearl-200/60 p-6 min-w-[640px] grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-amber-gold-500 font-medium mb-4">
                      Categorías
                    </p>
                    <div className="space-y-1">
                      {CATEGORIES.map((cat) => (
                        <Link
                          key={cat.name}
                          href={cat.href}
                          onClick={() => setIsCatalogOpen(false)}
                          className="flex items-center justify-between py-2.5 px-3 -mx-3 hover:bg-pearl-50 transition-colors duration-200 group/item"
                        >
                          <div>
                            <span className="text-sm text-obsidian-900 group-hover/item:text-amber-gold-600 transition-colors font-medium">
                              {cat.name}
                            </span>
                            <p className="text-[11px] text-platinum-500 mt-0.5">
                              {cat.description}
                            </p>
                          </div>
                          <svg
                            className="w-3.5 h-3.5 text-platinum-400 group-hover/item:text-amber-gold-500 transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>
                      ))}
                    </div>
                    <div className="border-t border-pearl-200 mt-3 pt-3">
                      <Link
                        href="/catalogo"
                        onClick={() => setIsCatalogOpen(false)}
                        className="text-xs uppercase tracking-wider text-amber-gold-500 hover:text-amber-gold-600 font-medium transition-colors"
                      >
                        Ver todo el catálogo →
                      </Link>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-amber-gold-500 font-medium mb-4">
                      Amuletos
                    </p>
                    <div className="space-y-1">
                      {AMULETS.map((am) => (
                        <Link
                          key={am.name}
                          href={am.href}
                          onClick={() => setIsCatalogOpen(false)}
                          className="flex items-center justify-between py-2.5 px-3 -mx-3 hover:bg-pearl-50 transition-colors duration-200 group/item"
                        >
                          <div>
                            <span className="text-sm text-obsidian-900 group-hover/item:text-amber-gold-600 transition-colors font-medium">
                              {am.name}
                            </span>
                            <p className="text-[11px] text-platinum-500 mt-0.5">
                              {am.description}
                            </p>
                          </div>
                          <svg
                            className="w-3.5 h-3.5 text-platinum-400 group-hover/item:text-amber-gold-500 transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>
                      ))}
                    </div>
                    <div className="border-t border-pearl-200 mt-3 pt-3">
                      <Link
                        href="/amuletos/regalo"
                        onClick={() => setIsCatalogOpen(false)}
                        className="text-xs uppercase tracking-wider text-amber-gold-500 hover:text-amber-gold-600 font-medium transition-colors"
                      >
                        Ideas de regalo →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/colecciones"
              className="luxury-underline text-xs uppercase tracking-widest text-obsidian-700 hover:text-amber-gold-500 transition-colors duration-300 font-medium py-1"
            >
              Colecciones
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
          <div className="flex items-center gap-0.5 sm:gap-3 lg:gap-5 flex-1 justify-end">
            {/* Buscar */}
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Buscar"
              className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-obsidian-700 hover:text-amber-gold-500 transition-colors duration-300 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Cuenta — login o menú de usuario */}
            <AuthButton />

            {/* Carrito */}
            <button
              onClick={openCart}
              aria-label="Carrito"
              className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-obsidian-700 hover:text-amber-gold-500 transition-colors duration-300 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {hasMounted && itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-amber-gold-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>

            {/* WhatsApp */}
            <a
              href={buildWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-obsidian-700 hover:text-[#25D366] transition-colors duration-300"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>

            {/* Menu mobile */}
            <button
              aria-label="Menu"
              className="lg:hidden w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-obsidian-700 cursor-pointer"
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

        {/* Mobile Navigation - renderizado via portal fuera del header */}
      </div>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>

    {/* Mobile Navigation - Portal para escapar del backdrop-blur del header */}
    {isMenuOpen && createPortal(
      <div className="lg:hidden fixed inset-0 z-[60] animate-fade-in">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Panel deslizable desde la derecha */}
        <div className="absolute right-0 top-0 h-full w-[85vw] max-w-sm bg-white shadow-2xl flex flex-col animate-slide-in-right">
          {/* Header del menu */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-pearl-200/60">
            <Image
              src="/logo_claro.png"
              alt="Amber"
              width={120}
              height={48}
              className="h-8 object-contain"
              style={{ width: 'auto' }}
            />
            <button
              onClick={() => setIsMenuOpen(false)}
              className="w-9 h-9 flex items-center justify-center text-obsidian-700 hover:text-amber-gold-500 transition-colors rounded-full hover:bg-pearl-50"
              aria-label="Cerrar menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {/* Categorias - grid visual */}
            <div className="px-6 pt-6 pb-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-amber-gold-500 font-medium mb-4">
                Categorias
              </p>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.name}
                    href={cat.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="group flex flex-col items-center justify-center py-4 px-3 bg-pearl-50 hover:bg-amber-gold-50 border border-pearl-200/60 hover:border-amber-gold-300/60 transition-all duration-200 rounded-sm"
                  >
                    <span className="text-xs font-medium uppercase tracking-wider text-obsidian-800 group-hover:text-amber-gold-600 transition-colors">
                      {cat.name}
                    </span>
                    <span className="text-[10px] text-platinum-500 mt-1 text-center leading-tight">
                      {cat.description}
                    </span>
                  </Link>
                ))}
                {/* Ver todo */}
                <Link
                  href="/catalogo"
                  onClick={() => setIsMenuOpen(false)}
                  className="group flex flex-col items-center justify-center py-4 px-3 bg-obsidian-900 hover:bg-obsidian-800 border border-obsidian-800 transition-all duration-200 rounded-sm"
                >
                  <span className="text-xs font-medium uppercase tracking-wider text-white">
                    Ver Todo
                  </span>
                  <span className="text-[10px] text-pearl-400 mt-1">
                    Catalogo completo
                  </span>
                </Link>
              </div>
            </div>

            {/* Separador */}
            <div className="mx-6 border-t border-pearl-200/60" />

            {/* Amuletos - grid visual */}
            <div className="px-6 pt-6 pb-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-amber-gold-500 font-medium mb-4">
                Amuletos
              </p>
              <div className="grid grid-cols-2 gap-2">
                {AMULETS.map((am) => (
                  <Link
                    key={am.name}
                    href={am.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="group flex flex-col items-center justify-center py-4 px-3 bg-pearl-50 hover:bg-amber-gold-50 border border-pearl-200/60 hover:border-amber-gold-300/60 transition-all duration-200 rounded-sm"
                  >
                    <span className="text-xs font-medium uppercase tracking-wider text-obsidian-800 group-hover:text-amber-gold-600 transition-colors text-center">
                      {am.name}
                    </span>
                    <span className="text-[10px] text-platinum-500 mt-1 text-center leading-tight">
                      {am.description}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Separador */}
            <div className="mx-6 border-t border-pearl-200/60" />

            {/* Links principales */}
            <div className="px-6 py-4 space-y-1">
              {[
                { label: 'Colecciones', href: '/colecciones' },
                { label: 'Sobre Nosotros', href: '/sobre-nosotros' },
                { label: 'Contacto', href: '/contacto' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between py-3 text-sm uppercase tracking-widest text-obsidian-700 hover:text-amber-gold-500 transition-colors duration-200 font-medium"
                >
                  {link.label}
                  <svg className="w-4 h-4 text-platinum-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Footer del menu */}
          <div className="border-t border-pearl-200/60 px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <a
              href={buildWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] hover:bg-[#22c35e] text-white text-xs uppercase tracking-wider font-medium rounded-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Escribenos por WhatsApp
            </a>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
