import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ProductCard from '../../components/ProductCard';
import { SITE_URL } from '../../lib/seo-copy';
import type { Collection, Product } from '../../lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function getCollection(slug: string): Promise<Collection | null> {
  try {
    const res = await fetch(`${API_URL}/collections/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getCollectionProducts(slug: string): Promise<{ data: Product[]; total: number }> {
  try {
    const res = await fetch(`${API_URL}/collections/${slug}/products?limit=60&sort=bestseller`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { data: [], total: 0 };
    return res.json();
  } catch {
    return { data: [], total: 0 };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) return { title: 'Colección no encontrada | AMBER Joyas' };

  const url = `${SITE_URL}/colecciones/${slug}`;
  const title = `${collection.name} | AMBER Joyas`;
  const description =
    collection.description ||
    `Descubre la colección ${collection.name} en plata fina 925. Diseños únicos con significado, envío a todo Chile.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${collection.name} | AMBER`,
      description,
      url,
      siteName: 'AMBER Joyería',
      type: 'website',
      locale: 'es_CL',
      images: collection.image_url ? [{ url: collection.image_url, alt: collection.name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: collection.image_url ? [collection.image_url] : undefined,
    },
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [collection, productsResult] = await Promise.all([
    getCollection(slug),
    getCollectionProducts(slug),
  ]);

  if (!collection) {
    return (
      <div className="min-h-screen bg-pearl-50">
        <Header />
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="text-4xl font-light text-obsidian-900 mb-4" style={{ fontFamily: 'var(--font-cormorant)' }}>
            Coleccion no encontrada
          </h1>
          <Link href="/colecciones" className="text-amber-gold-500 hover:underline">
            Volver a colecciones
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const { data: products, total } = productsResult;
  const hasChildren = collection.children && collection.children.length > 0;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Colecciones', item: `${SITE_URL}/colecciones` },
      ...(collection.parent
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: collection.parent.name,
              item: `${SITE_URL}/colecciones/${collection.parent.slug}`,
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: collection.name,
              item: `${SITE_URL}/colecciones/${slug}`,
            },
          ]
        : [
            {
              '@type': 'ListItem',
              position: 3,
              name: collection.name,
              item: `${SITE_URL}/colecciones/${slug}`,
            },
          ]),
    ],
  };

  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: collection.name,
    description: collection.description ?? undefined,
    url: `${SITE_URL}/colecciones/${slug}`,
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

      {/* Hero */}
      <section className="relative h-[40vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian-950/60 via-obsidian-900/30 to-obsidian-950/50 z-10" />
        <Image
          src={collection.image_url || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920&h=800&fit=crop'}
          alt={collection.name}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="text-center text-white space-y-4 px-4 animate-fade-in">
            {collection.parent && (
              <Link
                href={`/colecciones/${collection.parent.slug}`}
                className="text-xs uppercase tracking-[0.3em] text-amber-gold-400 font-medium hover:text-amber-gold-300 transition-colors"
              >
                {collection.parent.name}
              </Link>
            )}
            <h1
              className="text-4xl sm:text-5xl lg:text-7xl font-light tracking-wider"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              {collection.name}
            </h1>
            {collection.description && (
              <p className="text-base lg:text-lg tracking-wide font-light max-w-2xl mx-auto text-pearl-200">
                {collection.description}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 lg:px-8 py-8 lg:py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-platinum-600 mb-8 flex-wrap">
          <Link href="/" className="hover:text-amber-gold-500 transition-colors">Inicio</Link>
          <span>/</span>
          <Link href="/colecciones" className="hover:text-amber-gold-500 transition-colors">Colecciones</Link>
          {collection.parent && (
            <>
              <span>/</span>
              <Link href={`/colecciones/${collection.parent.slug}`} className="hover:text-amber-gold-500 transition-colors">
                {collection.parent.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-obsidian-900">{collection.name}</span>
        </div>

        {/* Subcategory pills if this collection has children */}
        {hasChildren && (
          <div className="mb-10">
            <div className="flex flex-wrap gap-3">
              {collection.children!.map((child) => (
                <Link
                  key={child.id}
                  href={`/colecciones/${child.slug}`}
                  className="px-5 py-2.5 bg-white border border-pearl-300 text-sm text-obsidian-700 hover:border-amber-gold-500 hover:text-amber-gold-600 transition-all shadow-sm"
                >
                  {child.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Product count */}
        <div className="flex items-center justify-between mb-8">
          <h2
            className="text-2xl font-light text-obsidian-900"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            {total} {total === 1 ? 'Producto' : 'Productos'}
          </h2>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 gap-y-6 sm:gap-6 sm:gap-y-10">
            {products.map((product, index) => (
              <div
                key={product.product_id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ProductCard product={product} isNew={index < 3} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-platinum-600 mb-4">Aun no hay productos en esta coleccion.</p>
            <Link href="/colecciones" className="text-amber-gold-500 hover:underline text-sm uppercase tracking-widest">
              Explorar otras colecciones
            </Link>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
