/**
 * CHKUI-MOL-3, CHKUI-T2
 * RTL test for ShippingSummaryCard — read-only shipping summary.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShippingSummaryCard } from './ShippingSummaryCard';

const FORM_DATA = {
  email: 'test@test.com',
  firstName: 'Juan',
  lastName: 'Pérez',
  phone: '+56912345678',
  address: 'Av. Siempre Viva 742',
  apartment: '',
  region: 'RM',
  commune: 'Santiago',
  postalCode: '',
};

describe('ShippingSummaryCard', () => {
  it('renders email from formData', () => {
    render(<ShippingSummaryCard formData={FORM_DATA} />);
    expect(screen.getByText('test@test.com')).toBeInTheDocument();
  });

  it('renders first + last name from formData', () => {
    render(<ShippingSummaryCard formData={FORM_DATA} />);
    expect(screen.getByText(/Juan/i)).toBeInTheDocument();
    expect(screen.getByText(/Pérez/i)).toBeInTheDocument();
  });

  it('renders address from formData', () => {
    render(<ShippingSummaryCard formData={FORM_DATA} />);
    expect(screen.getByText(/Av. Siempre Viva 742/i)).toBeInTheDocument();
  });

  it('renders commune and region from formData', () => {
    render(<ShippingSummaryCard formData={FORM_DATA} />);
    expect(screen.getByText(/Santiago/i)).toBeInTheDocument();
    // Exact match for 'RM' to avoid ambiguity with "Información" containing 'rm'
    expect(screen.getByText('RM')).toBeInTheDocument();
  });

  it('contains no editable inputs (read-only display)', () => {
    render(<ShippingSummaryCard formData={FORM_DATA} />);
    const inputs = screen.queryAllByRole('textbox');
    expect(inputs).toHaveLength(0);
  });
});
