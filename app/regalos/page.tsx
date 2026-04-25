import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '../components/Footer';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { fetchCatalog } from '../lib/catalog-api';
import { SITE_URL, TAG_COPY } from '../lib/seo-copy';

export const revalidate = 300;

const REGALOS_URL = `${SITE_URL}/regalos`;

// Tags relacionados con intención de regalo (símbolos decorativos / afectivos).
// Cross-link a las landings existentes en /amuletos/[tag].
const GIFT_TAGS = ['corazon', 'infinito', 'mariposa', 'cruz', 'arbol-de-la-vida'];

// Rangos de presupuesto: anclaje psicológico ("bajo X pesos") para
// cerrar la decisión de regalo rápido.
const BUDGET_RANGES = [
  { label: 'Bajo $15.000', max: 15000 },
  { label: 'Bajo $25.000', max: 25000 },
  { label: 'Bajo $40.000', max: 40000 },
];

export const metadata: Metadata = {
  title: 'Regalos de Joyería en Plata 925 | AMBER',
  description:
    'Ideas de regalo en joyería: pulseras, collares y dijes en plata 925. Con presentación incluida, envío a todo Chile y cambios sin costo.',
  alternates: { canonical: REGALOS_URL },
  openGraph: {
    title: 'Regalos de Joyería en Plata 925 | AMBER',
    description:
      'Joyería lista para regalar: plata fina 925, envoltorio cuidado y envío a todo Chile.',
    url: REGALOS_URL,
    siteName: 'AMBER Joyería',
    type: 'website',
    locale: 'es_CL',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Regalos AMBER | Joyería en Plata 925',
    description:
      'Joyería lista para regalar: plata fina 925, envoltorio cuidado y envío a todo Chile.',
  },
};

export default async function RegalosIndexPage() {
  // Productos con intención explícita de regalo.
  const { data: giftProducts } = await fetchCatalog({
    tags: ['regalo'],
    limit: 12,
    sort: 'featured',
  });

  // Fallback: si no hay productos tag=regalo, traer destacados generales.
  const { data: featuredFallback } =
    giftProducts.length === 0
      ? await fetchCatalog({ limit: 12, sort: 'featured' })
      : { data: [] };

  const productsToShow = giftProducts.length > 0 ? giftProducts : featuredFallback;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Regalos', item: REGALOS_URL },
    ],
  };

  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Regalos de Joyería AMBER',
    description:
      'Ideas de regalo en plata 925: pulseras, collares, dijes y amuletos con presentación incluida.',
    url: REGALOS_URL,
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
            Regalos
          </li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-amber-gold-600">
            AMBER Joyería
          </p>
          <h1
            className="mt-3 text-4xl font-light tracking-wide text-obsidian-950 sm:text-5xl lg:text-6xl"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            Regalos con Significado
          </h1>
          <p className="mt-5 text-base leading-relaxed text-obsidian-600 sm:text-lg">
            Una joya siempre es buen regalo. Más cuando viene con historia, plata fina 925 y
            presentación cuidada. Elegí por presupuesto, por símbolo o por tipo de pieza.
          </p>
        </div>

        {/* Señales de confianza — reducen fricción del regalo */}
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-obsidian-600">
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-gold-500" />
            Envoltorio incluido
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-gold-500" />
            Envío a todo Chile
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-gold-500" />
            Cambios sin costo
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-gold-500" />
            Plata 925 certificada
          </span>
        </div>
      </section>

      {/* Regalar por presupuesto (anclaje + cierre rápido de decisión) */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <h2
          className="mb-6 text-2xl font-light text-obsidian-900 sm:text-3xl"
          style={{ fontFamily: 'var(--font-cormorant)' }}
        >
          Regalar por presupuesto
        </h2>
        <nav aria-label="Regalar por presupuesto" className="flex flex-wrap gap-2">
          {BUDGET_RANGES.map((r) => (
            <Link
              key={r.max}
              href={`/catalogo?tag=regalo&pmax=${r.max}&sort=featured`}
              className="rounded-full border border-pearl-300 bg-white px-4 py-2 text-xs font-medium uppercase tracking-wider text-obsidian-700 transition-colors hover:border-amber-gold-400 hover:bg-amber-gold-50 hover:text-amber-gold-700"
            >
              {r.label}
            </Link>
          ))}
        </nav>
      </section>

      {/* Regalar por símbolo — cross-link a tags existentes */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <h2
          className="mb-6 text-2xl font-light text-obsidian-900 sm:text-3xl"
          style={{ fontFamily: 'var(--font-cormorant)' }}
        >
          Regalar por símbolo
        </h2>
        <nav aria-label="Regalar por símbolo" className="flex flex-wrap gap-2">
          {GIFT_TAGS.map((tag) => {
            const copy = TAG_COPY[tag];
            if (!copy) return null;
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

      {/* Regalar por tipo de pieza */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <h2
          className="mb-6 text-2xl font-light text-obsidian-900 sm:text-3xl"
          style={{ fontFamily: 'var(--font-cormorant)' }}
        >
          Regalar por tipo de pieza
        </h2>
        <nav aria-label="Regalar por tipo de pieza" className="flex flex-wrap gap-2">
          {[
            { slug: 'pulseras', label: 'Pulseras' },
            { slug: 'collares', label: 'Collares' },
            { slug: 'aros', label: 'Aros' },
            { slug: 'anillos', label: 'Anillos' },
            { slug: 'dijes', label: 'Dijes' },
          ].map((t) => (
            <Link
              key={t.slug}
              href={`/${t.slug}`}
              className="rounded-full border border-pearl-300 bg-white px-4 py-2 text-xs font-medium uppercase tracking-wider text-obsidian-700 transition-colors hover:border-amber-gold-400 hover:bg-amber-gold-50 hover:text-amber-gold-700"
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </section>

      {/* Productos curados para regalar */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <h2
          className="mb-6 text-2xl font-light text-obsidian-900 sm:text-3xl"
          style={{ fontFamily: 'var(--font-cormorant)' }}
        >
          {giftProducts.length > 0 ? 'Seleccionados para regalar' : 'Destacados'}
        </h2>
        {productsToShow.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-obsidian-600">
              Estamos preparando la selección de regalos.
            </p>
            <Link
              href="/catalogo"
              className="mt-4 inline-block text-sm font-medium text-amber-gold-600 hover:text-amber-gold-700"
            >
              Ver catálogo completo →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {productsToShow.map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
