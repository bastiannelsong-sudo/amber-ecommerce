'use client';

/**
 * Boton "Imprimir / Descargar PDF". Llama a window.print() — el dialogo
 * nativo del browser permite "Guardar como PDF". Asi evitamos depender de
 * jsPDF/puppeteer y mantenemos cero JS extra en el bundle del lado server.
 *
 * El @media print en globals esconde header/footer/print-hide para que el
 * documento impreso quede limpio.
 */
export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="px-6 py-3 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors print-hide cursor-pointer"
    >
      Imprimir / Descargar PDF
    </button>
  );
}
