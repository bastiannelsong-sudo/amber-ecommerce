import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: 'Terminos y Condiciones',
  description: 'Lee los terminos y condiciones de uso de la tienda online AMBER Joyas. Informacion sobre compras, envios, garantia y responsabilidades.',
  openGraph: {
    title: 'Terminos y Condiciones | AMBER Joyas',
    description: 'Terminos y condiciones de uso de la tienda online AMBER Joyas.',
    url: '/terminos-condiciones',
  },
  twitter: {
    title: 'Terminos y Condiciones | AMBER Joyas',
    description: 'Terminos y condiciones de uso de la tienda online AMBER Joyas.',
  },
  alternates: {
    canonical: '/terminos-condiciones',
  },
};

export default function TerminosCondicionesPage() {
  const sections = [
    {
      title: '1. Informacion General',
      content: [
        'AMBER Joyas es una tienda online dedicada a la comercializacion de joyas en plata 925, bisuteria, amuletos de proteccion y accesorios relacionados, con presencia en Mercado Libre, Falabella, Paris y este sitio web.',
        'Al realizar una compra en amberjoyeria.cl, aceptas los presentes terminos y condiciones en su totalidad. Si no estas de acuerdo con alguno de estos terminos, te pedimos que no utilices nuestro sitio.',
      ],
    },
    {
      title: '2. Productos y Precios',
      content: [
        'Los productos que ofrecemos incluyen joyas de plata 925, piezas con bano de oro, acero quirurgico y bisuteria. Cada producto cuenta con su descripcion, material y precio detallado en su ficha.',
        'Los precios estan expresados en pesos chilenos (CLP) e incluyen IVA. Nos reservamos el derecho de modificar los precios sin previo aviso, aunque los pedidos ya confirmados mantendran el precio al momento de la compra.',
        'Las imagenes de los productos son referenciales. Pueden existir variaciones minimas de color o tonalidad debido a las caracteristicas de cada pantalla.',
      ],
    },
    {
      title: '3. Proceso de Compra',
      content: [
        'Para realizar una compra debes: (1) seleccionar los productos deseados, (2) completar tus datos de envio, (3) seleccionar el metodo de pago y (4) confirmar tu pedido.',
        'Una vez confirmado el pago, recibiras un correo electronico con la confirmacion de tu pedido y el detalle de tu compra.',
        'AMBER se reserva el derecho de cancelar pedidos en caso de detectar irregularidades, errores en precios publicados o problemas con la verificacion del pago.',
      ],
    },
    {
      title: '4. Medios de Pago',
      content: [
        'Aceptamos los siguientes metodos de pago a traves de MercadoPago: tarjetas de credito (Visa, Mastercard, American Express), tarjetas de debito y transferencia bancaria.',
        'Todos los pagos son procesados de forma segura a traves de MercadoPago, que cuenta con encriptacion SSL y proteccion al comprador. AMBER no almacena datos de tarjetas ni informacion financiera.',
      ],
    },
    {
      title: '5. Envios y Despacho',
      content: [
        'Realizamos envios a todo Chile continental a traves de Chilexpress y Correos de Chile. Los envios son gratuitos en compras superiores a $30.000.',
        'Los plazos de entrega son estimados y pueden variar segun la ubicacion y disponibilidad del servicio de courier. AMBER no se hace responsable por retrasos atribuibles al servicio de transporte.',
        'Para mas detalles, consulta nuestra pagina de Envios.',
      ],
    },
    {
      title: '6. Garantia',
      content: [
        'Todos los productos vendidos por AMBER cuentan con una garantia de 12 meses contra defectos de fabricacion, sujeta a las condiciones detalladas en nuestra pagina de Garantia.',
        'La garantia no cubre desgaste natural, danos por mal uso, contacto con quimicos o modificaciones realizadas por terceros.',
      ],
    },
    {
      title: '7. Devoluciones y Cambios',
      content: [
        'De acuerdo con la Ley del Consumidor (Ley 19.496), tienes derecho a retractarte de tu compra dentro de los 10 dias corridos siguientes a la recepcion del producto.',
        'Las condiciones completas de devolucion y cambio estan detalladas en nuestra pagina de Politicas de Devolucion.',
      ],
    },
    {
      title: '8. Propiedad Intelectual',
      content: [
        'Todo el contenido de este sitio web — incluyendo textos, imagenes, logotipos, disenos y fotografia — es propiedad de AMBER Joyas o se utiliza bajo licencia. Queda prohibida su reproduccion, distribucion o uso sin autorizacion previa y por escrito.',
      ],
    },
    {
      title: '9. Limitacion de Responsabilidad',
      content: [
        'AMBER no sera responsable por danos indirectos, incidentales o consecuentes derivados del uso de este sitio web o de los productos adquiridos, mas alla de lo establecido por la ley chilena.',
        'Nos esforzamos por mantener la informacion del sitio actualizada y precisa, pero no garantizamos la ausencia total de errores.',
      ],
    },
    {
      title: '10. Modificaciones',
      content: [
        'AMBER se reserva el derecho de modificar estos terminos y condiciones en cualquier momento. Los cambios entraran en vigencia desde su publicacion en este sitio. Es responsabilidad del usuario revisar periodicamente estos terminos.',
      ],
    },
    {
      title: '11. Legislacion Aplicable',
      content: [
        'Estos terminos y condiciones se rigen por las leyes de la Republica de Chile. Cualquier controversia sera sometida a la jurisdiccion de los tribunales ordinarios de justicia de Santiago de Chile.',
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
            Legal
          </p>
          <h1
            className="text-4xl lg:text-6xl font-light text-white tracking-wider mb-6"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            Terminos y Condiciones
          </h1>
          <p className="text-base lg:text-lg text-pearl-300 max-w-2xl mx-auto font-light">
            Ultima actualizacion: Febrero 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 lg:px-8 py-16 lg:py-24">
        <div className="max-w-3xl mx-auto">
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
                { label: 'Garantia', href: '/garantia' },
                { label: 'Politicas de Devolucion', href: '/politicas-devolucion' },
                { label: 'Privacidad', href: '/privacidad' },
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
