import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import JobFilters from '../Jobfilters';

describe('JobFilters Component', () => {
  it('renders correctly with given props', () => {
    const mockSetQ = vi.fn();
    const mockOnRefresh = vi.fn();
    
    render(<JobFilters q="Software" setQ={mockSetQ} onRefresh={mockOnRefresh} />);
    
    // Check if input exists and has correct value
    const input = screen.getByPlaceholderText('Search jobs, companies...');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('Software');
    
    // Check if refresh button exists
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toBeInTheDocument();
  });

  it('calls setQ when typing in search input', () => {
    const mockSetQ = vi.fn();
    const mockOnRefresh = vi.fn();
    
    render(<JobFilters q="" setQ={mockSetQ} onRefresh={mockOnRefresh} />);
    
    const input = screen.getByPlaceholderText('Search jobs, companies...');
    fireEvent.change(input, { target: { value: 'Developer' } });
    
    expect(mockSetQ).toHaveBeenCalledTimes(1);
  });

  it('calls onRefresh when refresh button is clicked', () => {
    const mockSetQ = vi.fn();
    const mockOnRefresh = vi.fn();
    
    render(<JobFilters q="" setQ={mockSetQ} onRefresh={mockOnRefresh} />);
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);
    
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });
});
