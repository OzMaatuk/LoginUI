export default function NextAuth(config: any) {
  return {
    handlers: {
      GET: jest.fn(),
      POST: jest.fn(),
    },
    auth: jest.fn().mockResolvedValue(null),
    signIn: jest.fn().mockResolvedValue(undefined),
    signOut: jest.fn().mockResolvedValue(undefined),
  };
}

export type { NextAuthConfig } from 'next-auth';
