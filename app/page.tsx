import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from './components/Header';
import FeaturedProducts, {
  FeaturedProductsSkeleton,
} from './components/FeaturedProducts';
import TestimonialCarousel from './components/TestimonialCarousel';
import Footer from './components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
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
            {/* Badge de novedad */}
            <div className="animate-fade-in">
              <span className="inline-block px-4 py-1.5 border border-amber-gold-400/40 text-amber-gold-300 text-[10px] uppercase tracking-[0.25em] font-medium mb-4">
                Nueva Coleccion Disponible
              </span>
            </div>

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
                Explorar la Coleccion
              </Link>
              <Link
                href="/amuletos/proteccion"
                className="px-12 py-4 border border-white/30 text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-white/10 transition-all duration-300 cursor-pointer"
              >
                Descubrir Amuletos
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
                  <span className="text-amber-gold-400 text-sm font-bold tracking-tight" style={{ fontFamily: 'var(--font-cormorant)' }}>
                    925
                  </span>
                ),
                title: 'Plata 925',
                subtitle: 'Materiales de calidad',
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                ),
                title: '+2.000 Joyas Entregadas',
                subtitle: 'Clientas satisfechas en todo Chile',
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                ),
                title: 'Envio Gratuito',
                subtitle: 'En compras sobre $50.000 en Chile',
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ),
                title: 'Cambios sin Costo',
                subtitle: 'Devoluciones faciles y rapidas',
              },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-4 text-white">
                <div className="text-amber-gold-400 flex-shrink-0 w-8 h-8 flex items-center justify-center border border-amber-gold-500/30 rounded-full">
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

      {/* Categories */}
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

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-5">
          {[
            {
              name: 'Pulseras',
              href: '/pulseras',
              image: '/images/home/pulsera_home.jpg',
            },
            {
              name: 'Aros',
              href: '/aros',
              image: '/images/home/aros_home.jpg',
            },
            {
              name: 'Anillos',
              href: '/anillos',
              image: '/images/anillo_home.jpg',
            },
            {
              name: 'Regalos',
              href: '/regalos',
              image: '/images/home/cadenas_home.webp',
            },
            {
              name: 'Amuletos',
              href: '/amuletos',
              image: '/images/home/amuleto_home3.jpg',
              highlight: true,
            },
          ].map((category, index) => (
            <Link
              key={category.name}
              href={category.href}
              className={`group relative overflow-hidden cursor-pointer animate-fade-in ${
                category.highlight
                  ? 'aspect-[3/4] col-span-2 lg:col-span-1'
                  : 'aspect-[3/4]'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Image
                src={category.image}
                alt={category.name}
                fill
                sizes="(max-width: 768px) 50vw, 20vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950/70 via-obsidian-900/20 to-transparent" />
              {category.highlight && (
                <div className="absolute top-3 right-3 bg-amber-gold-500 text-obsidian-900 px-2 py-1 text-[9px] uppercase tracking-wider font-bold">
                  Destacado
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-6 text-white">
                <h3
                  className="text-xl lg:text-2xl font-light mb-1"
                  style={{ fontFamily: 'var(--font-cormorant)' }}
                >
                  {category.name}
                </h3>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-[10px] uppercase tracking-wider text-pearl-300">
                    Ver productos
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

          <Suspense fallback={<FeaturedProductsSkeleton />}>
            <FeaturedProducts />
          </Suspense>
        </div>
      </section>

      {/* Editorial / Brand Story */}
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
                className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-amber-gold-400 hover:text-amber-gold-300 transition-colors font-medium group"
              >
                <span>Descubre por que creamos AMBER</span>
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <TestimonialCarousel />

      {/* Trust & Confidence Strip - antes del footer */}
      <section className="bg-white py-16 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-gold-500 mb-4 font-medium">
              Compra con confianza
            </p>
            <h2
              className="text-3xl lg:text-4xl font-light text-obsidian-900"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Tu Tranquilidad es Nuestra Prioridad
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                ),
                title: 'Pago 100% Seguro',
                description: 'Tus datos protegidos con encriptacion SSL de ultima generacion',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ),
                title: 'Cambios y Devoluciones',
                description: 'Si no es lo que esperabas, hazlo sin complicaciones y sin costo',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                ),
                title: 'Envio Rapido',
                description: 'Despacho en 1-3 dias habiles a todo Chile continental',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                  </svg>
                ),
                title: 'Atencion Personalizada',
                description: 'Resolvemos tus dudas por WhatsApp en minutos',
              },
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 mx-auto mb-5 flex items-center justify-center text-amber-gold-500 border border-pearl-200 group-hover:border-amber-gold-400 group-hover:shadow-gold transition-all duration-300 rounded-full">
                  {item.icon}
                </div>
                <h3 className="text-sm font-medium text-obsidian-900 uppercase tracking-wider mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-platinum-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
