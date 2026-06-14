/**
 * CARTUI-ATOM-1 — Pure-props quantity stepper.
 * When quantity === 1, decrement calls onRemove instead of onDecrement.
 * Zero store/hook imports: pure presentational atom.
 */

export interface QuantityStepperProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

export function QuantityStepper({
  quantity,
  onIncrement,
  onDecrement,
  onRemove,
}: QuantityStepperProps) {
  const handleDecrement = () => {
    if (quantity === 1) {
      onRemove();
    } else {
      onDecrement();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleDecrement}
        aria-label="Disminuir cantidad"
        className="w-8 h-8 flex items-center justify-center border border-pearl-300 hover:border-amber-gold-500 transition-colors text-sm"
      >
        -
      </button>
      <span className="text-sm w-8 text-center">{quantity}</span>
      <button
        type="button"
        onClick={onIncrement}
        aria-label="Aumentar cantidad"
        className="w-8 h-8 flex items-center justify-center border border-pearl-300 hover:border-amber-gold-500 transition-colors text-sm"
      >
        +
      </button>
    </div>
  );
}
