import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '../components/Footer';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { fetchCatalog } from '../lib/catalog-api';
import { SITE_URL, TAG_COPY, getSupportedTagSlugs } from '../lib/seo-copy';

export const revalidate = 300;

const AMULETOS_URL = `${SITE_URL}/amuletos`;

// Solo símbolos de protección/espirituales — coherencia temática del hub.
// Excluidos a propósito:
//   - 'proteccion': redundante con el H1 de la página
//   - 'swarovski': es material, pertenece a /<tipo>/cristales
//   - 'regalo': intención de compra distinta, merece ruta /regalos propia
//   - 'corazon' | 'infinito' | 'mariposa': símbolos decorativos, no amuletos
const FEATURED_TAG_ORDER = [
  'san-benito',
  'hilo-rojo',
  'nudo-de-brujas',
  'mano-de-fatima',
  'ojo-turco',
  'arbol-de-la-vida',
  'cruz',
];

export const metadata: Metadata = {
  title: 'Amuletos de Protección en Plata 925 | AMBER',
  description:
    'Amuletos de protección: San Benito, Hilo Rojo, Nudo de Brujas, Mano de Fátima, Ojo Turco y más. Joyería con significado en plata 925.',
  alternates: { canonical: AMULETOS_URL },
  openGraph: {
    title: 'Amuletos de Protección en Plata 925 | AMBER',
    description:
      'San Benito, Hilo Rojo, Nudo de Brujas y más. Símbolos de protección en joyería de plata fina.',
    url: AMULETOS_URL,
    siteName: 'AMBER Joyería',
    type: 'website',
    locale: 'es_CL',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Amuletos de Protección | AMBER',
    description:
      'San Benito, Hilo Rojo, Nudo de Brujas y más. Símbolos de protección en plata 925.',
  },
};

export default async function AmuletosIndexPage() {
  // Productos destacados: traemos con tag "proteccion" como representación general.
  const { data: featuredProducts } = await fetchCatalog({
    tags: ['proteccion'],
    limit: 12,
    sort: 'featured',
  });

  // Construir lista ordenada de tags disponibles con copy.
  const supported = new Set(getSupportedTagSlugs());
  const orderedTags = FEATURED_TAG_ORDER.filter((t) => supported.has(t));

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Amuletos', item: AMULETOS_URL },
    ],
  };

  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Amuletos de Protección',
    description:
      'Hub de amuletos de protección: San Benito, Hilo Rojo, Nudo de Brujas, Mano de Fátima y más.',
    url: AMULETOS_URL,
  };

  return (
    <div className="min-h-screen bg-pearl-50">
      <Header />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd) }}
      />

      <nav
        className="mx-auto max-w-7xl px-4 py-6 text-sm text-obsidian-500 sm:px-6 lg:px-8"
        aria-label="Breadcrumb"
      >
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/" className="hover:text-amber-gold-600 transition-colors">
              Inicio
            </Link>
          </li>
          <li aria-hidden className="text-obsidian-300">
            /
          </li>
          <li className="font-medium text-obsidian-800" aria-current="page">
            Amuletos
          </li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-amber-gold-600">
            AMBER Joyería
          </p>
          <h1
            className="mt-3 text-4xl font-light tracking-wide text-obsidian-950 sm:text-5xl lg:text-6xl"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            Amuletos de Protección
          </h1>
          <p className="mt-5 text-base leading-relaxed text-obsidian-600 sm:text-lg">
            Protección en forma de joya: los símbolos que cuidan desde siempre,
            ahora en plata fina 925. Elegí el amuleto que resuena con tu intención.
          </p>
        </div>
      </section>

      {/* Hub de tags — píldoras consistentes con el resto del sitio */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <h2
          className="mb-6 text-2xl font-light text-obsidian-900 sm:text-3xl"
          style={{ fontFamily: 'var(--font-cormorant)' }}
        >
          Explorá por símbolo
        </h2>
        <nav aria-label="Explorar amuletos por símbolo" className="flex flex-wrap gap-2">
          {orderedTags.map((tag) => {
            const copy = TAG_COPY[tag];
            return (
              <Link
                key={tag}
                href={`/amuletos/${tag}`}
                className="rounded-full border border-pearl-300 bg-white px-4 py-2 text-xs font-medium uppercase tracking-wider text-obsidian-700 transition-colors hover:border-amber-gold-400 hover:bg-amber-gold-50 hover:text-amber-gold-700"
              >
                {copy.h1}
              </Link>
            );
          })}
        </nav>
      </section>

      {/* Productos destacados */}
      {featuredProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <h2
            className="mb-6 text-2xl font-light text-obsidian-900 sm:text-3xl"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            Destacados
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
