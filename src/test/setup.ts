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

// Mock matchMedia API
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver API
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver API
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock console methods for cleaner test output
globalThis.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock Notification API
class MockNotification {
  constructor(title: string, options?: NotificationOptions) {
    this.title = title;
    Object.assign(this, options);
  }
  
  static permission: NotificationPermission = 'granted';
  
  static requestPermission = vi.fn().mockResolvedValue('granted');
  
  title: string;
  body?: string;
  icon?: string;
  onclick: ((this: Notification, ev: Event) => void) | null = null;
  onclose: ((this: Notification, ev: Event) => void) | null = null;
  onerror: ((this: Notification, ev: Event) => void) | null = null;
  onshow: ((this: Notification, ev: Event) => void) | null = null;
  
  close = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn();
}

Object.defineProperty(window, 'Notification', {
  value: MockNotification,
  writable: true,
});

// Mock ServiceWorker API
const mockServiceWorkerRegistration = {
  showNotification: vi.fn(),
  getNotifications: vi.fn().mockResolvedValue([]),
  update: vi.fn(),
  unregister: vi.fn(),
};

Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: vi.fn().mockResolvedValue(mockServiceWorkerRegistration),
    ready: Promise.resolve(mockServiceWorkerRegistration),
    getRegistration: vi.fn().mockResolvedValue(mockServiceWorkerRegistration),
    getRegistrations: vi.fn().mockResolvedValue([mockServiceWorkerRegistration]),
  },
  writable: true,
});

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  value: vi.fn().mockReturnValue('blob:mock-url'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  value: vi.fn(),
});

// Additional window properties for React testing
Object.defineProperty(window, 'requestAnimationFrame', {
  value: vi.fn().mockImplementation((cb) => setTimeout(cb, 0)),
  writable: true,
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  value: vi.fn(),
  writable: true,
});

// Mock document.elementFromPoint
Object.defineProperty(document, 'elementFromPoint', {
  value: vi.fn().mockReturnValue(null),
  writable: true,
});

// Mock window.getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: vi.fn().mockReturnValue({}),
  writable: true,
});