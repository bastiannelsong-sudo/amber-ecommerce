import Image from 'next/image';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CatalogClient from '../components/CatalogClient';
import { dummyProducts } from '../lib/data/dummy-products';
import type { Product } from '../lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/products`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((raw: any) => ({
      ...raw,
      category: raw.category
        ? {
            category_id: raw.category.category_id ?? raw.category.platform_id,
            name: raw.category.name ?? raw.category.platform_name,
            description: raw.category.description,
          }
        : undefined,
    }));
  } catch {
    return dummyProducts;
  }
}

export default async function CatalogoPage() {
  const products = await getProducts();

  return (
    <div className="min-h-screen bg-pearl-50">
      <Header />

      {/* Hero Banner */}
      <section className="relative h-[30vh] sm:h-[40vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian-950/60 via-obsidian-900/30 to-obsidian-950/50 z-10" />
        <Image
          src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920&h=800&fit=crop"
          alt="Catalogo Completo"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="text-center text-white space-y-3 sm:space-y-6 px-4 animate-fade-in">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-amber-gold-400 font-medium">
              Toda la Coleccion
            </p>
            <h1
              className="text-3xl sm:text-5xl lg:text-7xl font-light tracking-wider"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Catalogo Completo
            </h1>
            <p className="text-sm sm:text-base lg:text-lg tracking-wide font-light max-w-2xl mx-auto text-pearl-200">
              Explora nuestra coleccion completa de joyeria artesanal
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 lg:px-8 py-6 sm:py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-platinum-600 mb-4 sm:mb-8">
          <Link href="/" className="hover:text-amber-gold-500 transition-colors">
            Inicio
          </Link>
          <span>/</span>
          <span className="text-obsidian-900">Catalogo</span>
        </div>

        <CatalogClient products={products} />
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
