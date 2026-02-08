import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: 'Colecciones de Joyas',
  description: 'Descubre nuestras colecciones: Proteccion y Energia, Plata Fina 925, Tendencia, Sets de Regalo y mas. Joyas con significado para cada estilo.',
  openGraph: {
    title: 'Colecciones de Joyas | AMBER',
    description: 'Descubre nuestras colecciones de joyas con significado. Plata 925, amuletos y tendencia.',
    url: '/colecciones',
  },
  twitter: {
    title: 'Colecciones de Joyas | AMBER',
    description: 'Descubre nuestras colecciones de joyas con significado.',
  },
  alternates: {
    canonical: '/colecciones',
  },
};

export default function ColeccionesPage() {
  const collections = [
    {
      id: 1,
      name: 'Proteccion y Energia',
      description: 'Amuletos con significado: Metatron, Nudo de Brujas, Ojo Turco, Arbol de la Vida',
      image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&h=1000&fit=crop',
      items: 15,
      color: 'from-purple-900/80 to-purple-800/60',
    },
    {
      id: 2,
      name: 'Plata Fina 925',
      description: 'Collares, aros y pulseras en plata certificada para uso diario',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=1000&fit=crop',
      items: 32,
      color: 'from-slate-900/80 to-slate-800/60',
    },
    {
      id: 3,
      name: 'Bano de Oro',
      description: 'Piezas con acabado en oro 18K sobre base de calidad. Brillo premium',
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=1000&fit=crop',
      items: 20,
      color: 'from-amber-900/80 to-amber-800/60',
    },
    {
      id: 4,
      name: 'Conjuntos',
      description: 'Sets de collar + aros coordinados. Ideales para regalo o uso diario',
      image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&h=1000&fit=crop',
      items: 18,
      color: 'from-rose-900/80 to-rose-800/60',
    },
    {
      id: 5,
      name: 'Tendencia',
      description: 'Lo mas trendy del momento en acero quirurgico y disenos contemporaneos',
      image: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=800&h=1000&fit=crop',
      items: 24,
      color: 'from-blue-900/80 to-blue-800/60',
    },
    {
      id: 6,
      name: 'Regalos',
      description: 'Piezas perfectas para sorprender. Desde $9.590 con packaging especial',
      image: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&h=1000&fit=crop',
      items: 22,
      color: 'from-emerald-900/80 to-emerald-800/60',
    },
  ];

  const categories = [
    {
      name: 'Collares',
      count: 35,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v4h-2zm0 6h2v2h-2z" />
          <circle cx="12" cy="19" r="1.5" fill="currentColor" />
          <path d="M7 6c1.5 2 3 3 5 3s3.5-1 5-3" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      name: 'Aros',
      count: 28,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="3" />
          <path strokeLinecap="round" d="M12 6V3M12 21v-3" />
        </svg>
      ),
    },
    {
      name: 'Pulseras',
      count: 22,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m-7-9H4m16 0h1m-2.636-6.364l-.707.707M6.343 17.657l-.707.707m12.02 0l-.706-.707M6.343 6.343l-.707-.707" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      ),
    },
    {
      name: 'Conjuntos',
      count: 18,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 3a7 7 0 110 14 7 7 0 010-14z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-pearl-50">
      <Header />

      {/* Hero Section */}
      <section className="relative h-[50vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian-950/60 via-obsidian-900/30 to-obsidian-950/50 z-10" />
        <Image
          src="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=1920&h=1080&fit=crop"
          alt="Colecciones"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="text-center text-white space-y-6 px-4 animate-fade-in">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-gold-400 font-medium">
              Colecciones con Proposito
            </p>
            <h1
              className="text-5xl lg:text-7xl font-light tracking-wider"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Nuestras Colecciones
            </h1>
            <p className="text-base lg:text-lg tracking-wide font-light max-w-2xl mx-auto text-pearl-200">
              Joyas con significado para cada momento de tu vida
            </p>
          </div>
        </div>
      </section>

      {/* Collections Grid */}
      <section className="container mx-auto px-4 lg:px-8 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto">
          {/* Intro */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2
              className="text-4xl lg:text-5xl font-light text-obsidian-900 mb-6"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Descubre Tu Estilo
            </h2>
            <div className="separator-luxury w-32 mx-auto mb-6"></div>
            <p className="text-base text-platinum-600 leading-relaxed">
              Desde amuletos de proteccion hasta las ultimas tendencias en plata fina 925.
              Cada coleccion esta pensada para que encuentres joyas con significado
              a precios justos.
            </p>
          </div>

          {/* Collections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {collections.map((collection, index) => (
              <Link
                key={collection.id}
                href="/"
                className="group relative h-[500px] overflow-hidden shadow-luxury cursor-pointer animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Image */}
                <Image
                  src={collection.image}
                  alt={collection.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${collection.color} transition-opacity duration-300`} />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-8 text-white z-10">
                  <div className="transform transition-transform duration-300 group-hover:-translate-y-2">
                    {/* Items count */}
                    <p className="text-xs uppercase tracking-widest mb-3 text-amber-gold-300">
                      {collection.items} piezas
                    </p>

                    {/* Collection name */}
                    <h3
                      className="text-3xl lg:text-4xl font-light mb-3"
                      style={{ fontFamily: 'var(--font-cormorant)' }}
                    >
                      {collection.name}
                    </h3>

                    {/* Description */}
                    <p className="text-sm opacity-90 mb-6 leading-relaxed">
                      {collection.description}
                    </p>

                    {/* CTA */}
                    <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span>Explorar</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Featured Collection Banner */}
          <div className="mt-24 relative h-[400px] overflow-hidden shadow-luxury-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-obsidian-950/90 via-obsidian-900/70 to-obsidian-800/50 z-10" />
            <Image
              src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920&h=800&fit=crop"
              alt="Coleccion Destacada"
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <div className="text-center text-white space-y-6 px-4 max-w-3xl">
                <span className="inline-block px-4 py-2 border border-amber-gold-400 text-amber-gold-400 text-xs uppercase tracking-[0.2em]">
                  Exclusivo Web
                </span>
                <h2
                  className="text-4xl lg:text-6xl font-light tracking-wider"
                  style={{ fontFamily: 'var(--font-cormorant)' }}
                >
                  Precios Especiales
                </h2>
                <p className="text-base lg:text-lg font-light max-w-2xl mx-auto text-pearl-200">
                  En nuestra tienda oficial encuentras precios exclusivos, envio gratuito
                  sobre $30.000 y colecciones que no estan en marketplaces.
                </p>
                <Link
                  href="/catalogo"
                  className="inline-block mt-4 px-12 py-4 bg-white text-obsidian-900 text-xs uppercase tracking-[0.2em] font-medium hover:bg-amber-gold-500 hover:text-white transition-all duration-300 cursor-pointer"
                >
                  Ver Coleccion Completa
                </Link>
              </div>
            </div>
          </div>

          {/* Categories Section - SVG Icons instead of emojis */}
          <div className="mt-24 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-gold-500 mb-4 font-medium">
              Encuentra lo que Buscas
            </p>
            <h2
              className="text-4xl lg:text-5xl font-light text-obsidian-900 mb-4"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Explorar por Categoria
            </h2>
            <div className="separator-luxury w-32 mx-auto mb-12"></div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
              {categories.map((category, index) => (
                <Link
                  key={category.name}
                  href="/catalogo"
                  className="group bg-white p-8 lg:p-10 shadow-luxury hover:shadow-gold transition-all duration-300 animate-fade-in cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="text-amber-gold-500 mb-5 flex justify-center transition-colors duration-300 group-hover:text-amber-gold-600">
                    {category.icon}
                  </div>
                  <h3
                    className="text-xl font-light text-obsidian-900 mb-2 group-hover:text-amber-gold-600 transition-colors"
                    style={{ fontFamily: 'var(--font-cormorant)' }}
                  >
                    {category.name}
                  </h3>
                  <p className="text-xs text-platinum-600 uppercase tracking-wider">{category.count} productos</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Newsletter CTA */}
          <div className="mt-24 bg-obsidian-900 p-12 lg:p-16 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-gold-400 mb-4 font-medium">
              Exclusividad
            </p>
            <h2
              className="text-3xl lg:text-4xl font-light text-white mb-4"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Se el Primero en Conocer
            </h2>
            <p className="text-pearl-300 mb-8 max-w-2xl mx-auto text-sm leading-relaxed">
              Recibe notificaciones exclusivas sobre nuevas colecciones, lanzamientos especiales
              y ofertas limitadas.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Tu correo electronico"
                className="flex-1 px-6 py-4 bg-white/10 border border-white/20 text-white placeholder-pearl-400 focus:outline-none focus:border-amber-gold-500 transition-colors text-sm"
              />
              <button className="px-8 py-4 bg-amber-gold-500 text-obsidian-900 text-xs uppercase tracking-[0.2em] font-medium hover:bg-amber-gold-400 transition-colors whitespace-nowrap cursor-pointer">
                Suscribirse
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
