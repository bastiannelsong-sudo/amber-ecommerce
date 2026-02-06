'use client';

import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function LookbookPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const lookbooks = [
    {
      id: 1,
      title: 'Elegancia Nocturna',
      category: 'eventos',
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=1200&fit=crop',
      description: 'Piezas statement para ocasiones especiales',
      products: ['Collar Solitario', 'Aretes Gota Zafiro', 'Pulsera Tenis'],
    },
    {
      id: 2,
      title: 'Minimalismo Chic',
      category: 'diario',
      image: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=800&h=1200&fit=crop',
      description: 'Elegancia discreta para el día a día',
      products: ['Aretes Perla', 'Collar Cadena Oro', 'Anillo Minimalista'],
    },
    {
      id: 3,
      title: 'Novia Radiante',
      category: 'novias',
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&h=1200&fit=crop',
      description: 'El brillo perfecto para tu día especial',
      products: ['Anillo Compromiso', 'Collar Diamante', 'Aretes Perla'],
    },
    {
      id: 4,
      title: 'Poder Ejecutivo',
      category: 'profesional',
      image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&h=1200&fit=crop',
      description: 'Sofisticación que inspira confianza',
      products: ['Reloj de Lujo', 'Gemelos', 'Pulsera Eslabones'],
    },
    {
      id: 5,
      title: 'Bohemia Moderna',
      category: 'casual',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=1200&fit=crop',
      description: 'Estilo relajado con un toque especial',
      products: ['Collar Largo', 'Anillos Apilables', 'Pulseras Múltiples'],
    },
    {
      id: 6,
      title: 'Glamour de Alfombra Roja',
      category: 'eventos',
      image: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&h=1200&fit=crop',
      description: 'Deslumbra en cada ocasión',
      products: ['Collar Esmeralda', 'Aretes Candelabro', 'Anillo Cocktail'],
    },
  ];

  const categories = [
    { id: 'all', name: 'Todo', count: lookbooks.length },
    { id: 'eventos', name: 'Eventos', count: lookbooks.filter(l => l.category === 'eventos').length },
    { id: 'novias', name: 'Novias', count: lookbooks.filter(l => l.category === 'novias').length },
    { id: 'diario', name: 'Diario', count: lookbooks.filter(l => l.category === 'diario').length },
    { id: 'profesional', name: 'Profesional', count: lookbooks.filter(l => l.category === 'profesional').length },
    { id: 'casual', name: 'Casual', count: lookbooks.filter(l => l.category === 'casual').length },
  ];

  const filteredLookbooks = selectedCategory === 'all'
    ? lookbooks
    : lookbooks.filter(l => l.category === selectedCategory);

  return (
    <div className="min-h-screen bg-pearl-50">
      <Header />

      {/* Hero */}
      <section className="relative h-[70vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian-900/70 via-obsidian-900/50 to-pearl-50 z-10" />
        <img
          src="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=1920&h=1080&fit=crop"
          alt="Lookbook"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 z-20 flex items-center justify-center px-4">
          <div className="text-center text-white max-w-4xl">
            <h1
              className="text-6xl lg:text-8xl font-light tracking-wider mb-6"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Lookbook
            </h1>
            <p className="text-xl lg:text-2xl font-light max-w-2xl mx-auto">
              Descubre cómo combinar nuestras piezas para crear looks inolvidables
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-pearl-200 py-6">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex overflow-x-auto gap-4 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 px-6 py-3 rounded-full text-sm uppercase tracking-wider font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-obsidian-900 text-white'
                    : 'bg-pearl-100 text-platinum-700 hover:bg-pearl-200'
                }`}
              >
                {category.name}
                <span className="ml-2 opacity-60">({category.count})</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Lookbooks Grid */}
      <section className="container mx-auto px-4 lg:px-8 py-16">
        {/* Masonry-style grid */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
          {filteredLookbooks.map((lookbook, index) => (
            <div
              key={lookbook.id}
              className="break-inside-avoid animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="group relative overflow-hidden rounded-lg shadow-luxury hover-lift bg-white">
                {/* Image */}
                <div className="relative overflow-hidden">
                  <img
                    src={lookbook.image}
                    alt={lookbook.title}
                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-obsidian-900/80 via-obsidian-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Quick actions on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <a
                      href={`/catalogo?lookbook=${lookbook.id}`}
                      className="px-8 py-3 bg-white text-obsidian-900 text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 hover:text-white transition-colors shadow-lg"
                    >
                      Ver Productos
                    </a>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <span className="inline-block px-3 py-1 bg-amber-gold-50 text-amber-gold-700 text-xs uppercase tracking-wider font-medium rounded-full mb-3">
                    {categories.find(c => c.id === lookbook.category)?.name}
                  </span>

                  <h3
                    className="text-2xl font-light text-obsidian-900 mb-2"
                    style={{ fontFamily: 'var(--font-cormorant)' }}
                  >
                    {lookbook.title}
                  </h3>

                  <p className="text-platinum-600 text-sm mb-4">
                    {lookbook.description}
                  </p>

                  {/* Products list */}
                  <div className="border-t border-pearl-200 pt-4">
                    <p className="text-xs uppercase tracking-wider text-platinum-500 mb-2">
                      Piezas destacadas:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {lookbook.products.map((product, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-pearl-100 text-obsidian-700 px-2 py-1 rounded"
                        >
                          {product}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center bg-gradient-to-br from-amber-gold-50 to-amber-gold-100 rounded-lg p-12">
          <h2
            className="text-4xl lg:text-5xl font-light text-obsidian-900 mb-4"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            ¿Necesitas Asesoría Personalizada?
          </h2>
          <p className="text-lg text-platinum-700 mb-8 max-w-2xl mx-auto">
            Nuestros expertos en estilo pueden ayudarte a crear el look perfecto para cualquier ocasión
          </p>
          <a
            href="/contacto"
            className="inline-block px-12 py-4 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors shadow-luxury"
          >
            Agendar Consulta
          </a>
        </div>
      </section>

      {/* Instagram-style section */}
      <section className="bg-white py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2
              className="text-4xl lg:text-5xl font-light text-obsidian-900 mb-4"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Síguenos en Instagram
            </h2>
            <p className="text-platinum-600">@amber.joyeria</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <a
                key={i}
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square overflow-hidden rounded-lg"
              >
                <img
                  src={`https://images.unsplash.com/photo-${[
                    '1515562141207-7a88fb7ce338',
                    '1605100804763-247f67b3557e',
                    '1535632787350-4e68ef0ac584',
                    '1611591437281-460bfbe1220a',
                    '1599643478518-a784e5dc4c8f',
                    '1602173574767-37ac01994b2a',
                  ][i % 6]}?w=300&h=300&fit=crop`}
                  alt={`Instagram ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-obsidian-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
