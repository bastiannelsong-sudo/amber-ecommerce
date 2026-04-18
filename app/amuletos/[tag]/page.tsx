import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import { fetchCatalog } from '../../lib/catalog-api';
import { SITE_URL, getSupportedTagSlugs, getTagCopy } from '../../lib/seo-copy';

export const dynamicParams = false;
export const revalidate = 300;

interface PageProps {
  params: Promise<{ tag: string }>;
}

export async function generateStaticParams() {
  return getSupportedTagSlugs().map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag } = await params;
  const copy = getTagCopy(tag);
  if (!copy) return {};
  const url = `${SITE_URL}/amuletos/${tag}`;
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

export default async function AmuletoTagPage({ params }: PageProps) {
  const { tag } = await params;
  const copy = getTagCopy(tag);
  if (!copy) notFound();

  const { data: products, total } = await fetchCatalog({
    tags: [tag],
    limit: 48,
    sort: 'featured',
  });

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Amuletos', item: `${SITE_URL}/amuletos` },
      {
        '@type': 'ListItem',
        position: 3,
        name: copy.h1,
        item: `${SITE_URL}/amuletos/${tag}`,
      },
    ],
  };

  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Amuletos ${copy.h1}`,
    description: copy.description,
    url: `${SITE_URL}/amuletos/${tag}`,
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
          <li>
            <span className="text-obsidian-500">Amuletos</span>
          </li>
          <li aria-hidden className="text-obsidian-300">
            /
          </li>
          <li className="font-medium text-obsidian-800" aria-current="page">
            {copy.h1}
          </li>
        </ol>
      </nav>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-amber-gold-600">
            Amuletos
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
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        {products.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-obsidian-600">
              Estamos reponiendo este amuleto.
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
