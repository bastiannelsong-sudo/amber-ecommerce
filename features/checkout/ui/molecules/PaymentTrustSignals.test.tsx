/**
 * CHKUI-MOL-5, CHKUI-T2
 * RTL test for PaymentTrustSignals — three trust signal badges.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PaymentTrustSignals } from './PaymentTrustSignals';

describe('PaymentTrustSignals', () => {
  it('renders all three trust signals', () => {
    render(<PaymentTrustSignals />);
    // Three distinct elements — could be icons with aria labels or text
    const signals = screen.getAllByRole('listitem');
    expect(signals).toHaveLength(3);
  });

  it('does not require any props', () => {
    expect(() => render(<PaymentTrustSignals />)).not.toThrow();
  });
});
