'use client';

import { useState, useEffect } from 'react';

const TESTIMONIALS = [
  {
    quote:
      'Compre el collar Metatron como amuleto de proteccion y la calidad es increible. Plata 925 real, llego rapido y el packaging fue hermoso. Ya llevo 3 compras y siempre todo perfecto.',
    name: 'Catalina R.',
    detail: 'Clienta verificada · Compra en Mercado Libre',
    product: 'Collar Metatron',
    rating: 5,
  },
  {
    quote:
      'Las pulseras en plata son hermosas y super delicadas. Me encanta que cada joya tiene un significado especial. El envio fue rapido y el empaque muy cuidado, se nota la dedicacion.',
    name: 'Francisca M.',
    detail: 'Clienta verificada · Compra en Mercado Libre',
    product: 'Pulsera Nudo de Brujas',
    rating: 5,
  },
  {
    quote:
      'Regale los aros de plata 925 a mi mama y quedo encantada. La calidad se ve y se siente. Definitivamente volvere a comprar, los precios son muy justos para lo que ofrecen.',
    name: 'Valentina S.',
    detail: 'Clienta verificada · Compra directa',
    product: 'Aros Plata 925',
    rating: 5,
  },
  {
    quote:
      'Encontre AMBER buscando amuletos de proteccion y me quede. Cada pieza tiene historia y significado. La atencion por WhatsApp fue increible, me ayudaron a elegir el perfecto para mi.',
    name: 'Javiera L.',
    detail: 'Clienta verificada · Compra en Mercado Libre',
    product: 'Anillo Proteccion',
    rating: 5,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 justify-center mb-6">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < rating ? 'text-amber-gold-400' : 'text-pearl-300'}`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ))}
    </div>
  );
}

export default function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const testimonial = TESTIMONIALS[current];

  return (
    <section className="bg-pearl-100 py-20 lg:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          {/* Comillas decorativas */}
          <svg className="w-10 h-10 text-amber-gold-400 mx-auto mb-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
          </svg>

          <StarRating rating={testimonial.rating} />

          {/* Testimonio con transicion */}
          <div className="relative min-h-[160px] sm:min-h-[120px] flex items-center justify-center">
            {TESTIMONIALS.map((t, i) => (
              <blockquote
                key={i}
                className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
                  i === current
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-4 pointer-events-none'
                }`}
              >
                <p
                  className="text-xl sm:text-2xl lg:text-3xl font-light text-obsidian-900 leading-relaxed"
                  style={{ fontFamily: 'var(--font-cormorant)' }}
                >
                  &ldquo;{t.quote}&rdquo;
                </p>
              </blockquote>
            ))}
          </div>

          <div className="mt-8">
            <p className="text-sm font-medium text-obsidian-900 uppercase tracking-wider">
              {testimonial.name}
            </p>
            <p className="text-xs text-amber-gold-500 mt-1 font-medium">
              {testimonial.product}
            </p>
            <p className="text-xs text-platinum-600 mt-1">
              {testimonial.detail}
            </p>
          </div>

          {/* Indicadores de navegacion */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Ver testimonio ${i + 1}`}
                className={`transition-all duration-300 cursor-pointer ${
                  i === current
                    ? 'w-8 h-1 bg-amber-gold-500'
                    : 'w-2 h-1 bg-pearl-300 hover:bg-pearl-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
