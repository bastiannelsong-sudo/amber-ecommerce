import Image from 'next/image';
import Link from 'next/link';
import Header from './components/Header';
import FeaturedProducts from './components/FeaturedProducts';
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
              <a
                href="https://wa.me/56932897499?text=Hola!%20Me%20comunico%20desde%20la%20web%20de%20AMBER%20Joyas."
                target="_blank"
                rel="noopener noreferrer"
                className="px-12 py-4 bg-[#25D366] text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#20BD5A] transition-all duration-300 cursor-pointer flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Escribenos
              </a>
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {[
            {
              name: 'Pulseras',
              image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&h=700&fit=crop',
            },
            {
              name: 'Aros',
              image: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=600&h=700&fit=crop',
            },
            {
              name: 'Anillos',
              image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=700&fit=crop',
            },
            {
              name: 'Cadenas',
              image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=700&fit=crop',
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

          <FeaturedProducts />
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
              <a
                href="https://wa.me/56932897499?text=Hola!%20Quiero%20saber%20mas%20sobre%20AMBER%20Joyas."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-amber-gold-400 hover:text-amber-gold-300 transition-colors font-medium group cursor-pointer"
              >
                <span>Escribenos por WhatsApp</span>
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
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

      <Footer />
    </div>
  );
}
