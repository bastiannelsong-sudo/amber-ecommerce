import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchResultsClient from '../components/SearchResultsClient';
import type { Product, SearchResponse } from '../lib/types';

const API_URL = process.env.INTERNAL_API_URL || 'http://localhost:3000';

type Props = {
  searchParams: Promise<{ q?: string; page?: string; sort?: string; material?: string; style?: string; collection?: string }>;
};

async function searchProducts(
  q: string,
  params: { page?: number; limit?: number; sort?: string; material?: string; style?: string; collection?: string },
): Promise<SearchResponse> {
  try {
    const urlParams = new URLSearchParams();
    urlParams.set('q', q);
    if (params.page) urlParams.set('page', String(params.page));
    if (params.limit) urlParams.set('limit', String(params.limit));
    if (params.sort) urlParams.set('sort', params.sort);
    if (params.material) urlParams.set('material', params.material);
    if (params.style) urlParams.set('style', params.style);
    if (params.collection) urlParams.set('collection', params.collection);

    const res = await fetch(`${API_URL}/products/ecommerce/search?${urlParams.toString()}`, {
      next: { revalidate: 30 },
    });

    if (!res.ok) throw new Error('Search API error');
    const json = await res.json();

    // Map backend product shape
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    json.data = (json.data || []).map((raw: any) => ({
      ...raw,
      category: raw.category
        ? {
            category_id: raw.category.category_id ?? raw.category.platform_id,
            name: raw.category.name ?? raw.category.platform_name,
            description: raw.category.description,
          }
        : undefined,
    }));

    return json as SearchResponse;
  } catch {
    return { data: [], total: 0, page: 1, limit: 24, query: q };
  }
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;

  if (!q || q.trim().length < 2) {
    return {
      title: 'Buscar | AMBER Joyeria',
      description: 'Busca joyas en Plata 925, collares, anillos, aros y mas en AMBER Joyeria.',
      robots: { index: false },
    };
  }

  const query = q.trim();
  return {
    title: `"${query}" — Buscar en AMBER Joyeria`,
    description: `Resultados de busqueda para "${query}" en AMBER Joyeria. Joyas en Plata 925, amuletos y accesorios con significado.`,
    alternates: {
      canonical: `/buscar?q=${encodeURIComponent(query)}`,
    },
    openGraph: {
      title: `"${query}" — Buscar en AMBER Joyeria`,
      description: `Resultados para "${query}" en AMBER Joyeria.`,
    },
  };
}

export default async function BuscarPage({ searchParams }: Props) {
  const { q, page, sort, material, style, collection } = await searchParams;
  const query = q?.trim() || '';
  const currentPage = page ? Number(page) : 1;

  let results: SearchResponse | null = null;
  if (query.length >= 2) {
    results = await searchProducts(query, {
      page: currentPage,
      limit: 24,
      sort,
      material,
      style,
      collection,
    });
  }

  return (
    <div className="min-h-screen bg-pearl-50">
      <Header />

      <section className="container mx-auto px-4 lg:px-8 py-6 sm:py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-platinum-600 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-amber-gold-500 transition-colors">
            Inicio
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-obsidian-900">Buscar</span>
          {query && (
            <>
              <span aria-hidden="true">/</span>
              <span className="text-obsidian-900 truncate max-w-[200px]">&ldquo;{query}&rdquo;</span>
            </>
          )}
        </nav>

        {/* Title */}
        <div className="mb-6 sm:mb-8">
          {query ? (
            <>
              <h1
                className="text-2xl sm:text-3xl lg:text-4xl font-light text-obsidian-900 tracking-wide mb-2"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                Resultados para &ldquo;{query}&rdquo;
              </h1>
              {results && (
                <p className="text-sm text-platinum-600">
                  {results.total === 0
                    ? 'No se encontraron productos'
                    : `${results.total} producto${results.total !== 1 ? 's' : ''} encontrado${results.total !== 1 ? 's' : ''}`}
                </p>
              )}
            </>
          ) : (
            <h1
              className="text-2xl sm:text-3xl lg:text-4xl font-light text-obsidian-900 tracking-wide"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Buscar Productos
            </h1>
          )}
        </div>

        {/* Results */}
        <Suspense fallback={<SearchSkeleton />}>
          <SearchResultsClient
            results={results}
            query={query}
            currentPage={currentPage}
            currentSort={sort || 'relevance'}
          />
        </Suspense>
      </section>

      <Footer />
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-48 bg-pearl-200 rounded" />
        <div className="h-8 w-32 bg-pearl-200 rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[3/4] bg-pearl-200 rounded mb-3" />
            <div className="h-3 w-16 bg-pearl-200 rounded mx-auto mb-2" />
            <div className="h-4 w-3/4 bg-pearl-200 rounded mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
