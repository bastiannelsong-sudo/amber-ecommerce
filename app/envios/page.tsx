import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: 'Envios y Despacho',
  description: 'Envio gratuito en compras sobre $30.000. Despacho a todo Chile con Chilexpress y Correos de Chile. Seguimiento en tiempo real de tu pedido.',
  openGraph: {
    title: 'Envios y Despacho | AMBER Joyas',
    description: 'Envio gratuito sobre $30.000. Despacho a todo Chile con seguimiento.',
    url: '/envios',
  },
  twitter: {
    title: 'Envios y Despacho | AMBER Joyas',
    description: 'Envio gratuito sobre $30.000. Despacho a todo Chile.',
  },
  alternates: {
    canonical: '/envios',
  },
};

export default function EnviosPage() {
  return (
    <div className="min-h-screen bg-pearl-50">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-b from-obsidian-900 to-obsidian-800 py-20 lg:py-28">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-gold-400 font-medium mb-4">
            Despacho a Todo Chile
          </p>
          <h1
            className="text-4xl lg:text-6xl font-light text-white tracking-wider mb-6"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            Envios y Despacho
          </h1>
          <p className="text-base lg:text-lg text-pearl-300 max-w-2xl mx-auto font-light">
            Tu joya viaja protegida y con seguimiento hasta tu puerta.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 lg:px-8 py-16 lg:py-24">
        <div className="max-w-3xl mx-auto">

          {/* Envío gratis banner */}
          <div className="bg-gradient-to-r from-amber-gold-500 to-amber-gold-400 rounded-lg p-8 text-center mb-16 shadow-luxury">
            <h2
              className="text-3xl lg:text-4xl font-light text-obsidian-900 mb-3"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Envio Gratuito
            </h2>
            <p className="text-obsidian-800 text-lg font-medium">
              En todas las compras sobre $30.000
            </p>
            <p className="text-obsidian-700 text-sm mt-2">
              Aplica a todo Chile continental
            </p>
          </div>

          {/* Opciones de envío */}
          <div className="mb-16">
            <h2
              className="text-3xl lg:text-4xl font-light text-obsidian-900 mb-8"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Opciones de Envio
            </h2>
            <div className="space-y-4">
              {[
                {
                  carrier: 'Chilexpress',
                  time: '1-3 dias habiles',
                  cost: '$3.490',
                  detail: 'Entrega a domicilio o sucursal. Seguimiento en linea.',
                  free: 'Gratis sobre $30.000',
                },
                {
                  carrier: 'Correos de Chile',
                  time: '3-5 dias habiles',
                  cost: '$2.490',
                  detail: 'Entrega a domicilio. Seguimiento disponible.',
                  free: 'Gratis sobre $30.000',
                },
                {
                  carrier: 'Retiro en punto de encuentro',
                  time: 'Coordinar por Instagram',
                  cost: 'Gratis',
                  detail: 'Disponible en Santiago. Coordina directamente con nosotros.',
                  free: 'Siempre gratis',
                },
              ].map((option, i) => (
                <div key={i} className="bg-white rounded-lg p-6 shadow-sm border border-pearl-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                    <div>
                      <h3 className="font-medium text-obsidian-900 text-lg">{option.carrier}</h3>
                      <p className="text-sm text-platinum-500">{option.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-obsidian-900">{option.cost}</p>
                      <p className="text-xs text-amber-gold-600 font-medium">{option.free}</p>
                    </div>
                  </div>
                  <p className="text-sm text-platinum-600">{option.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Proceso de envío */}
          <div className="mb-16">
            <h2
              className="text-3xl lg:text-4xl font-light text-obsidian-900 mb-8"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Proceso de Despacho
            </h2>
            <div className="space-y-0">
              {[
                {
                  step: '1',
                  title: 'Confirmacion del pedido',
                  desc: 'Recibiras un correo de confirmacion con el detalle de tu compra.',
                },
                {
                  step: '2',
                  title: 'Preparacion',
                  desc: 'Preparamos tu pedido con empaque protector en 1 dia habil.',
                },
                {
                  step: '3',
                  title: 'Despacho',
                  desc: 'Tu paquete sale con el courier seleccionado y te enviamos el numero de seguimiento.',
                },
                {
                  step: '4',
                  title: 'Entrega',
                  desc: 'Recibe tu joya en la puerta de tu casa o en la sucursal mas cercana.',
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-6 relative">
                  {/* Line connector */}
                  {i < 3 && (
                    <div className="absolute left-5 top-12 bottom-0 w-px bg-amber-gold-200" />
                  )}
                  <div className="w-10 h-10 rounded-full bg-amber-gold-500 text-white flex items-center justify-center font-medium flex-shrink-0 z-10 text-sm">
                    {item.step}
                  </div>
                  <div className="pb-10">
                    <p className="font-medium text-obsidian-900">{item.title}</p>
                    <p className="text-sm text-platinum-600 mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Packaging */}
          <div className="bg-obsidian-900 rounded-lg p-8 lg:p-10 text-white mb-16">
            <h3
              className="text-2xl lg:text-3xl font-light mb-6"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Empaque con Cuidado
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { title: 'Bolsita de tela', desc: 'Cada joya viene en su bolsita protectora para guardarla.' },
                { title: 'Caja protectora', desc: 'Empaque rigido para que tu joya llegue perfecta.' },
                { title: 'Ideal para regalo', desc: 'Presentacion lista para regalar, sin costo adicional.' },
                { title: 'Envio discreto', desc: 'Paquete sellado y sin indicar el contenido.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-gold-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="font-medium text-pearl-100">{item.title}</p>
                    <p className="text-sm text-pearl-400 mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preguntas */}
          <div className="mb-16">
            <h2
              className="text-3xl lg:text-4xl font-light text-obsidian-900 mb-8"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Preguntas Sobre Envios
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: '¿Hacen envios a regiones?',
                  a: 'Si, despachamos a todo Chile continental a traves de Chilexpress y Correos de Chile.',
                },
                {
                  q: '¿Cuanto demora el envio?',
                  a: 'Chilexpress: 1-3 dias habiles. Correos de Chile: 3-5 dias habiles. Los tiempos pueden variar en zonas extremas.',
                },
                {
                  q: '¿Puedo rastrear mi pedido?',
                  a: 'Si, una vez despachado te enviamos el numero de seguimiento por correo electronico para que puedas rastrear tu paquete en tiempo real.',
                },
                {
                  q: '¿Que pasa si no estoy en casa?',
                  a: 'El courier intentara la entrega hasta 2 veces. Si no hay nadie, dejara un aviso para retirar en la sucursal mas cercana.',
                },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
                  <p className="font-medium text-obsidian-900 mb-2">{item.q}</p>
                  <p className="text-sm text-platinum-600">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-platinum-600 mb-6">
              ¿Tienes mas preguntas sobre tu envio?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contacto"
                className="px-10 py-4 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors shadow-luxury"
              >
                Contactanos
              </Link>
              <Link
                href="/catalogo"
                className="px-10 py-4 border-2 border-obsidian-900 text-obsidian-900 text-sm uppercase tracking-widest font-medium hover:bg-obsidian-900 hover:text-white transition-colors"
              >
                Ver Catalogo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
