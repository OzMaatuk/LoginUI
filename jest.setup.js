import "@testing-library/jest-dom";

// Mock ioredis to prevent real connections during tests
jest.mock("ioredis", () => {
  const mockRedis = jest.fn().mockImplementation(() => ({
    setex: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn(),
    on: jest.fn(),
  }));
  return mockRedis;
});

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => "/"),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock NextAuth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: "unauthenticated",
  })),
  signIn: jest.fn(() => Promise.resolve()),
  signOut: jest.fn(() => Promise.resolve()),
  SessionProvider: ({ children }) => children,
}));

// Only set up browser-specific mocks in jsdom environment
if (typeof window !== "undefined") {
  // Suppress jsdom navigation warnings
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Not implemented: navigation')
    ) {
      return;
    }
    originalConsoleError(...args);
  };

  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  Object.defineProperty(global, "localStorage", {
    value: localStorageMock,
    writable: true,
  });
}

// Mock atob for token decoding
global.atob = (str) => Buffer.from(str, "base64").toString("binary");

// Mock fetch for jsdom environment
if (typeof window !== "undefined" && !global.fetch) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: async () => ({}),
      text: async () => "",
      status: 200,
    })
  );
}

// Clean up after each test to prevent leaks
afterEach(() => {
  jest.clearAllTimers();
});

// Force cleanup after all tests
afterAll(async () => {
  jest.clearAllTimers();
  jest.restoreAllMocks();
});
