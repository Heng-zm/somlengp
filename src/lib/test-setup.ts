import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    };
  },
}));

// Mock window.matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock clipboard API - check if already exists to avoid redefinition errors
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: jest.fn().mockResolvedValue(undefined),
      readText: jest.fn().mockResolvedValue(''),
    },
    configurable: true,
    writable: true,
  });
} else {
  // If clipboard already exists, just add the mocked methods
  Object.assign(navigator.clipboard, {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(''),
  });
}

// Mock console methods for cleaner test output
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn((message, ...args) => {
    if (typeof message === 'string' && message.includes('Warning:')) {
      return;
    }
    originalError(message, ...args);
  });
  
  console.warn = jest.fn((message, ...args) => {
    if (typeof message === 'string' && message.includes('Alert count')) {
      return;
    }
    originalWarn(message, ...args);
  });
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Global test utilities
export const waitForTimeout = (ms: number) => 
  new Promise(resolve => setTimeout(resolve, ms));

export const mockTimers = () => {
  jest.useFakeTimers();
  return {
    advanceByTime: (ms: number) => jest.advanceTimersByTime(ms),
    runAllTimers: () => jest.runAllTimers(),
    restore: () => jest.useRealTimers(),
  };
};

// Test data factories
export const createMockAlert = (overrides: any = {}) => ({
  id: `test-alert-${Math.random().toString(36).substr(2, 9)}`,
  type: 'info' as const,
  title: 'Test Alert',
  description: 'This is a test alert description',
  dismissible: true,
  ...overrides,
});

export const createMockAlerts = (count: number, overrides: any = {}) =>
  Array.from({ length: count }, (_, index) =>
    createMockAlert({ ...overrides, id: `test-alert-${index}` })
  );
