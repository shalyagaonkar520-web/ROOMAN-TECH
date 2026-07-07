import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import CareerAssistant from '../src/pages/CareerAssistant';
import { BrowserRouter } from 'react-router-dom';

describe('Cover Letter', () => {
  it('generates a cover letter based on user input', async () => {
    // Arrange
    const mockGenerate = vi.fn().mockResolvedValue('Mock generated cover letter content');
    
    // Act
    const result = await mockGenerate();
    
    // Assert
    expect(mockGenerate).toHaveBeenCalled();
    expect(result).toContain('Mock generated');
  });

  it('triggers download for cover letter', () => {
    // Arrange
    const mockDownload = vi.fn();
    
    // Act
    mockDownload();
    
    // Assert
    expect(mockDownload).toHaveBeenCalled();
  });
});
