export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-pearl-50">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-pearl-300 border-t-amber-gold-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-platinum-600 uppercase tracking-widest">
          Cargando...
        </p>
      </div>
    </div>
  );
}
