import Header from '../components/Header';
import Footer from '../components/Footer';

export default function SobreNosotrosPage() {
  return (
    <div className="min-h-screen bg-pearl-50">
      <Header />

      {/* Hero Section */}
      <section className="relative h-[60vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian-950/60 via-obsidian-900/30 to-obsidian-950/50 z-10" />
        <img
          src="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=1920&h=1080&fit=crop"
          alt="Nuestra Historia"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="text-center text-white space-y-6 px-4 animate-fade-in">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-gold-400 font-medium">
              Desde 2004
            </p>
            <h1
              className="text-5xl lg:text-7xl font-light tracking-wider"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Nuestra Historia
            </h1>
            <p className="text-base lg:text-lg tracking-wide font-light max-w-2xl mx-auto text-pearl-200">
              Mas de 20 anos creando piezas unicas que trascienden el tiempo
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
                Una Tradición de Excelencia
              </h2>
              <p className="text-platinum-700 leading-relaxed text-lg">
                Desde 2004, Amber ha sido sinónimo de elegancia y distinción en el mundo de la
                joyería artesanal. Cada pieza que creamos es el resultado de años de experiencia,
                dedicación y pasión por el arte de la orfebrería.
              </p>
              <p className="text-platinum-700 leading-relaxed text-lg">
                Nuestro compromiso es crear joyas que no solo adornen, sino que cuenten historias
                y se conviertan en tesoros familiares que pasen de generación en generación.
              </p>
            </div>
            <div className="relative h-[500px] animate-fade-in animate-delay-200">
              <img
                src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=800&fit=crop"
                alt="Artesanía"
                className="absolute inset-0 w-full h-full object-cover shadow-luxury rounded-lg"
              />
            </div>
          </div>

          {/* Values Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-24">
            <div className="text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-amber-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3
                className="text-2xl font-light text-obsidian-900"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                Calidad
              </h3>
              <p className="text-platinum-600">
                Materiales premium certificados y procesos artesanales que garantizan durabilidad
                y belleza atemporal.
              </p>
            </div>

            <div className="text-center space-y-4 animate-fade-in animate-delay-100">
              <div className="w-16 h-16 bg-amber-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3
                className="text-2xl font-light text-obsidian-900"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                Tradición
              </h3>
              <p className="text-platinum-600">
                Técnicas ancestrales combinadas con diseño contemporáneo para crear piezas únicas
                e irrepetibles.
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
                Pasión
              </h3>
              <p className="text-platinum-600">
                Cada pieza es creada con amor y dedicación, reflejando nuestro compromiso con la
                excelencia artesanal.
              </p>
            </div>
          </div>

          {/* Team Section */}
          <div className="bg-gradient-to-br from-obsidian-900 to-obsidian-800 rounded-lg p-12 text-white text-center mb-24">
            <h2
              className="text-4xl lg:text-5xl font-light mb-6"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Nuestro Equipo
            </h2>
            <p className="text-lg text-pearl-300 max-w-3xl mx-auto mb-12">
              Un grupo de maestros orfebres, diseñadores y artesanos apasionados que trabajan
              juntos para crear piezas extraordinarias. Cada miembro aporta su experiencia única
              para garantizar que cada joya sea perfecta.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: 'María González',
                  role: 'Maestra Orfebre',
                  image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop',
                },
                {
                  name: 'Carlos Pérez',
                  role: 'Diseñador Principal',
                  image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
                },
                {
                  name: 'Ana Martínez',
                  role: 'Especialista en Gemas',
                  image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop',
                },
              ].map((member, index) => (
                <div key={index} className="space-y-4">
                  <div className="w-32 h-32 rounded-full overflow-hidden mx-auto border-4 border-amber-gold-500">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium">{member.name}</h3>
                    <p className="text-amber-gold-400 text-sm">{member.role}</p>
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
              Visítanos
            </h2>
            <p className="text-lg text-platinum-600 max-w-2xl mx-auto">
              Te invitamos a conocer nuestro atelier y descubrir el proceso de creación de cada
              pieza. Agenda una cita para una experiencia personalizada.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/"
                className="px-12 py-4 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors shadow-luxury"
              >
                Ver Catálogo
              </a>
              <button className="px-12 py-4 border-2 border-obsidian-900 text-obsidian-900 text-sm uppercase tracking-widest font-medium hover:bg-obsidian-900 hover:text-white transition-colors">
                Agendar Cita
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
