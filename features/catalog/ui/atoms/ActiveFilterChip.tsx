interface ActiveFilterChipProps {
  label: string;
  onRemove: () => void;
}

export function ActiveFilterChip({ label, onRemove }: ActiveFilterChipProps) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pearl-100 border border-pearl-200 text-xs text-obsidian-700 capitalize">
      {label}
      <button
        onClick={onRemove}
        className="text-platinum-500 hover:text-red-500 transition-colors cursor-pointer"
        aria-label={`Quitar filtro ${label}`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}
