/**
 * CHKUI-ATOM-1
 * Presentational atom — labeled text input.
 * Pure props, no store/hook/infrastructure imports.
 */
import React from 'react';

interface CheckoutFormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  type?: React.HTMLInputTypeAttribute;
  required?: boolean;
  placeholder?: string;
}

export const CheckoutFormField = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
}: CheckoutFormFieldProps) => {
  const id = `checkout-field-${name}`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-obsidian-900 mb-1">
        {label}
      </label>
      <input
        id={id}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-pearl-300 focus:outline-none focus:border-obsidian-900 bg-white text-sm"
      />
    </div>
  );
};
