import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function OrderNotFound() {
  return (
    <div className="min-h-screen bg-pearl-50 flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-24 text-center max-w-xl">
        <h1
          className="text-3xl lg:text-4xl font-light text-obsidian-900 mb-4"
          style={{ fontFamily: 'var(--font-cormorant)' }}
        >
          No encontramos esta orden
        </h1>
        <p className="text-platinum-700 mb-8">
          El número de orden no existe o el enlace está mal copiado. Si
          acabás de pagar y crees que esto es un error, contactanos por
          WhatsApp con el número de tu orden.
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-4 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors"
        >
          Ir al inicio
        </Link>
      </main>
      <Footer />
    </div>
  );
}
