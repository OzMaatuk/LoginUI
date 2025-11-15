import "@testing-library/jest-dom";

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
  // Mock window.location properly for jsdom
  delete window.location;
  window.location = {
    href: "http://localhost",
    origin: "http://localhost",
    protocol: "http:",
    host: "localhost",
    hostname: "localhost",
    port: "",
    pathname: "/",
    search: "",
    hash: "",
    assign: jest.fn(),
    reload: jest.fn(),
    replace: jest.fn(),
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
