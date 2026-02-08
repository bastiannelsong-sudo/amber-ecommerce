import Image from 'next/image';
import Link from 'next/link';
import Header from './components/Header';
import FeaturedProducts from './components/FeaturedProducts';
import Footer from './components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section - Full Screen Cinematic */}
      <section className="relative h-[85vh] lg:h-[90vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian-950/50 via-obsidian-900/30 to-obsidian-950/60 z-10" />
        <Image
          src="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=1920&h=1080&fit=crop"
          alt="Joyas en Plata 925 y Amuletos de Proteccion"
          fill
          priority
          className="object-cover scale-105"
          sizes="100vw"
        />
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="text-center text-white space-y-8 px-4 max-w-4xl">
            <div className="animate-fade-in">
              <p className="text-xs lg:text-sm uppercase tracking-[0.3em] text-amber-gold-400 mb-6 font-medium">
                Plata 925 &middot; Amuletos &middot; Tendencia
              </p>
              <h1
                className="text-5xl sm:text-6xl lg:text-8xl font-light tracking-wide leading-tight"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                Joyas con<br />
                <span className="italic font-normal">Alma</span>
              </h1>
            </div>
            <p className="text-base lg:text-lg tracking-wide font-light max-w-xl mx-auto text-pearl-200 animate-fade-in animate-delay-200">
              Plata fina 925, amuletos de proteccion y accesorios con significado para brillar todos los dias
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in animate-delay-300">
              <Link
                href="/catalogo"
                className="px-12 py-4 bg-white text-obsidian-900 text-xs uppercase tracking-[0.2em] font-medium hover:bg-amber-gold-500 hover:text-white transition-all duration-300 cursor-pointer"
              >
                Ver Catalogo
              </Link>
              <Link
                href="/colecciones"
                className="px-12 py-4 border border-white/40 text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-white/10 transition-all duration-300 cursor-pointer"
              >
                Nuestras Colecciones
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-float">
          <div className="w-[1px] h-12 bg-gradient-to-b from-white/60 to-transparent"></div>
        </div>
      </section>

      {/* Brand Promise Strip */}
      <section className="bg-obsidian-900 py-6 lg:py-8">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                ),
                title: 'Plata 925 Certificada',
                subtitle: 'Materiales garantizados',
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ),
                title: '+1.400 Seguidores',
                subtitle: 'Confian en nosotros',
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                ),
                title: 'Envio Gratuito',
                subtitle: 'En compras sobre $30.000',
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.182" />
                  </svg>
                ),
                title: 'Garantia 12 Meses',
                subtitle: 'Compromiso de calidad',
              },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-4 text-white">
                <div className="text-amber-gold-400 flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider">{item.title}</p>
                  <p className="text-[11px] text-pearl-400 mt-0.5">{item.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="container mx-auto px-4 lg:px-8 py-20 lg:py-28">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-gold-500 mb-4 font-medium">
            Categorias
          </p>
          <h2
            className="text-4xl lg:text-5xl font-light text-obsidian-900"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            Encuentra tu Estilo
          </h2>
          <div className="separator-luxury w-32 mx-auto mt-6"></div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {[
            {
              name: 'Collares',
              image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=700&fit=crop',
              count: 35,
            },
            {
              name: 'Aros',
              image: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=600&h=700&fit=crop',
              count: 28,
            },
            {
              name: 'Pulseras',
              image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&h=700&fit=crop',
              count: 22,
            },
            {
              name: 'Conjuntos',
              image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=700&fit=crop',
              count: 18,
            },
          ].map((category, index) => (
            <Link
              key={category.name}
              href="/catalogo"
              className="group relative aspect-[3/4] overflow-hidden cursor-pointer animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Image
                src={category.image}
                alt={category.name}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950/70 via-obsidian-900/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3
                  className="text-2xl lg:text-3xl font-light mb-1"
                  style={{ fontFamily: 'var(--font-cormorant)' }}
                >
                  {category.name}
                </h3>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-xs uppercase tracking-wider text-pearl-300">
                    {category.count} productos
                  </span>
                  <svg className="w-3 h-3 text-pearl-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-white py-20 lg:py-28">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-16">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-gold-500 mb-4 font-medium">
                Lo Mas Vendido
              </p>
              <h2
                className="text-4xl lg:text-5xl font-light text-obsidian-900"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                Favoritos de Nuestras Clientas
              </h2>
              <div className="line-accent mt-6"></div>
            </div>
            <Link
              href="/catalogo"
              className="mt-6 lg:mt-0 text-xs uppercase tracking-[0.2em] text-obsidian-700 hover:text-amber-gold-500 transition-colors font-medium luxury-underline pb-1 cursor-pointer"
            >
              Ver Todo el Catalogo
            </Link>
          </div>

          <FeaturedProducts />
        </div>
      </section>

      {/* Editorial / Brand Story Section */}
      <section className="relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="relative h-[500px] lg:h-[700px]">
            <Image
              src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1000&h=1400&fit=crop"
              alt="Joyas AMBER en Plata Fina"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          <div className="flex items-center bg-obsidian-900 text-white px-8 lg:px-16 xl:px-24 py-16 lg:py-0">
            <div className="max-w-lg space-y-8">
              <div className="line-accent"></div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-gold-400 font-medium">
                Nuestra Esencia
              </p>
              <h2
                className="text-4xl lg:text-5xl font-light leading-tight"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                Mas que Joyas,
                <br />
                <span className="italic">Significado</span>
              </h2>
              <p className="text-pearl-300 leading-relaxed text-base">
                Cada pieza de AMBER tiene un proposito. Desde amuletos de proteccion
                como el Metatron y el Nudo de Brujas, hasta collares y aros en plata
                fina 925 que te acompanan en tu dia a dia. No vendemos accesorios,
                creamos conexiones con significado.
              </p>
              <Link
                href="/sobre-nosotros"
                className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-amber-gold-400 hover:text-amber-gold-300 transition-colors font-medium group cursor-pointer"
              >
                <span>Conoce Nuestra Historia</span>
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Collections Preview */}
      <section className="container mx-auto px-4 lg:px-8 py-20 lg:py-28">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-gold-500 mb-4 font-medium">
            Colecciones con Proposito
          </p>
          <h2
            className="text-4xl lg:text-5xl font-light text-obsidian-900"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            Encuentra tu Intencion
          </h2>
          <div className="separator-luxury w-32 mx-auto mt-6"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {[
            {
              name: 'Proteccion y Energia',
              description: 'Amuletos con significado: Metatron, Nudo de Brujas, Ojo Turco y mas',
              image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&h=600&fit=crop',
              items: 15,
            },
            {
              name: 'Plata Fina 925',
              description: 'Collares, aros y pulseras en plata certificada para uso diario',
              image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=600&fit=crop',
              items: 32,
            },
            {
              name: 'Tendencia',
              description: 'Lo mas trendy en bano de oro, acero quirurgico y disenos del momento',
              image: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=800&h=600&fit=crop',
              items: 24,
            },
          ].map((collection, index) => (
            <Link
              key={collection.name}
              href="/colecciones"
              className="group relative h-[400px] lg:h-[500px] overflow-hidden cursor-pointer animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Image
                src={collection.image}
                alt={collection.name}
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950/80 via-obsidian-900/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <p className="text-xs uppercase tracking-widest text-amber-gold-400 mb-2">
                  {collection.items} productos
                </p>
                <h3
                  className="text-3xl lg:text-4xl font-light mb-2"
                  style={{ fontFamily: 'var(--font-cormorant)' }}
                >
                  {collection.name}
                </h3>
                <p className="text-sm text-pearl-300 mb-4">
                  {collection.description}
                </p>
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span>Explorar</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Testimonial / Social Proof */}
      <section className="bg-pearl-100 py-20 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <svg className="w-10 h-10 text-amber-gold-400 mx-auto mb-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
            </svg>
            <blockquote
              className="text-2xl lg:text-3xl font-light text-obsidian-900 leading-relaxed mb-8"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              &ldquo;Compre el collar Metatron como amuleto de proteccion y la calidad
              es increible. Plata 925 real, llego rapido y el packaging fue hermoso.
              Ya llevo 3 compras y siempre todo perfecto.&rdquo;
            </blockquote>
            <div>
              <p className="text-sm font-medium text-obsidian-900 uppercase tracking-wider">
                Catalina R.
              </p>
              <p className="text-xs text-platinum-600 mt-1">
                Clienta verificada &middot; Compra en Mercado Libre
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Instagram / Visual Grid */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 lg:px-8 text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-gold-500 mb-4 font-medium">
            @amber.joyas
          </p>
          <h2
            className="text-4xl lg:text-5xl font-light text-obsidian-900"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            Siguenos en Instagram
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-1">
          {[
            'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=400&h=400&fit=crop',
          ].map((imgSrc, index) => (
            <a
              key={index}
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden cursor-pointer"
            >
              <Image
                src={imgSrc}
                alt={`Instagram ${index + 1}`}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-obsidian-900/0 group-hover:bg-obsidian-900/40 transition-colors duration-300 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
