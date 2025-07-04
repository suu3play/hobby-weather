import '@testing-library/jest-dom';
import { vi } from 'vitest';
import 'fake-indexeddb/auto';

// Mock geolocation API
Object.assign(globalThis.navigator, {
  geolocation: {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
});

// Mock fetch API
globalThis.fetch = vi.fn();