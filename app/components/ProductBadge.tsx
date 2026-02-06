interface ProductBadgeProps {
  type: 'new' | 'bestseller' | 'sale' | 'exclusive' | 'limited';
  discount?: number;
}

export default function ProductBadge({ type, discount }: ProductBadgeProps) {
  const badges = {
    new: {
      text: 'Nuevo',
      className: 'bg-amber-gold-500 text-white',
    },
    bestseller: {
      text: 'Bestseller',
      className: 'bg-obsidian-900 text-white',
    },
    sale: {
      text: discount ? `-${discount}%` : 'Oferta',
      className: 'bg-red-600 text-white',
    },
    exclusive: {
      text: 'Exclusivo',
      className: 'bg-purple-600 text-white',
    },
    limited: {
      text: 'Edición Limitada',
      className: 'bg-emerald-600 text-white',
    },
  };

  const badge = badges[type];

  return (
    <div className={`absolute top-4 left-4 ${badge.className} px-3 py-1 text-xs uppercase tracking-wider font-medium z-10 shadow-md`}>
      {badge.text}
    </div>
  );
}
