import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TypeBadge from './TypeBadge';

describe('TypeBadge', () => {
  it('renders correctly with known type LT', () => {
    render(<TypeBadge type="LT" />);
    expect(screen.getByText('LT')).toBeInTheDocument();
  });

  it('renders correctly with known type TH', () => {
    render(<TypeBadge type="TH" />);
    expect(screen.getByText('TH')).toBeInTheDocument();
  });

  it('handles lowercase known types correctly', () => {
    render(<TypeBadge type="lt" />);
    expect(screen.getByText('LT')).toBeInTheDocument();
  });

  it('handles type with spaces correctly', () => {
    render(<TypeBadge type="  th  " />);
    expect(screen.getByText('TH')).toBeInTheDocument();
  });

  it('handles unknown types gracefully with fallback', () => {
    render(<TypeBadge type="UNKNOWN" />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('handles missing type prop gracefully with fallback', () => {
    render(<TypeBadge />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('applies compact styling when compact prop is true', () => {
    const { container } = render(<TypeBadge type="LT" compact />);
    // Testing specific class application could be brittle, but checking if specific classes exist
    const span = container.querySelector('.gap-0\\.5'); // gap-0.5 has escaped dot in querySelector
    expect(span).toBeInTheDocument();
  });

  it('applies regular styling when compact prop is false', () => {
    const { container } = render(<TypeBadge type="LT" />);
    const span = container.querySelector('.gap-1');
    expect(span).toBeInTheDocument();
  });
});
