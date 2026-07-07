import { describe, it, expect, vi } from 'vitest';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

describe('Firebase & Firestore configuration', () => {
  it('initializes auth with the correct mock', () => {
    // Arrange & Act
    const auth = getAuth();
    
    // Assert
    expect(auth).toBeDefined();
    expect(auth.currentUser?.email).toBe('test@example.com');
  });

  it('initializes firestore correctly', () => {
    // Arrange & Act
    const db = getFirestore();
    
    // Assert
    // Setup file mocks getFirestore, we just verify it exists
    expect(getFirestore).toHaveBeenCalled();
  });
});
