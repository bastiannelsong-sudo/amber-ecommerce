import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: 'Politicas de Devolucion',
  description: 'Conoce nuestras politicas de devolucion y cambio. 10 dias para devolver tu compra. Proceso simple y rapido en AMBER Joyas.',
  openGraph: {
    title: 'Politicas de Devolucion | AMBER Joyas',
    description: '10 dias para devolver tu compra. Proceso simple y rapido.',
    url: '/politicas-devolucion',
  },
  twitter: {
    title: 'Politicas de Devolucion | AMBER Joyas',
    description: '10 dias para devolver tu compra. Proceso simple.',
  },
  alternates: {
    canonical: '/politicas-devolucion',
  },
};

export default function PoliticasDevolucionPage() {
  return (
    <div className="min-h-screen bg-pearl-50">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-b from-obsidian-900 to-obsidian-800 py-20 lg:py-28">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-gold-400 font-medium mb-4">
            Compra con Confianza
          </p>
          <h1
            className="text-4xl lg:text-6xl font-light text-white tracking-wider mb-6"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            Politicas de Devolucion
          </h1>
          <p className="text-base lg:text-lg text-pearl-300 max-w-2xl mx-auto font-light">
            Queremos que estes 100% satisfecha con tu compra. Si no lo estas, lo solucionamos.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 lg:px-8 py-16 lg:py-24">
        <div className="max-w-3xl mx-auto">

          {/* Resumen rápido */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
            {[
              { value: '10 dias', label: 'Para solicitar devolucion', sub: 'Desde la recepcion' },
              { value: '48 hrs', label: 'Tiempo de respuesta', sub: 'Dias habiles' },
              { value: '100%', label: 'Reembolso garantizado', sub: 'En productos validos' },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-lg p-6 text-center shadow-sm">
                <p
                  className="text-3xl font-light text-amber-gold-500 mb-1"
                  style={{ fontFamily: 'var(--font-cormorant)' }}
                >
                  {stat.value}
                </p>
                <p className="font-medium text-obsidian-900 text-sm">{stat.label}</p>
                <p className="text-xs text-platinum-500 mt-1">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Derecho a retracto */}
          <div className="mb-16">
            <h2
              className="text-3xl lg:text-4xl font-light text-obsidian-900 mb-6"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Derecho a Retracto
            </h2>
            <div className="bg-white rounded-lg p-6 lg:p-8 shadow-sm space-y-4 text-platinum-700 leading-relaxed">
              <p>
                De acuerdo con la Ley del Consumidor de Chile (Ley 19.496), tienes derecho a retractarte
                de tu compra dentro de los <strong className="text-obsidian-900">10 dias corridos</strong> siguientes
                a la recepcion del producto, siempre que:
              </p>
              <ul className="space-y-3 ml-4">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-gold-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>La joya no haya sido usada y se encuentre en perfectas condiciones</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-gold-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Conserve su empaque original (bolsita, caja y etiquetas)</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-gold-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Cuentes con la boleta o comprobante de compra</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Proceso de devolución */}
          <div className="mb-16">
            <h2
              className="text-3xl lg:text-4xl font-light text-obsidian-900 mb-8"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Proceso de Devolucion
            </h2>
            <div className="space-y-6">
              {[
                {
                  step: '01',
                  title: 'Solicita tu devolucion',
                  desc: 'Contactanos por correo o Instagram con tu numero de pedido, el motivo de la devolucion y fotos del producto.',
                },
                {
                  step: '02',
                  title: 'Recibe instrucciones',
                  desc: 'En un plazo maximo de 48 horas habiles te confirmaremos la devolucion y te daremos instrucciones de envio.',
                },
                {
                  step: '03',
                  title: 'Envia el producto',
                  desc: 'Envia la joya en su empaque original a la direccion que te indiquemos. El costo de envio de devolucion corre por cuenta del comprador, salvo que el producto tenga un defecto.',
                },
                {
                  step: '04',
                  title: 'Recibe tu reembolso',
                  desc: 'Una vez recibido y verificado el producto, procesamos tu reembolso en un plazo de 5-10 dias habiles al mismo metodo de pago original.',
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-6">
                  <span
                    className="text-4xl font-light text-amber-gold-300 flex-shrink-0 w-12"
                    style={{ fontFamily: 'var(--font-cormorant)' }}
                  >
                    {item.step}
                  </span>
                  <div className="bg-white rounded-lg p-6 shadow-sm flex-1">
                    <p className="font-medium text-obsidian-900 mb-2">{item.title}</p>
                    <p className="text-sm text-platinum-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cambios */}
          <div className="mb-16">
            <h2
              className="text-3xl lg:text-4xl font-light text-obsidian-900 mb-6"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Cambios de Producto
            </h2>
            <div className="bg-amber-gold-50 rounded-lg p-6 lg:p-8 space-y-4 text-platinum-700 leading-relaxed">
              <p>
                Si prefieres cambiar tu joya por otra, el proceso es similar a la devolucion:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <span className="text-amber-gold-500 mt-1">&#8226;</span>
                  <span>Tienes 10 dias corridos desde la recepcion para solicitar el cambio.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-gold-500 mt-1">&#8226;</span>
                  <span>El producto debe estar sin uso y en su empaque original.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-gold-500 mt-1">&#8226;</span>
                  <span>Si el producto nuevo tiene un precio mayor, pagas la diferencia. Si es menor, te devolvemos la diferencia.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-gold-500 mt-1">&#8226;</span>
                  <span>Los costos de envio del cambio corren por cuenta del comprador.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Excepciones */}
          <div className="mb-16">
            <h2
              className="text-3xl lg:text-4xl font-light text-obsidian-900 mb-6"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Excepciones
            </h2>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <p className="text-platinum-700 mb-4">
                No se aceptan devoluciones ni cambios en los siguientes casos:
              </p>
              <ul className="space-y-2 text-platinum-600">
                {[
                  'Productos personalizados o grabados a pedido',
                  'Joyas que presenten signos de uso (rayones, desgaste, olores)',
                  'Productos sin empaque original o sin boleta',
                  'Solicitudes fuera del plazo de 10 dias',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <svg className="w-4 h-4 text-platinum-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-platinum-600 mb-6">
              ¿Necesitas hacer una devolucion o tienes dudas?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contacto"
                className="px-10 py-4 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors shadow-luxury"
              >
                Contactanos
              </Link>
              <Link
                href="/garantia"
                className="px-10 py-4 border-2 border-obsidian-900 text-obsidian-900 text-sm uppercase tracking-widest font-medium hover:bg-obsidian-900 hover:text-white transition-colors"
              >
                Ver Garantia
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
