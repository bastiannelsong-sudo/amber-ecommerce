/**
 * CHKUI-ATOM-2
 * Presentational atom — labeled select with options.
 * Pure props, no store/hook/infrastructure imports.
 */
import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface CheckoutSelectFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  options: SelectOption[];
  disabled?: boolean;
  placeholder?: string;
}

export const CheckoutSelectField = ({
  label,
  name,
  value,
  onChange,
  options,
  disabled,
  placeholder,
}: CheckoutSelectFieldProps) => {
  const id = `checkout-select-${name}`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-obsidian-900 mb-1">
        {label}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full px-4 py-3 border border-pearl-300 focus:outline-none focus:border-obsidian-900 bg-white text-sm"
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
