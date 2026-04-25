import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gift Card Virtual',
  description: 'Regala joyas con una gift card virtual de AMBER. Plata 925 y amuletos de proteccion. Valida por 12 meses, sin costos de mantenimiento.',
  openGraph: {
    title: 'Gift Card Virtual | AMBER Joyas',
    description: 'Regala joyas en Plata 925 con una gift card virtual. El regalo perfecto.',
    url: '/gift-card',
  },
  twitter: {
    title: 'Gift Card Virtual | AMBER Joyas',
    description: 'Regala joyas en Plata 925 con una gift card virtual de AMBER.',
  },
  alternates: {
    canonical: '/gift-card',
  },
};

export default function GiftCardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
