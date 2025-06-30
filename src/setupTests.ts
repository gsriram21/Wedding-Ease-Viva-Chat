import '@testing-library/jest-dom';

// Mock the Clipboard API for testing
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
    readText: jest.fn(() => Promise.resolve('')),
  },
});

// Mock document.execCommand for fallback testing
document.execCommand = jest.fn(() => true);

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.getSelection for text selection tests
Object.defineProperty(window, 'getSelection', {
  writable: true,
  value: jest.fn(() => ({
    toString: jest.fn(() => ''),
    removeAllRanges: jest.fn(),
    addRange: jest.fn(),
  })),
});

// Mock import.meta.env for Jest
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_OPENAI_API_KEY: process.env.VITE_OPENAI_API_KEY || 'test-api-key'
      }
    }
  }
}); 