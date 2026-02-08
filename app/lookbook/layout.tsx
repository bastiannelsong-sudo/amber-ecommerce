import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lookbook',
  description: 'Explora nuestro lookbook con inspiracion de estilo. Descubre como combinar joyas en Plata 925 y amuletos para cada ocasion.',
  openGraph: {
    title: 'Lookbook | AMBER Joyas',
    description: 'Inspiracion de estilo con joyas en Plata 925 y amuletos de proteccion.',
    url: '/lookbook',
  },
  twitter: {
    title: 'Lookbook | AMBER Joyas',
    description: 'Inspiracion de estilo con joyas en Plata 925 y amuletos de proteccion.',
  },
  alternates: {
    canonical: '/lookbook',
  },
};

export default function LookbookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
