'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '../lib/stores/cart.store';
import { useWishlistStore } from '../lib/stores/wishlist.store';
import { useAuthStore } from '../lib/stores/auth.store';
import SearchModal from './SearchModal';
import AuthModal from './AuthModal';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const openCart = useCartStore((state) => state.openCart);
  const cartItemCount = useCartStore((state) => state.getItemCount());
  const wishlistItemCount = useWishlistStore((state) => state.getItemCount());
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleProfileClick = () => {
    if (user) {
      window.location.href = '/perfil';
    } else {
      setIsAuthOpen(true);
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-white/98 backdrop-blur-xl shadow-luxury'
          : 'bg-white/95 backdrop-blur-md'
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        {/* Top bar - Free shipping announcement */}
        <div
          className={`border-b border-pearl-200/60 overflow-hidden transition-all duration-500 ${
            isScrolled ? 'max-h-0 py-0 opacity-0' : 'max-h-12 py-2.5 opacity-100'
          }`}
        >
          <p className="text-center text-xs text-platinum-600 tracking-widest uppercase">
            Envio gratuito en compras sobre $50.000 &nbsp;&middot;&nbsp; Garantia de 12 meses
          </p>
        </div>

        {/* Main navigation */}
        <nav className="flex items-center justify-between py-4 lg:py-5">
          {/* Logo */}
          <div className="flex-1">
            <a href="/" className="inline-block group">
              <img
                src="/logo_oscuro.jpeg"
                alt="Amber Joyeria"
                className="h-10 lg:h-12 w-auto object-contain transition-opacity duration-300 group-hover:opacity-80"
              />
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-10 flex-1 justify-center">
            {[
              { label: 'Catalogo', href: '/catalogo' },
              { label: 'Colecciones', href: '/colecciones' },
              { label: 'Lookbook', href: '/lookbook' },
              { label: 'Sobre Nosotros', href: '/sobre-nosotros' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="luxury-underline text-xs uppercase tracking-widest text-obsidian-700 hover:text-amber-gold-500 transition-colors duration-300 font-medium py-1"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Icons */}
          <div className="flex items-center gap-5 lg:gap-6 flex-1 justify-end">
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Buscar"
              className="text-obsidian-700 hover:text-amber-gold-500 transition-colors duration-300 cursor-pointer"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <a
              href="/favoritos"
              aria-label="Favoritos"
              className="relative text-obsidian-700 hover:text-amber-gold-500 transition-colors duration-300"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {wishlistItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-amber-gold-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                  {wishlistItemCount}
                </span>
              )}
            </a>

            <button
              onClick={handleProfileClick}
              aria-label="Cuenta"
              className="relative text-obsidian-700 hover:text-amber-gold-500 transition-colors duration-300 cursor-pointer"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {user && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full" />
              )}
            </button>

            <button
              onClick={openCart}
              aria-label="Carrito"
              className="relative text-obsidian-700 hover:text-amber-gold-500 transition-colors duration-300 cursor-pointer"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-amber-gold-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Mobile menu button */}
            <button
              aria-label="Menu"
              className="lg:hidden text-obsidian-700 cursor-pointer"
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
          <div className="lg:hidden border-t border-pearl-200/60 py-8 animate-fade-in">
            <div className="flex flex-col gap-6">
              {[
                { label: 'Catalogo', href: '/catalogo' },
                { label: 'Colecciones', href: '/colecciones' },
                { label: 'Lookbook', href: '/lookbook' },
                { label: 'Sobre Nosotros', href: '/sobre-nosotros' },
                { label: 'Contacto', href: '/contacto' },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm uppercase tracking-widest text-obsidian-700 hover:text-amber-gold-500 transition-colors duration-300 font-medium"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </header>
  );
}
