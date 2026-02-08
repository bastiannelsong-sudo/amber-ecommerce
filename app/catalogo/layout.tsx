import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Catalogo Completo de Joyas',
  description: 'Explora nuestro catalogo completo de joyas en Plata 925, amuletos de proteccion y accesorios con significado. Envio gratuito sobre $30.000.',
  openGraph: {
    title: 'Catalogo Completo de Joyas | AMBER',
    description: 'Joyas en Plata 925, amuletos de proteccion y accesorios con significado. Envio gratuito sobre $30.000.',
    url: '/catalogo',
  },
  twitter: {
    title: 'Catalogo Completo de Joyas | AMBER',
    description: 'Joyas en Plata 925, amuletos de proteccion y accesorios con significado.',
  },
  alternates: {
    canonical: '/catalogo',
  },
};

export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
