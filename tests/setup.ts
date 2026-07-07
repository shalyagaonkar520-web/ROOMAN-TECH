import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Web Speech API
global.SpeechSynthesisUtterance = vi.fn() as any;
global.speechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  getVoices: vi.fn().mockReturnValue([]),
} as any;

// Mock MediaDevices
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }]
    }),
  },
  writable: true,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.alert and ResizeObserver
window.alert = vi.fn();
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: { uid: 'test-user', email: 'test@example.com' },
  })),
  onAuthStateChanged: vi.fn((auth, cb) => {
    cb({ uid: 'test-user', email: 'test@example.com' });
    return () => {}; // unsubscribe function
  }),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  setPersistence: vi.fn(),
  browserLocalPersistence: {},
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  getDocs: vi.fn(),
}));

// Global mock for our internal firebase initialization
vi.mock('../src/lib/firebase', () => ({
  app: {},
  auth: { currentUser: { uid: 'test', email: 'test@example.com' } },
  storage: {},
  db: {}
}));

// Global fetch mock to prevent JSDOM network errors
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({})
}) as any;
