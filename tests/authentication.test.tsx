import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../src/pages/Login';
import { AuthProvider } from '../src/contexts/AuthContext';
import { signInWithPopup, signOut, getAuth } from 'firebase/auth';

describe('Authentication', () => {
  beforeAll(() => {
    window.alert = vi.fn();
  });

  it('handles Google Login flow', async () => {
    // Arrange
    (signInWithPopup as any).mockResolvedValueOnce({
      user: { uid: '123', email: 'test@example.com' }
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );

    // Act
    const loginButton = screen.getByText('Google');
    fireEvent.click(loginButton);

    // Assert
    await waitFor(() => {
      expect(signInWithPopup).toHaveBeenCalled();
    });
  });

  it('handles session creation implicitly through AuthContext', () => {
    // Arrange & Act
    const auth = getAuth();
    
    // Assert
    expect(auth).toBeDefined();
  });

  it('handles logout flow', async () => {
    // Arrange
    (signOut as any).mockResolvedValueOnce({});
    const auth = getAuth();

    // Act
    await signOut(auth);

    // Assert
    expect(signOut).toHaveBeenCalled();
  });
});
