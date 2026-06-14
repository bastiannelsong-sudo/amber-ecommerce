/**
 * CHKUI-ATOM-2, CHKUI-T2
 * RTL test for CheckoutSelectField — label + select with options.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CheckoutSelectField } from './CheckoutSelectField';

const OPTIONS = [
  { value: 'RM', label: 'Región Metropolitana' },
  { value: 'V', label: 'Valparaíso' },
];

describe('CheckoutSelectField', () => {
  it('renders the label text', () => {
    render(
      <CheckoutSelectField
        label="Región"
        name="region"
        value=""
        onChange={vi.fn()}
        options={OPTIONS}
      />,
    );

    expect(screen.getByText('Región')).toBeInTheDocument();
  });

  it('renders options from props', () => {
    render(
      <CheckoutSelectField
        label="Región"
        name="region"
        value=""
        onChange={vi.fn()}
        options={OPTIONS}
      />,
    );

    expect(screen.getByRole('option', { name: 'Región Metropolitana' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Valparaíso' })).toBeInTheDocument();
  });

  it('select has disabled attribute when disabled=true', () => {
    render(
      <CheckoutSelectField
        label="Comuna"
        name="commune"
        value=""
        onChange={vi.fn()}
        options={[]}
        disabled
      />,
    );

    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('select is not disabled by default', () => {
    render(
      <CheckoutSelectField
        label="Región"
        name="region"
        value=""
        onChange={vi.fn()}
        options={OPTIONS}
      />,
    );

    expect(screen.getByRole('combobox')).not.toBeDisabled();
  });

  it('renders placeholder option when provided', () => {
    render(
      <CheckoutSelectField
        label="Región"
        name="region"
        value=""
        onChange={vi.fn()}
        options={OPTIONS}
        placeholder="Seleccioná una región"
      />,
    );

    expect(screen.getByRole('option', { name: 'Seleccioná una región' })).toBeInTheDocument();
  });
});
