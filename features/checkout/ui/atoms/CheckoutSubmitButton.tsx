/**
 * CHKUI-ATOM-3
 * Presentational atom — submit button with loading state.
 * Pure props, no store/hook/infrastructure imports.
 */
import React from 'react';

interface CheckoutSubmitButtonProps {
  label: string;
  isLoading: boolean;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export const CheckoutSubmitButton = ({
  label,
  isLoading,
  disabled,
  onClick,
}: CheckoutSubmitButtonProps) => {
  return (
    <button
      type="submit"
      disabled={isLoading || disabled}
      onClick={onClick}
      className="w-full py-4 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {isLoading ? (
        <span role="status" aria-label="Procesando" className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Procesando...
        </span>
      ) : (
        label
      )}
    </button>
  );
};
