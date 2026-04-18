import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Footer from '../components/Footer';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { fetchCatalog } from '../lib/catalog-api';
import {
  MATERIAL_LABELS,
  PRODUCT_TYPE_SLUGS,
  SITE_URL,
  TYPE_MATERIAL_COMBOS,
  getProductTypeCopy,
  isProductTypeSlug,
  slugToProductType,
  type MaterialSlug,
  type ProductTypeSlug,
} from '../lib/seo-copy';

export const dynamicParams = false;
export const revalidate = 300;

interface PageProps {
  params: Promise<{ type: string }>;
}

export async function generateStaticParams() {
  return PRODUCT_TYPE_SLUGS.map((type) => ({ type }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type } = await params;
  if (!isProductTypeSlug(type)) return {};
  const copy = getProductTypeCopy(type);
  const url = `${SITE_URL}/${type}`;
  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: url },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url,
      siteName: 'AMBER Joyería',
      type: 'website',
      locale: 'es_CL',
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.title,
      description: copy.description,
    },
  };
}

export default async function ProductTypePage({ params }: PageProps) {
  const { type } = await params;
  if (!isProductTypeSlug(type)) notFound();

  const slug = type as ProductTypeSlug;
  const copy = getProductTypeCopy(slug);
  const backendType = slugToProductType(slug);
  if (!backendType) notFound();

  const { data: products, total } = await fetchCatalog({
    product_type: backendType,
    limit: 48,
    sort: 'featured',
  });

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: copy.h1, item: `${SITE_URL}/${slug}` },
    ],
  };

  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: copy.h1,
    description: copy.description,
    url: `${SITE_URL}/${slug}`,
    numberOfItems: total,
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

      {/* Breadcrumb */}
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
            {copy.h1}
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
            {copy.h1}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-obsidian-600 sm:text-lg">
            {copy.lead}
          </p>
          <p className="mt-4 text-sm text-obsidian-500">
            {total} {total === 1 ? 'pieza disponible' : 'piezas disponibles'}
          </p>
        </div>

        {/* Sub-filtros por material (cross-linking SEO) */}
        {(() => {
          const relatedMaterials = TYPE_MATERIAL_COMBOS.filter((c) => c.type === slug).map(
            (c) => c.material,
          );
          if (relatedMaterials.length === 0) return null;
          return (
            <nav aria-label="Filtrar por material" className="mt-8 flex flex-wrap gap-2">
              {relatedMaterials.map((m: MaterialSlug) => (
                <Link
                  key={m}
                  href={`/${slug}/${m}`}
                  className="rounded-full border border-pearl-300 bg-white px-4 py-2 text-xs font-medium uppercase tracking-wider text-obsidian-700 transition-colors hover:border-amber-gold-400 hover:bg-amber-gold-50 hover:text-amber-gold-700"
                >
                  {MATERIAL_LABELS[m]}
                </Link>
              ))}
            </nav>
          );
        })()}
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        {products.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-obsidian-600">
              Estamos reponiendo esta categoría.
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
            {products.map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
