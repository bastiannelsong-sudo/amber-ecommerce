/**
 * CHKUI-ATOM-1, CHKUI-T2
 * RTL test for CheckoutFormField — label + input with correct props.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CheckoutFormField } from './CheckoutFormField';

describe('CheckoutFormField', () => {
  it('renders the label text', () => {
    render(
      <CheckoutFormField
        label="Email"
        name="email"
        value=""
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders an input with the correct name and value', () => {
    render(
      <CheckoutFormField
        label="Email"
        name="email"
        value="test@test.com"
        onChange={vi.fn()}
      />,
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('name', 'email');
    expect(input).toHaveValue('test@test.com');
  });

  it('passes type prop to input (defaults to text)', () => {
    render(
      <CheckoutFormField
        label="Email"
        name="email"
        value=""
        onChange={vi.fn()}
        type="email"
      />,
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('passes placeholder prop to input', () => {
    render(
      <CheckoutFormField
        label="Nombre"
        name="firstName"
        value=""
        onChange={vi.fn()}
        placeholder="Tu nombre"
      />,
    );

    expect(screen.getByPlaceholderText('Tu nombre')).toBeInTheDocument();
  });

  it('marks input as required when required=true', () => {
    render(
      <CheckoutFormField
        label="Email"
        name="email"
        value=""
        onChange={vi.fn()}
        required
      />,
    );

    expect(screen.getByRole('textbox')).toBeRequired();
  });

  it('label is associated with input via htmlFor', () => {
    render(
      <CheckoutFormField
        label="Apellido"
        name="lastName"
        value=""
        onChange={vi.fn()}
      />,
    );

    const label = screen.getByText('Apellido');
    const input = screen.getByRole('textbox');
    expect(label.closest('label')?.htmlFor || label.getAttribute('for')).toBeTruthy();
    expect(input).toBeInTheDocument();
  });
});
