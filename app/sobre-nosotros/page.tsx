import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: 'Nuestra Historia',
  description: 'Conoce AMBER: joyeria en plata 925 y amuletos de proteccion con significado. Presentes en Mercado Libre, Falabella y Paris. Mas de 1.400 seguidores confian en nosotros.',
  openGraph: {
    title: 'Nuestra Historia | AMBER Joyas',
    description: 'Joyeria en plata 925 y amuletos de proteccion con significado. Presentes en Mercado Libre, Falabella y Paris.',
    url: '/sobre-nosotros',
  },
  twitter: {
    title: 'Nuestra Historia | AMBER Joyas',
    description: 'Joyeria en plata 925 y amuletos de proteccion con significado.',
  },
  alternates: {
    canonical: '/sobre-nosotros',
  },
};

export default function SobreNosotrosPage() {
  return (
    <div className="min-h-screen bg-pearl-50">
      <Header />

      {/* Hero Section */}
      <section className="relative h-[60vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian-950/60 via-obsidian-900/30 to-obsidian-950/50 z-10" />
        <Image
          src="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=1920&h=1080&fit=crop"
          alt="Nuestra Historia"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="text-center text-white space-y-6 px-4 animate-fade-in">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-gold-400 font-medium">
              Joyas con Alma
            </p>
            <h1
              className="text-5xl lg:text-7xl font-light tracking-wider"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Nuestra Historia
            </h1>
            <p className="text-base lg:text-lg tracking-wide font-light max-w-2xl mx-auto text-pearl-200">
              De emprendimiento en marketplaces a marca con proposito
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="container mx-auto px-4 lg:px-8 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
            <div className="space-y-6 animate-fade-in">
              <h2
                className="text-4xl lg:text-5xl font-light text-obsidian-900 mb-6"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                No Somos Solo una Tienda Mas
              </h2>
              <p className="text-platinum-700 leading-relaxed text-lg">
                AMBER nacio con una idea simple: que las joyas bonitas y con significado
                no tienen por que costar una fortuna. Empezamos vendiendo en Mercado Libre
                y hoy estamos presentes en Falabella y Paris, con mas de 1.400 personas
                que confian en nosotros.
              </p>
              <p className="text-platinum-700 leading-relaxed text-lg">
                Nos especializamos en plata fina 925, amuletos de proteccion y accesorios
                de tendencia. Cada pieza que ofrecemos es seleccionada pensando en calidad,
                significado y estilo — para que puedas usarla todos los dias sin preocupaciones.
              </p>
            </div>
            <div className="relative h-[500px] animate-fade-in animate-delay-200">
              <Image
                src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=800&fit=crop"
                alt="Joyas AMBER"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover rounded-lg"
              />
            </div>
          </div>

          {/* Values Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-24">
            <div className="text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-amber-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3
                className="text-2xl font-light text-obsidian-900"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                Calidad Real
              </h3>
              <p className="text-platinum-600">
                Plata 925 certificada, bano de oro de alta durabilidad y materiales
                que no se oscurecen ni irritan la piel. Lo que decimos, lo cumplimos.
              </p>
            </div>

            <div className="text-center space-y-4 animate-fade-in animate-delay-100">
              <div className="w-16 h-16 bg-amber-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </div>
              <h3
                className="text-2xl font-light text-obsidian-900"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                Significado
              </h3>
              <p className="text-platinum-600">
                Creemos que una joya puede ser mas que un accesorio. Nuestros amuletos
                de proteccion llevan intenciones de energia, proteccion y amor.
              </p>
            </div>

            <div className="text-center space-y-4 animate-fade-in animate-delay-200">
              <div className="w-16 h-16 bg-amber-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3
                className="text-2xl font-light text-obsidian-900"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                Precio Justo
              </h3>
              <p className="text-platinum-600">
                Joyas de calidad no tienen por que ser inalcanzables. Ofrecemos piezas
                hermosas desde $9.590, con envio gratuito sobre $30.000.
              </p>
            </div>
          </div>

          {/* Presence Section */}
          <div className="relative bg-gradient-to-br from-obsidian-950 via-obsidian-900 to-obsidian-800 rounded-2xl overflow-hidden mb-24">
            {/* Decorative dot grid */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '32px 32px'
            }} />
            {/* Ambient gold glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-gold-500/5 rounded-full blur-3xl -translate-y-1/2" />

            <div className="relative z-10 px-6 py-14 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
              {/* Header */}
              <div className="text-center mb-12 sm:mb-16">
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-amber-gold-400 font-medium mb-4">
                  Presencia Multicanal
                </p>
                <h2
                  className="text-3xl sm:text-4xl lg:text-5xl font-light text-white mb-5"
                  style={{ fontFamily: 'var(--font-cormorant)' }}
                >
                  Donde nos Encuentras
                </h2>
                <div className="separator-luxury w-20 mx-auto mb-6" />
                <p className="text-sm sm:text-base lg:text-lg text-pearl-300/90 max-w-2xl mx-auto leading-relaxed">
                  Somos una marca multicanal. Puedes comprarnos en los principales marketplaces
                  de Chile, o directamente aqui en nuestra tienda oficial con precios exclusivos
                  y beneficios unicos.
                </p>
              </div>

              {/* Marketplace Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">

                {/* Mercado Libre */}
                <div className="group relative bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-amber-gold-400/30 rounded-xl p-6 sm:p-8 text-center transition-all duration-500 hover-lift">
                  <div className="flex items-center justify-center h-14 sm:h-16 mb-5">
                    <svg viewBox="0 0 180 50" className="h-10 sm:h-12 w-auto" role="img" aria-label="Mercado Libre">
                      <path d="M25 4C25 4 14.5 17 14.5 26C14.5 33 19 37 25 37C31 37 35.5 33 35.5 26C35.5 17 25 4 25 4Z" fill="#FFE600"/>
                      <path d="M18 22C18 22 21 18.5 25 18.5C29 18.5 32 22 32 22" stroke="#3483FA" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
                      <path d="M20 26.5C20 26.5 22.5 24 25 24C27.5 24 30 26.5 30 26.5" stroke="#3483FA" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                      <text x="46" y="22" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="700" fontSize="14" fill="#FFFFFF">Mercado</text>
                      <text x="46" y="38" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="400" fontSize="14" fill="#FFE600">Libre</text>
                    </svg>
                  </div>
                  <div className="space-y-2.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-gold-500/10 text-amber-gold-400 text-xs font-medium">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/></svg>
                      +1.400 seguidores
                    </span>
                    <p className="text-pearl-400 text-sm leading-relaxed">
                      Nuestra tienda original con reputacion verificada
                    </p>
                  </div>
                </div>

                {/* Falabella */}
                <div className="group relative bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-amber-gold-400/30 rounded-xl p-6 sm:p-8 text-center transition-all duration-500 hover-lift">
                  <div className="flex items-center justify-center h-14 sm:h-16 mb-5">
                    <svg viewBox="0 0 180 50" className="h-10 sm:h-12 w-auto" role="img" aria-label="Falabella">
                      <rect x="2" y="8" width="30" height="34" rx="6" fill="#C3D600"/>
                      <text x="10" y="34" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="24" fill="#FFFFFF">f</text>
                      <text x="42" y="30" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="700" fontSize="16" fill="#FFFFFF" letterSpacing="0.5">falabella</text>
                      <text x="42" y="42" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="400" fontSize="9" fill="#C3D600" letterSpacing="1">.com</text>
                    </svg>
                  </div>
                  <div className="space-y-2.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-gold-500/10 text-amber-gold-400 text-xs font-medium">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                      Marketplace oficial
                    </span>
                    <p className="text-pearl-400 text-sm leading-relaxed">
                      Presencia en la vitrina mas grande de Chile
                    </p>
                  </div>
                </div>

                {/* Paris */}
                <div className="group relative bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-amber-gold-400/30 rounded-xl p-6 sm:p-8 text-center transition-all duration-500 hover-lift">
                  <div className="flex items-center justify-center h-14 sm:h-16 mb-5">
                    <svg viewBox="0 0 150 50" className="h-10 sm:h-12 w-auto" role="img" aria-label="Paris">
                      <circle cx="20" cy="25" r="17" fill="#E31937"/>
                      <text x="12" y="33" fontFamily="Georgia, 'Times New Roman', serif" fontWeight="700" fontSize="22" fill="#FFFFFF">P</text>
                      <text x="46" y="32" fontFamily="Georgia, 'Times New Roman', serif" fontWeight="700" fontSize="20" fill="#FFFFFF" letterSpacing="2">paris</text>
                      <text x="46" y="44" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="400" fontSize="8" fill="#E31937" letterSpacing="1">.cl</text>
                    </svg>
                  </div>
                  <div className="space-y-2.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-gold-500/10 text-amber-gold-400 text-xs font-medium">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                      Marketplace oficial
                    </span>
                    <p className="text-pearl-400 text-sm leading-relaxed">
                      Alcance a nuevas clientas en todo el pais
                    </p>
                  </div>
                </div>
              </div>

              {/* Trust footer */}
              <div className="mt-10 sm:mt-14 pt-8 border-t border-white/[0.06] text-center">
                <p className="text-pearl-400/70 text-xs sm:text-sm tracking-wide">
                  Mas de <span className="text-amber-gold-400 font-medium">1.400 clientas satisfechas</span> en marketplaces &middot; Reputacion verificada &middot; Envios a todo Chile
                </p>
              </div>
            </div>
          </div>

          {/* Why buy here */}
          <div className="bg-amber-gold-50 rounded-lg p-10 lg:p-14 mb-24">
            <div className="text-center mb-10">
              <h2
                className="text-3xl lg:text-4xl font-light text-obsidian-900 mb-4"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                Por que Comprar en Nuestra Tienda
              </h2>
              <div className="separator-luxury w-32 mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { title: 'Precios exclusivos', desc: '10-15% menos que en marketplaces' },
                { title: 'Envio gratuito', desc: 'En compras sobre $30.000' },
                { title: 'Colecciones exclusivas', desc: 'Piezas que solo encuentras aqui' },
                { title: 'Garantia de 12 meses', desc: 'Respaldo directo con nosotros' },
                { title: 'Pago seguro', desc: 'MercadoPago, tarjetas y transferencia' },
                { title: 'Atencion personalizada', desc: 'Te ayudamos a elegir la pieza perfecta' },
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-amber-gold-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-obsidian-900">{benefit.title}</p>
                    <p className="text-sm text-platinum-600">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center space-y-8">
            <h2
              className="text-4xl lg:text-5xl font-light text-obsidian-900"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Empieza a Brillar
            </h2>
            <p className="text-lg text-platinum-600 max-w-2xl mx-auto">
              Explora nuestro catalogo y encuentra joyas con significado a precios justos.
              Plata 925 real, envio rapido y garantia de satisfaccion.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/catalogo"
                className="px-12 py-4 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors shadow-luxury"
              >
                Ver Catalogo
              </Link>
              <Link
                href="/contacto"
                className="px-12 py-4 border-2 border-obsidian-900 text-obsidian-900 text-sm uppercase tracking-widest font-medium hover:bg-obsidian-900 hover:text-white transition-colors"
              >
                Contactanos
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
