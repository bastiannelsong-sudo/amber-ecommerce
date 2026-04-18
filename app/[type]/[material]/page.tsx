import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import { fetchCatalog } from '../../lib/catalog-api';
import {
  MATERIAL_LABELS,
  SITE_URL,
  TYPE_MATERIAL_COMBOS,
  getProductTypeCopy,
  isMaterialSlug,
  isProductTypeSlug,
  slugToMaterial,
  slugToProductType,
  type MaterialSlug,
  type ProductTypeSlug,
} from '../../lib/seo-copy';

export const dynamicParams = false;
export const revalidate = 300;

interface PageProps {
  params: Promise<{ type: string; material: string }>;
}

export async function generateStaticParams() {
  return TYPE_MATERIAL_COMBOS.map((c) => ({ type: c.type, material: c.material }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type, material } = await params;
  if (!isProductTypeSlug(type) || !isMaterialSlug(material)) return {};

  const typeCopy = getProductTypeCopy(type);
  const materialLabel = MATERIAL_LABELS[material];
  const title = `${typeCopy.h1} de ${materialLabel} | AMBER`;
  const description = `${typeCopy.h1} en ${materialLabel.toLowerCase()}. ${typeCopy.description}`;
  const url = `${SITE_URL}/${type}/${material}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'AMBER Joyería',
      type: 'website',
      locale: 'es_CL',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function TypeMaterialPage({ params }: PageProps) {
  const { type, material } = await params;
  if (!isProductTypeSlug(type) || !isMaterialSlug(material)) notFound();

  const typeSlug = type as ProductTypeSlug;
  const materialSlug = material as MaterialSlug;
  const typeCopy = getProductTypeCopy(typeSlug);
  const materialLabel = MATERIAL_LABELS[materialSlug];
  const backendType = slugToProductType(typeSlug);
  const backendMaterial = slugToMaterial(materialSlug);
  if (!backendType || !backendMaterial) notFound();

  const { data: products, total } = await fetchCatalog({
    product_type: backendType,
    material: backendMaterial,
    limit: 48,
    sort: 'featured',
  });

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: typeCopy.h1, item: `${SITE_URL}/${typeSlug}` },
      {
        '@type': 'ListItem',
        position: 3,
        name: materialLabel,
        item: `${SITE_URL}/${typeSlug}/${materialSlug}`,
      },
    ],
  };

  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${typeCopy.h1} de ${materialLabel}`,
    url: `${SITE_URL}/${typeSlug}/${materialSlug}`,
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
            <Link href={`/${typeSlug}`} className="hover:text-amber-gold-600 transition-colors">
              {typeCopy.h1}
            </Link>
          </li>
          <li aria-hidden className="text-obsidian-300">
            /
          </li>
          <li className="font-medium text-obsidian-800" aria-current="page">
            {materialLabel}
          </li>
        </ol>
      </nav>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-amber-gold-600">
            {typeCopy.h1}
          </p>
          <h1
            className="mt-3 text-4xl font-light tracking-wide text-obsidian-950 sm:text-5xl lg:text-6xl"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            {typeCopy.h1} de {materialLabel}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-obsidian-600 sm:text-lg">
            {typeCopy.lead}
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
              No tenemos {typeCopy.h1.toLowerCase()} de {materialLabel.toLowerCase()} disponibles ahora mismo.
            </p>
            <Link
              href={`/${typeSlug}`}
              className="mt-4 inline-block text-sm font-medium text-amber-gold-600 hover:text-amber-gold-700"
            >
              Ver todas las {typeCopy.h1.toLowerCase()} →
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
