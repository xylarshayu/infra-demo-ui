import { vi } from 'vitest';

Object.defineProperty(window, 'EventSource', {
  writable: true,
  value: vi.fn().mockImplementation(function () {
    return {
      onmessage: vi.fn(),
      onerror: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      close: vi.fn(),
    }
  }),
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(function (query) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
  }),
})