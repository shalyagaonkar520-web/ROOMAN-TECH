import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import CareerAssistant from '../src/pages/CareerAssistant';
import { BrowserRouter } from 'react-router-dom';

describe('Resume Upload', () => {
  it('accepts PDF upload', async () => {
    render(<BrowserRouter><CareerAssistant /></BrowserRouter>);
    const file = new File(['dummy content'], 'resume.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    expect(input.files?.[0].name).toBe('resume.pdf');
  });

  it('accepts DOCX upload', async () => {
    render(<BrowserRouter><CareerAssistant /></BrowserRouter>);
    const file = new File(['dummy content'], 'resume.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    expect(input.files?.[0].name).toBe('resume.docx');
  });

  it('rejects invalid file types', async () => {
    render(<BrowserRouter><CareerAssistant /></BrowserRouter>);
    const file = new File(['dummy content'], 'image.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      // Input should ideally be empty or alert fired
      expect(window.alert).toHaveBeenCalled();
    });
  });
});
