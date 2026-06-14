/**
 * CATUI-MOL-2 + CATUI-T4
 * RTL test for FilterSection molecule.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterSection } from './FilterSection';

const options = [
  { label: 'Plata', value: 'plata' },
  { label: 'Oro', value: 'oro' },
];

describe('FilterSection', () => {
  it('renders the section title', () => {
    render(
      <FilterSection
        title="Material"
        filterKey="materials"
        options={options}
        activeValues={[]}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText('Material')).toBeInTheDocument();
  });

  it('renders all option labels when section is open', () => {
    render(
      <FilterSection
        title="Material"
        filterKey="materials"
        options={options}
        activeValues={[]}
        onChange={vi.fn()}
        defaultOpen
      />
    );
    expect(screen.getByText('Plata')).toBeInTheDocument();
    expect(screen.getByText('Oro')).toBeInTheDocument();
  });

  it('calls onChange when a checkbox option is clicked', () => {
    const onChange = vi.fn();
    render(
      <FilterSection
        title="Material"
        filterKey="materials"
        options={options}
        activeValues={[]}
        onChange={onChange}
        defaultOpen
      />
    );
    fireEvent.click(screen.getByLabelText('Plata'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
