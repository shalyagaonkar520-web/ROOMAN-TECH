import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import App from '../src/App';
import { AuthProvider } from '../src/contexts/AuthContext';

// Mock canvas for PDF/charts
HTMLCanvasElement.prototype.getContext = vi.fn() as any;

describe('Smoke Tests', () => {
  it('renders without crashing', () => {
    // Arrange
    const { container } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    // Assert
    expect(container).toBeInTheDocument();
  });
});
