import Header from './components/Header';
import Footer from './components/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-pearl-50 flex flex-col">
      <Header />

      <div className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="max-w-2xl mx-auto text-center">
          {/* 404 Number */}
          <div className="mb-8">
            <h1
              className="text-[150px] lg:text-[200px] font-light leading-none text-transparent bg-clip-text bg-gradient-to-br from-obsidian-900 via-platinum-600 to-amber-gold-500 opacity-20"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              404
            </h1>
          </div>

          {/* Decorative Element */}
          <div className="mb-8 flex items-center justify-center">
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-gold-500 to-transparent" />
            <svg
              className="w-8 h-8 text-amber-gold-500 mx-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-gold-500 to-transparent" />
          </div>

          {/* Message */}
          <h2
            className="text-4xl lg:text-5xl font-light text-obsidian-900 mb-6"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            Página No Encontrada
          </h2>
          <p className="text-lg text-platinum-600 mb-12 max-w-lg mx-auto leading-relaxed">
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
            Pero no te preocupes, tenemos muchas joyas hermosas esperándote.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/"
              className="px-12 py-4 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors shadow-luxury inline-block"
            >
              Ir al Inicio
            </a>
            <a
              href="/catalogo"
              className="px-12 py-4 border-2 border-obsidian-900 text-obsidian-900 text-sm uppercase tracking-widest font-medium hover:bg-obsidian-900 hover:text-white transition-colors inline-block"
            >
              Ver Catálogo
            </a>
          </div>

          {/* Popular Links */}
          <div className="mt-16 pt-8 border-t border-pearl-200">
            <p className="text-sm uppercase tracking-widest text-platinum-600 mb-6">
              Enlaces Populares
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <a
                href="/colecciones"
                className="text-platinum-700 hover:text-amber-gold-500 transition-colors"
              >
                Colecciones
              </a>
              <a
                href="/sobre-nosotros"
                className="text-platinum-700 hover:text-amber-gold-500 transition-colors"
              >
                Sobre Nosotros
              </a>
              <a
                href="/favoritos"
                className="text-platinum-700 hover:text-amber-gold-500 transition-colors"
              >
                Favoritos
              </a>
              <a
                href="/contacto"
                className="text-platinum-700 hover:text-amber-gold-500 transition-colors"
              >
                Contacto
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
