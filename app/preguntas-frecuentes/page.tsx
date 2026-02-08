import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: 'Preguntas Frecuentes',
  description: 'Resuelve tus dudas sobre joyas en Plata 925, envios, garantia, pagos y devoluciones en AMBER. Todo lo que necesitas saber antes de comprar.',
  openGraph: {
    title: 'Preguntas Frecuentes | AMBER Joyas',
    description: 'Resuelve tus dudas sobre joyas, envios, garantia y pagos en AMBER.',
    url: '/preguntas-frecuentes',
  },
  twitter: {
    title: 'Preguntas Frecuentes | AMBER Joyas',
    description: 'Resuelve tus dudas sobre joyas, envios, garantia y pagos.',
  },
  alternates: {
    canonical: '/preguntas-frecuentes',
  },
};

export default function PreguntasFrecuentesPage() {
  const faqCategories = [
    {
      category: 'Sobre Nuestras Joyas',
      questions: [
        {
          q: '¿La plata 925 es plata real?',
          a: 'Si. La plata 925, tambien llamada plata esterlina o sterling silver, contiene un 92.5% de plata pura y un 7.5% de otros metales (generalmente cobre) que le dan mayor durabilidad. Es el estandar internacional para joyeria de plata fina.',
        },
        {
          q: '¿El bano de oro se sale?',
          a: 'El bano de oro es una capa de oro real aplicada sobre una base de calidad. Con el uso diario y cuidados normales puede durar muchos meses. Evita el contacto con agua, perfumes y quimicos para prolongar su durabilidad.',
        },
        {
          q: '¿Que son los amuletos de proteccion?',
          a: 'Son joyas con simbolos que historicamente se han asociado a la proteccion y la energia positiva, como el Metatron, el Nudo de Brujas, el Ojo Turco o el Arbol de la Vida. Cada pieza tiene un significado especial.',
        },
        {
          q: '¿Sus joyas irritan la piel?',
          a: 'No. Trabajamos con materiales hipoalergenicos: plata 925, acero quirurgico y bano de oro de calidad. Son seguros para pieles sensibles. Si tienes alguna alergia especifica, contactanos antes de comprar.',
        },
        {
          q: '¿Como cuido mis joyas?',
          a: 'Guardalas en la bolsita que incluimos, evita el contacto con perfumes y quimicos, retiratelas antes de ducharte o nadar, y limpia la plata con un pano suave. Asi duraran mucho mas tiempo.',
        },
      ],
    },
    {
      category: 'Compras y Pagos',
      questions: [
        {
          q: '¿Que metodos de pago aceptan?',
          a: 'Aceptamos tarjetas de credito y debito (Visa, Mastercard, American Express) a traves de MercadoPago, ademas de transferencia bancaria. Todos los pagos son 100% seguros.',
        },
        {
          q: '¿Puedo pagar en cuotas?',
          a: 'Si, a traves de MercadoPago puedes pagar en cuotas con tu tarjeta de credito. Las opciones de cuotas dependen de tu banco emisor.',
        },
        {
          q: '¿Es seguro comprar en su tienda?',
          a: 'Absolutamente. Usamos MercadoPago como pasarela de pagos, que cuenta con proteccion al comprador y encriptacion SSL. Tus datos estan siempre protegidos.',
        },
        {
          q: '¿Los precios son los mismos que en Mercado Libre?',
          a: 'En nuestra tienda web ofrecemos precios exclusivos, generalmente entre un 10-15% mas baratos que en marketplaces, ya que no tenemos comisiones de intermediarios.',
        },
      ],
    },
    {
      category: 'Envios',
      questions: [
        {
          q: '¿Cuanto cuesta el envio?',
          a: 'El envio es gratuito en compras sobre $30.000. Para montos menores, el costo varia segun el courier: $3.490 por Chilexpress y $2.490 por Correos de Chile.',
        },
        {
          q: '¿Cuanto demora en llegar?',
          a: 'Preparamos tu pedido en 1 dia habil. Luego, Chilexpress demora 1-3 dias habiles y Correos de Chile 3-5 dias habiles, dependiendo de tu ubicacion.',
        },
        {
          q: '¿Envian a regiones?',
          a: 'Si, despachamos a todo Chile continental. Los tiempos de entrega pueden ser mayores en zonas extremas.',
        },
        {
          q: '¿Puedo rastrear mi pedido?',
          a: 'Si. Una vez despachado, te enviamos el numero de seguimiento a tu correo para que puedas rastrear tu paquete en tiempo real.',
        },
      ],
    },
    {
      category: 'Garantia y Devoluciones',
      questions: [
        {
          q: '¿Tienen garantia?',
          a: 'Si, todas nuestras joyas tienen garantia de 12 meses contra defectos de fabricacion. Consulta nuestra pagina de garantia para mas detalles.',
        },
        {
          q: '¿Puedo devolver una joya?',
          a: 'Si, tienes 10 dias corridos desde la recepcion para solicitar una devolucion. La pieza debe estar sin uso, en su empaque original y con boleta.',
        },
        {
          q: '¿Que hago si mi joya llego con un defecto?',
          a: 'Contactanos inmediatamente con fotos del defecto y tu numero de pedido. Te daremos una solucion en un plazo maximo de 48 horas habiles: cambio, reparacion o reembolso.',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-pearl-50">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-b from-obsidian-900 to-obsidian-800 py-20 lg:py-28">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-gold-400 font-medium mb-4">
            Resuelve tus Dudas
          </p>
          <h1
            className="text-4xl lg:text-6xl font-light text-white tracking-wider mb-6"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            Preguntas Frecuentes
          </h1>
          <p className="text-base lg:text-lg text-pearl-300 max-w-2xl mx-auto font-light">
            Todo lo que necesitas saber sobre nuestras joyas, envios y compras.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 lg:px-8 py-16 lg:py-24">
        <div className="max-w-3xl mx-auto">

          {/* FAQ Categories */}
          {faqCategories.map((cat, catIndex) => (
            <div key={catIndex} className="mb-16">
              <h2
                className="text-3xl lg:text-4xl font-light text-obsidian-900 mb-8"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                {cat.category}
              </h2>
              <div className="space-y-4">
                {cat.questions.map((faq, i) => (
                  <div key={i} className="bg-white rounded-lg p-6 shadow-sm border border-pearl-100">
                    <h3 className="font-medium text-obsidian-900 mb-3 text-lg">{faq.q}</h3>
                    <p className="text-platinum-600 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Still have questions */}
          <div className="bg-amber-gold-50 rounded-lg p-8 lg:p-10 text-center">
            <h3
              className="text-2xl lg:text-3xl font-light text-obsidian-900 mb-4"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              ¿No Encontraste tu Respuesta?
            </h3>
            <p className="text-platinum-600 mb-8 max-w-xl mx-auto">
              Escribenos directamente y te responderemos lo antes posible. Estamos para ayudarte a encontrar la joya perfecta.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contacto"
                className="px-10 py-4 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors shadow-luxury"
              >
                Contactanos
              </Link>
              <a
                href="https://instagram.com/amber.joyas"
                target="_blank"
                rel="noopener noreferrer"
                className="px-10 py-4 border-2 border-obsidian-900 text-obsidian-900 text-sm uppercase tracking-widest font-medium hover:bg-obsidian-900 hover:text-white transition-colors"
              >
                Instagram
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
