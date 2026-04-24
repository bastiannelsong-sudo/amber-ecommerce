import type { Metadata } from 'next';
import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CatalogClient from '../components/CatalogClient';
import { fetchCatalog, type CatalogFilters } from '../lib/catalog-api';
import { SITE_URL } from '../lib/seo-copy';
import { dummyProducts } from '../lib/data/dummy-products';
import type { Product, Collection } from '../lib/types';

const API_URL = process.env.INTERNAL_API_URL || 'http://localhost:3000';
const CATALOG_URL = `${SITE_URL}/catalogo`;

type SortMap = Record<string, CatalogFilters['sort']>;
const URL_SORT_TO_BACKEND: SortMap = {
  'price-asc': 'price_asc',
  'price-desc': 'price_desc',
  'name-asc': 'name_asc',
  newest: 'newest',
};

/**
 * Mapea los query params que usa CatalogClient (mat, col, pmin, pmax, sort)
 * a filtros del endpoint /products/catalog. Multi-valor (ej: mat=X,Y) envía
 * el primer valor al server; el cliente refina el resto localmente.
 */
function paramsToBackendFilters(sp: Record<string, string | string[] | undefined>): CatalogFilters {
  const first = (v: string | string[] | undefined): string | undefined => {
    if (!v) return undefined;
    const raw = Array.isArray(v) ? v[0] : v;
    return raw?.split(',').filter(Boolean)[0];
  };

  // Parsea una o varias tags: acepta ?tag=X, ?tag=X,Y o ?tags=X,Y.
  const parseTags = (): string[] | undefined => {
    const raw = sp.tag ?? sp.tags;
    if (!raw) return undefined;
    const arr = Array.isArray(raw) ? raw : [raw];
    const out = arr.flatMap((v) => v.split(',')).map((s) => s.trim()).filter(Boolean);
    return out.length ? out : undefined;
  };

  const filters: CatalogFilters = { limit: 500, sort: 'featured' };
  const material = first(sp.mat);
  if (material) filters.material = material;
  const collection = first(sp.col);
  if (collection) filters.collection = collection;
  const tags = parseTags();
  if (tags) filters.tags = tags;
  const pmin = Number(first(sp.pmin));
  if (isFinite(pmin) && pmin > 0) filters.min_price = pmin;
  const pmax = Number(first(sp.pmax));
  if (isFinite(pmax) && pmax > 0) filters.max_price = pmax;
  const sortKey = first(sp.sort);
  if (sortKey && URL_SORT_TO_BACKEND[sortKey]) filters.sort = URL_SORT_TO_BACKEND[sortKey];
  return filters;
}

export const metadata: Metadata = {
  title: 'Catálogo Completo | AMBER Joyas',
  description:
    'Explora toda nuestra colección de joyería en plata 925, amuletos, pulseras, collares y aros. Envío a todo Chile con cambios y devoluciones sin costo.',
  alternates: { canonical: CATALOG_URL },
  openGraph: {
    title: 'Catálogo Completo | AMBER',
    description:
      'Joyería artesanal en plata 925 y amuletos de protección. Piezas con significado real.',
    url: CATALOG_URL,
    siteName: 'AMBER Joyería',
    type: 'website',
    locale: 'es_CL',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Catálogo Completo | AMBER',
    description:
      'Joyería artesanal en plata 925 y amuletos de protección. Piezas con significado real.',
  },
};

async function getProducts(filters: CatalogFilters): Promise<Product[]> {
  try {
    const { data } = await fetchCatalog(filters);
    if (data.length === 0) return dummyProducts;
    return data;
  } catch {
    return dummyProducts;
  }
}

async function getCollections(): Promise<Collection[]> {
  try {
    const res = await fetch(`${API_URL}/collections/tree`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

interface CatalogoPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CatalogoPage({ searchParams }: CatalogoPageProps) {
  const sp = await searchParams;
  const filters = paramsToBackendFilters(sp);
  const [products, collections] = await Promise.all([
    getProducts(filters),
    getCollections(),
  ]);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Catálogo', item: CATALOG_URL },
    ],
  };

  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Catálogo Completo',
    description: 'Toda la joyería AMBER: plata 925, amuletos y diseños con significado.',
    url: CATALOG_URL,
    numberOfItems: products.length,
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

      {/* Hero Banner */}
      <section className="relative h-[30vh] sm:h-[40vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian-950/60 via-obsidian-900/30 to-obsidian-950/50 z-10" />
        <Image
          src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920&h=800&fit=crop"
          alt="Catálogo Completo"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="text-center text-white space-y-3 sm:space-y-6 px-4 animate-fade-in">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-amber-gold-400 font-medium">
              Toda la Colección
            </p>
            <h1
              className="text-3xl sm:text-5xl lg:text-7xl font-light tracking-wider"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Catálogo Completo
            </h1>
            <p className="text-sm sm:text-base lg:text-lg tracking-wide font-light max-w-2xl mx-auto text-pearl-200">
              Explora nuestra colección completa de joyería artesanal
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 lg:px-8 py-6 sm:py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 sm:mb-8">
          <ol className="flex items-center gap-2 text-sm text-platinum-600">
            <li>
              <Link href="/" className="hover:text-amber-gold-500 transition-colors">
                Inicio
              </Link>
            </li>
            <li aria-hidden>
              <span>/</span>
            </li>
            <li className="text-obsidian-900" aria-current="page">
              Catálogo
            </li>
          </ol>
        </nav>

        <Suspense fallback={<CatalogSkeleton />}>
          <CatalogClient products={products} collections={collections} />
        </Suspense>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-pearl-200 rounded-lg h-16 mb-8" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[3/4] bg-pearl-200 rounded mb-4" />
            <div className="h-3 w-20 bg-pearl-200 rounded mx-auto mb-2" />
            <div className="h-4 w-3/4 bg-pearl-200 rounded mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
