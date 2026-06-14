/**
 * CHKUI-MOL-1, CHKUI-T2
 * RTL test for ContactInfoForm — four contact fields.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContactInfoForm } from './ContactInfoForm';

const DEFAULT_PROPS = {
  email: 'a@a.com',
  firstName: 'Ana',
  lastName: 'Lopez',
  phone: '+56912345678',
  onChange: vi.fn(),
};

describe('ContactInfoForm', () => {
  it('renders email field', () => {
    render(<ContactInfoForm {...DEFAULT_PROPS} />);
    expect(screen.getByDisplayValue('a@a.com')).toBeInTheDocument();
  });

  it('renders firstName field', () => {
    render(<ContactInfoForm {...DEFAULT_PROPS} />);
    expect(screen.getByDisplayValue('Ana')).toBeInTheDocument();
  });

  it('renders lastName field', () => {
    render(<ContactInfoForm {...DEFAULT_PROPS} />);
    expect(screen.getByDisplayValue('Lopez')).toBeInTheDocument();
  });

  it('renders phone field', () => {
    render(<ContactInfoForm {...DEFAULT_PROPS} />);
    expect(screen.getByDisplayValue('+56912345678')).toBeInTheDocument();
  });

  it('renders all four inputs', () => {
    render(<ContactInfoForm {...DEFAULT_PROPS} />);
    // Should have at least 4 inputs (email, firstName, lastName, phone)
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThanOrEqual(4);
  });
});
