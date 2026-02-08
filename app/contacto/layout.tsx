import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Contacta con AMBER Joyas. Telefono, email y formulario de contacto. Atencion personalizada de lunes a sabado.',
  openGraph: {
    title: 'Contacto | AMBER Joyas',
    description: 'Contacta con AMBER Joyas. Atencion personalizada de lunes a sabado.',
    url: '/contacto',
  },
  twitter: {
    title: 'Contacto | AMBER Joyas',
    description: 'Contacta con AMBER Joyas. Atencion personalizada.',
  },
  alternates: {
    canonical: '/contacto',
  },
};

export default function ContactoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
