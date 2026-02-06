'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: 'anillos' | 'collares' | 'pulseras' | 'aretes';
}

export default function SizeGuideModal({ isOpen, onClose, category = 'anillos' }: SizeGuideModalProps) {
  if (!isOpen) return null;

  const guides = {
    anillos: {
      title: 'Guía de Tallas - Anillos',
      description: 'Encuentra tu talla perfecta con nuestra guía completa',
      sizes: [
        { size: '5', diameter: '15.7 mm', circumference: '49.3 mm' },
        { size: '6', diameter: '16.5 mm', circumference: '51.9 mm' },
        { size: '7', diameter: '17.3 mm', circumference: '54.4 mm' },
        { size: '8', diameter: '18.2 mm', circumference: '57.0 mm' },
        { size: '9', diameter: '19.0 mm', circumference: '59.5 mm' },
        { size: '10', diameter: '19.8 mm', circumference: '62.1 mm' },
      ],
      howTo: [
        'Usa un anillo que te quede bien',
        'Mide el diámetro interior del anillo',
        'Compara con la tabla de medidas',
        'Si estás entre dos tallas, elige la más grande',
      ],
    },
    collares: {
      title: 'Guía de Longitudes - Collares',
      description: 'Elige la longitud perfecta para tu estilo',
      sizes: [
        { size: '35-40 cm', diameter: 'Choker', circumference: 'Ajustado al cuello' },
        { size: '40-45 cm', diameter: 'Princess', circumference: 'Sobre la clavícula' },
        { size: '45-50 cm', diameter: 'Matinée', circumference: 'Sobre el busto' },
        { size: '50-60 cm', diameter: 'Opera', circumference: 'Largo elegante' },
      ],
      howTo: [
        'Mide con una cinta métrica',
        'Rodea tu cuello en la posición deseada',
        'Añade 2-5cm para comodidad',
        'Considera el largo del dije si lo hay',
      ],
    },
    pulseras: {
      title: 'Guía de Tallas - Pulseras',
      description: 'Encuentra el ajuste perfecto para tu muñeca',
      sizes: [
        { size: 'XS', diameter: '15-16 cm', circumference: 'Muy ajustada' },
        { size: 'S', diameter: '16-17 cm', circumference: 'Ajustada' },
        { size: 'M', diameter: '17-18 cm', circumference: 'Cómoda' },
        { size: 'L', diameter: '18-19 cm', circumference: 'Holgada' },
      ],
      howTo: [
        'Mide tu muñeca con cinta métrica',
        'Añade 1-2cm para comodidad',
        'Para ajuste ceñido, añade 1cm',
        'Para ajuste holgado, añade 2-3cm',
      ],
    },
    aretes: {
      title: 'Guía - Aretes',
      description: 'Información sobre estilos y ajustes',
      sizes: [
        { size: 'Pequeño', diameter: '< 1 cm', circumference: 'Discreto, uso diario' },
        { size: 'Mediano', diameter: '1-2 cm', circumference: 'Versátil, elegante' },
        { size: 'Grande', diameter: '2-3 cm', circumference: 'Statement, ocasiones especiales' },
        { size: 'Extra Grande', diameter: '> 3 cm', circumference: 'Dramático, eventos' },
      ],
      howTo: [
        'Considera tu tipo de rostro',
        'Rostros redondos: aretes largos',
        'Rostros alargados: aretes anchos',
        'Verifica el tipo de cierre',
      ],
    },
  };

  const guide = guides[category];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white w-full max-w-3xl rounded-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-obsidian-900 to-obsidian-800 text-white p-8">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2
              className="text-3xl font-light mb-2"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              {guide.title}
            </h2>
            <p className="text-pearl-300">{guide.description}</p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Size Table */}
            <div className="mb-8">
              <h3 className="text-xl font-medium text-obsidian-900 mb-4">Tabla de Medidas</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-pearl-100">
                      <th className="px-4 py-3 text-left text-sm font-medium text-obsidian-900">Talla</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-obsidian-900">Medida</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-obsidian-900">Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guide.sizes.map((size, index) => (
                      <tr key={index} className="border-b border-pearl-200">
                        <td className="px-4 py-3 font-medium text-obsidian-900">{size.size}</td>
                        <td className="px-4 py-3 text-platinum-700">{size.diameter}</td>
                        <td className="px-4 py-3 text-platinum-700">{size.circumference}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* How to Measure */}
            <div className="bg-amber-gold-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-obsidian-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Cómo Medir
              </h3>
              <ul className="space-y-2">
                {guide.howTo.map((step, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-platinum-700">
                    <span className="flex-shrink-0 w-6 h-6 bg-amber-gold-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className="mt-8 text-center">
              <p className="text-sm text-platinum-600 mb-4">
                ¿Necesitas ayuda con tu talla? Nuestro equipo está aquí para asistirte
              </p>
              <a
                href="/contacto"
                className="inline-block px-8 py-3 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors"
              >
                Contactar Asesor
              </a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
