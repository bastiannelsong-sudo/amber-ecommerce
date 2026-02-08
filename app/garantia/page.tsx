import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: 'Garantia de 12 Meses',
  description: 'Todas nuestras joyas en Plata 925 incluyen garantia de 12 meses. Conoce que cubre nuestra garantia y como hacer valida tu cobertura.',
  openGraph: {
    title: 'Garantia de 12 Meses | AMBER Joyas',
    description: 'Garantia de 12 meses en todas nuestras joyas. Plata 925 certificada con respaldo directo.',
    url: '/garantia',
  },
  twitter: {
    title: 'Garantia de 12 Meses | AMBER Joyas',
    description: 'Garantia de 12 meses en todas nuestras joyas en Plata 925.',
  },
  alternates: {
    canonical: '/garantia',
  },
};

export default function GarantiaPage() {
  return (
    <div className="min-h-screen bg-pearl-50">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-b from-obsidian-900 to-obsidian-800 py-20 lg:py-28">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-gold-400 font-medium mb-4">
            Tu Compra Protegida
          </p>
          <h1
            className="text-4xl lg:text-6xl font-light text-white tracking-wider mb-6"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            Garantia de 12 Meses
          </h1>
          <p className="text-base lg:text-lg text-pearl-300 max-w-2xl mx-auto font-light">
            Respaldamos cada pieza que vendemos. Si algo no esta bien, lo solucionamos.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 lg:px-8 py-16 lg:py-24">
        <div className="max-w-3xl mx-auto">

          {/* Qué cubre */}
          <div className="mb-16">
            <h2
              className="text-3xl lg:text-4xl font-light text-obsidian-900 mb-8"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Que Cubre Nuestra Garantia
            </h2>
            <div className="space-y-4">
              {[
                {
                  title: 'Defectos de fabricacion',
                  desc: 'Roturas de eslabones, cierres defectuosos, piedras sueltas o soldaduras debiles que se presenten durante el uso normal.',
                },
                {
                  title: 'Desprendimiento prematuro del bano',
                  desc: 'Si el bano de oro o rodio se deteriora en los primeros 6 meses con uso normal y cuidado adecuado.',
                },
                {
                  title: 'Oxidacion anormal de la Plata 925',
                  desc: 'Si tu pieza de plata 925 presenta manchas o cambios de color inusuales en condiciones normales de uso.',
                },
                {
                  title: 'Problemas con el cierre',
                  desc: 'Cierres que no funcionan correctamente, broches que no ajustan o mecanismos defectuosos.',
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-6 bg-white rounded-lg shadow-sm">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-obsidian-900">{item.title}</p>
                    <p className="text-sm text-platinum-600 mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Qué NO cubre */}
          <div className="mb-16">
            <h2
              className="text-3xl lg:text-4xl font-light text-obsidian-900 mb-8"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Que No Cubre
            </h2>
            <div className="space-y-4">
              {[
                'Desgaste natural por uso prolongado (la plata puede oscurecerse naturalmente)',
                'Danos causados por contacto con perfumes, cloro, productos quimicos o agua salada',
                'Danos por golpes, aplastamiento o mal uso evidente',
                'Modificaciones o reparaciones realizadas por terceros',
                'Piezas sin boleta o comprobante de compra',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4">
                  <div className="w-5 h-5 rounded-full border-2 border-platinum-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-platinum-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-platinum-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cómo hacerla válida */}
          <div className="mb-16">
            <h2
              className="text-3xl lg:text-4xl font-light text-obsidian-900 mb-8"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Como Hacer Valida tu Garantia
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  step: '01',
                  title: 'Contactanos',
                  desc: 'Escribenos por Instagram @amber.joyas o a nuestro correo con tu numero de pedido.',
                },
                {
                  step: '02',
                  title: 'Envia fotos',
                  desc: 'Adjunta fotos claras del defecto junto con tu boleta o comprobante de compra.',
                },
                {
                  step: '03',
                  title: 'Solucion rapida',
                  desc: 'En 48 horas habiles te damos una respuesta: cambio, reparacion o reembolso.',
                },
              ].map((item, i) => (
                <div key={i} className="text-center p-6 bg-white rounded-lg shadow-sm">
                  <span
                    className="text-4xl font-light text-amber-gold-400 block mb-3"
                    style={{ fontFamily: 'var(--font-cormorant)' }}
                  >
                    {item.step}
                  </span>
                  <p className="font-medium text-obsidian-900 mb-2">{item.title}</p>
                  <p className="text-sm text-platinum-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tip de cuidados */}
          <div className="bg-amber-gold-50 rounded-lg p-8 lg:p-10 mb-16">
            <h3
              className="text-2xl font-light text-obsidian-900 mb-4"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Tips para Cuidar tus Joyas
            </h3>
            <ul className="space-y-3 text-platinum-700">
              <li className="flex items-start gap-3">
                <span className="text-amber-gold-500 mt-1">&#8226;</span>
                Guarda tus joyas en un lugar seco, idealmente en la bolsita que viene con tu pedido.
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-gold-500 mt-1">&#8226;</span>
                Evita el contacto con perfumes, cremas y productos de limpieza.
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-gold-500 mt-1">&#8226;</span>
                Retirate las joyas antes de ducharte, nadar o hacer ejercicio.
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-gold-500 mt-1">&#8226;</span>
                Limpia la plata 925 con un pano suave y seco. Si se oscurece, usa un pano especial para plata.
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-platinum-600 mb-6">
              ¿Tienes alguna duda sobre tu garantia?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contacto"
                className="px-10 py-4 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors shadow-luxury"
              >
                Contactanos
              </Link>
              <Link
                href="/preguntas-frecuentes"
                className="px-10 py-4 border-2 border-obsidian-900 text-obsidian-900 text-sm uppercase tracking-widest font-medium hover:bg-obsidian-900 hover:text-white transition-colors"
              >
                Preguntas Frecuentes
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
