/**
 * Mobile sticky bottom bar — shows total always visible while form is being filled.
 * Rendered outside confirmation step, mobile only (< lg), via lg:hidden.
 * Pure props, no store/hook/infrastructure imports.
 */

export interface CheckoutMobileStickyBarProps {
  total: number;
  step: 'shipping' | 'payment';
}

export const CheckoutMobileStickyBar = ({
  total,
  step,
}: CheckoutMobileStickyBarProps) => {
  const helperText =
    step === 'shipping' ? 'Completá envío para continuar' : 'Listo para pagar';

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-pearl-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] z-40 px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-platinum-500">
          Total
        </span>
        <span className="text-lg font-medium text-obsidian-900">
          ${total.toLocaleString('es-CL')}
        </span>
      </div>
      <span className="text-xs text-platinum-600 text-right max-w-[140px]">
        {helperText}
      </span>
    </div>
  );
};
