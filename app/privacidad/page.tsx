import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: 'Politica de Privacidad',
  description: 'Conoce como AMBER Joyas protege tus datos personales. Politica de privacidad, uso de datos y derechos del usuario.',
  openGraph: {
    title: 'Politica de Privacidad | AMBER Joyas',
    description: 'Como protegemos tus datos personales en AMBER Joyas.',
    url: '/privacidad',
  },
  twitter: {
    title: 'Politica de Privacidad | AMBER Joyas',
    description: 'Como protegemos tus datos personales en AMBER Joyas.',
  },
  alternates: {
    canonical: '/privacidad',
  },
};

export default function PrivacidadPage() {
  const sections = [
    {
      title: '1. Responsable del Tratamiento',
      content: [
        'AMBER Joyas, con sitio web amberjoyeria.cl, es responsable del tratamiento de los datos personales que recopilamos a traves de nuestra tienda online.',
        'Si tienes preguntas sobre esta politica o sobre tus datos personales, puedes contactarnos a traves de nuestra pagina de contacto o por Instagram @amber.joyas.',
      ],
    },
    {
      title: '2. Datos que Recopilamos',
      content: [
        'Recopilamos los siguientes datos personales cuando realizas una compra o interactuas con nuestro sitio:',
      ],
      list: [
        'Nombre completo',
        'Correo electronico',
        'Numero de telefono (opcional)',
        'Direccion de envio',
        'Historial de compras en nuestra tienda',
        'Datos de navegacion (cookies y tecnologias similares)',
      ],
    },
    {
      title: '3. Finalidad del Tratamiento',
      content: [
        'Utilizamos tus datos personales para los siguientes fines:',
      ],
      list: [
        'Procesar y gestionar tus pedidos y envios',
        'Comunicarnos contigo sobre el estado de tu compra',
        'Enviarte informacion sobre ofertas, promociones y nuevos productos (solo si te has suscrito voluntariamente)',
        'Mejorar tu experiencia de navegacion en nuestro sitio',
        'Cumplir con obligaciones legales y tributarias',
        'Gestionar devoluciones, garantias y reclamos',
      ],
    },
    {
      title: '4. Base Legal',
      content: [
        'El tratamiento de tus datos se basa en: (a) la ejecucion de un contrato de compraventa cuando realizas un pedido, (b) tu consentimiento expreso para recibir comunicaciones comerciales, y (c) el cumplimiento de obligaciones legales aplicables en Chile.',
        'Puedes retirar tu consentimiento para comunicaciones comerciales en cualquier momento, sin que ello afecte la licitud del tratamiento previo.',
      ],
    },
    {
      title: '5. Comparticion de Datos',
      content: [
        'Compartimos tus datos unicamente con terceros necesarios para procesar tu pedido:',
      ],
      list: [
        'MercadoPago: para el procesamiento seguro de pagos. MercadoPago tiene su propia politica de privacidad.',
        'Empresas de courier (Chilexpress, Correos de Chile): para la entrega de tu pedido. Solo compartimos nombre, direccion y telefono.',
        'Servicios de correo electronico: para enviarte confirmaciones de pedido y comunicaciones.',
      ],
      afterList: [
        'No vendemos, alquilamos ni compartimos tus datos personales con terceros para fines de marketing. No transferimos tus datos fuera de Chile, salvo lo necesario para los servicios mencionados.',
      ],
    },
    {
      title: '6. Cookies y Tecnologias de Seguimiento',
      content: [
        'Nuestro sitio utiliza cookies para mejorar tu experiencia de navegacion. Las cookies son pequenos archivos de texto que se almacenan en tu dispositivo.',
        'Utilizamos cookies para: recordar los productos en tu carrito, analizar el trafico del sitio y mejorar nuestros servicios. Puedes configurar tu navegador para rechazar cookies, aunque esto puede afectar la funcionalidad del sitio.',
      ],
    },
    {
      title: '7. Seguridad de los Datos',
      content: [
        'Implementamos medidas de seguridad tecnicas y organizativas para proteger tus datos personales contra acceso no autorizado, alteracion, divulgacion o destruccion.',
        'Nuestro sitio utiliza certificado SSL para encriptar la comunicacion. Los pagos se procesan a traves de MercadoPago, que cumple con los estandares de seguridad PCI DSS. No almacenamos datos de tarjetas de credito o debito en nuestros servidores.',
      ],
    },
    {
      title: '8. Tus Derechos',
      content: [
        'De acuerdo con la legislacion chilena, tienes los siguientes derechos sobre tus datos personales:',
      ],
      list: [
        'Derecho de acceso: solicitar informacion sobre los datos personales que tenemos sobre ti.',
        'Derecho de rectificacion: solicitar la correccion de datos inexactos o incompletos.',
        'Derecho de cancelacion: solicitar la eliminacion de tus datos personales cuando ya no sean necesarios.',
        'Derecho de oposicion: oponerte al tratamiento de tus datos para fines de marketing.',
      ],
      afterList: [
        'Para ejercer cualquiera de estos derechos, contactanos a traves de nuestra pagina de contacto. Responderemos a tu solicitud en un plazo maximo de 10 dias habiles.',
      ],
    },
    {
      title: '9. Retencion de Datos',
      content: [
        'Conservamos tus datos personales durante el tiempo necesario para cumplir con los fines descritos en esta politica, incluyendo obligaciones legales y tributarias.',
        'Los datos de compras se conservan por un minimo de 6 anos para cumplir con obligaciones tributarias. Los datos de marketing se conservan hasta que retires tu consentimiento.',
      ],
    },
    {
      title: '10. Menores de Edad',
      content: [
        'Nuestro sitio no esta dirigido a menores de 18 anos. No recopilamos intencionalmente datos personales de menores. Si eres menor de edad, necesitas el consentimiento de un padre o tutor para realizar compras.',
      ],
    },
    {
      title: '11. Modificaciones',
      content: [
        'AMBER se reserva el derecho de actualizar esta politica de privacidad en cualquier momento. Los cambios se publicaran en esta pagina con la fecha de actualizacion. Te recomendamos revisarla periodicamente.',
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
            Tu Privacidad Importa
          </p>
          <h1
            className="text-4xl lg:text-6xl font-light text-white tracking-wider mb-6"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            Politica de Privacidad
          </h1>
          <p className="text-base lg:text-lg text-pearl-300 max-w-2xl mx-auto font-light">
            Ultima actualizacion: Febrero 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 lg:px-8 py-16 lg:py-24">
        <div className="max-w-3xl mx-auto">

          {/* Intro */}
          <div className="bg-amber-gold-50 rounded-lg p-6 lg:p-8 mb-12">
            <p className="text-platinum-700 leading-relaxed">
              En AMBER Joyas nos tomamos en serio la proteccion de tus datos personales.
              Esta politica de privacidad explica que datos recopilamos, como los usamos
              y cuales son tus derechos. Al usar nuestro sitio web, aceptas las practicas
              descritas en esta politica.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-12">
            {sections.map((section, i) => (
              <div key={i}>
                <h2
                  className="text-2xl lg:text-3xl font-light text-obsidian-900 mb-4"
                  style={{ fontFamily: 'var(--font-cormorant)' }}
                >
                  {section.title}
                </h2>
                <div className="space-y-4">
                  {section.content.map((paragraph, j) => (
                    <p key={j} className="text-platinum-700 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                  {section.list && (
                    <ul className="space-y-2 ml-4">
                      {section.list.map((item, k) => (
                        <li key={k} className="flex items-start gap-3 text-platinum-700">
                          <span className="text-amber-gold-500 mt-1">&#8226;</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {section.afterList && section.afterList.map((paragraph, j) => (
                    <p key={`after-${j}`} className="text-platinum-700 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Related links */}
          <div className="mt-16 pt-12 border-t border-pearl-200">
            <h3
              className="text-2xl font-light text-obsidian-900 mb-6"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Paginas Relacionadas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Terminos y Condiciones', href: '/terminos-condiciones' },
                { label: 'Politicas de Devolucion', href: '/politicas-devolucion' },
                { label: 'Contacto', href: '/contacto' },
              ].map((link, i) => (
                <Link
                  key={i}
                  href={link.href}
                  className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow border border-pearl-100"
                >
                  <p className="font-medium text-obsidian-900 hover:text-amber-gold-600 transition-colors">
                    {link.label}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
