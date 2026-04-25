import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Header from '../components/Header';
import Footer from '../components/Footer';
import type { Collection } from '../lib/types';

export const metadata: Metadata = {
  title: 'Colecciones de Joyas',
  description: 'Descubre nuestras colecciones: Proteccion y Energia, Moda y Tendencia, Cuidado de Joyas. Joyas con significado para cada estilo.',
  openGraph: {
    title: 'Colecciones de Joyas | AMBER',
    description: 'Descubre nuestras colecciones de joyas con significado. Plata 925, amuletos y tendencia.',
    url: '/colecciones',
  },
  alternates: {
    canonical: '/colecciones',
  },
};

const API_URL = process.env.INTERNAL_API_URL || 'http://localhost:3000';

const universeStyles: Record<string, { color: string; fallbackImage: string }> = {
  'proteccion-y-energia': {
    color: 'from-purple-900/80 to-purple-800/60',
    fallbackImage: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&h=1000&fit=crop',
  },
  'moda-y-tendencia': {
    color: 'from-slate-900/80 to-slate-800/60',
    fallbackImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=1000&fit=crop',
  },
  'cuidado-de-joyas': {
    color: 'from-emerald-900/80 to-emerald-800/60',
    fallbackImage: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&h=1000&fit=crop',
  },
};

const subcategoryColors = [
  'from-amber-900/80 to-amber-800/60',
  'from-rose-900/80 to-rose-800/60',
  'from-blue-900/80 to-blue-800/60',
  'from-indigo-900/80 to-indigo-800/60',
  'from-teal-900/80 to-teal-800/60',
];

async function getCollectionTree(): Promise<Collection[]> {
  try {
    const res = await fetch(`${API_URL}/collections/tree`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error('API error');
    return res.json();
  } catch {
    return [];
  }
}

export default async function ColeccionesPage() {
  const universes = await getCollectionTree();

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

      {/* Collections Content */}
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

          {/* Universe Cards (Level 1) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {universes.map((universe, index) => {
              const style = universeStyles[universe.slug] || {
                color: subcategoryColors[index % subcategoryColors.length],
                fallbackImage: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=1000&fit=crop',
              };
              return (
                <Link
                  key={universe.id}
                  href={`/colecciones/${universe.slug}`}
                  className="group relative h-[500px] overflow-hidden shadow-luxury cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Image
                    src={universe.image_url || style.fallbackImage}
                    alt={universe.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${style.color} transition-opacity duration-300`} />
                  <div className="absolute inset-0 flex flex-col justify-end p-8 text-white z-10">
                    <div className="transform transition-transform duration-300 group-hover:-translate-y-2">
                      <p className="text-xs uppercase tracking-widest mb-3 text-amber-gold-300">
                        {universe.children?.length || 0} categorias
                      </p>
                      <h3
                        className="text-3xl lg:text-4xl font-light mb-3"
                        style={{ fontFamily: 'var(--font-cormorant)' }}
                      >
                        {universe.name}
                      </h3>
                      <p className="text-sm opacity-90 mb-6 leading-relaxed">
                        {universe.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span>Explorar</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Subcategories per Universe */}
          {universes.map((universe) => (
            <div key={universe.id} className="mt-24">
              <div className="text-center mb-12">
                <p className="text-xs uppercase tracking-[0.3em] text-amber-gold-500 mb-4 font-medium">
                  {universe.name}
                </p>
                <h2
                  className="text-4xl lg:text-5xl font-light text-obsidian-900 mb-4"
                  style={{ fontFamily: 'var(--font-cormorant)' }}
                >
                  Explorar por Categoria
                </h2>
                <div className="separator-luxury w-32 mx-auto"></div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
                {universe.children?.map((category, catIndex) => (
                  <Link
                    key={category.id}
                    href={`/colecciones/${category.slug}`}
                    className="group bg-white p-6 lg:p-8 shadow-luxury hover:shadow-gold transition-all duration-300 animate-fade-in text-center cursor-pointer"
                    style={{ animationDelay: `${catIndex * 80}ms` }}
                  >
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-pearl-100 flex items-center justify-center group-hover:bg-amber-gold-50 transition-colors">
                      <svg className="w-6 h-6 text-amber-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                      </svg>
                    </div>
                    <h3
                      className="text-lg font-light text-obsidian-900 mb-1 group-hover:text-amber-gold-600 transition-colors"
                      style={{ fontFamily: 'var(--font-cormorant)' }}
                    >
                      {category.name}
                    </h3>
                    {category.children && category.children.length > 0 && (
                      <p className="text-xs text-platinum-500 mt-2">
                        {category.children.length} subcategorias
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}

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
                  sobre $50.000 y colecciones que no estan en marketplaces.
                </p>
                <Link
                  href="/catalogo"
                  className="inline-block mt-4 px-12 py-4 bg-white text-obsidian-900 text-xs uppercase tracking-[0.2em] font-medium hover:bg-amber-gold-500 hover:text-white transition-all duration-300 cursor-pointer"
                >
                  Ver Catalogo Completo
                </Link>
              </div>
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

      <Footer />
    </div>
  );
}
