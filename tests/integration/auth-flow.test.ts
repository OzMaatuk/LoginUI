/**
 * @jest-environment node
 */
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock dependencies BEFORE imports
jest.mock('@/lib/redis', () => ({
  __esModule: true,
  default: {
    setex: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue('OK'),
  },
  setSession: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  getSession: jest.fn<() => Promise<null>>().mockResolvedValue(null),
}));

jest.mock('@/lib/rate-limit', () => ({
  ratelimit: null,
}));

jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@auth/core', () => ({
  __esModule: true,
  Auth: jest.fn(),
}));

jest.mock('@/auth', () => ({
  __esModule: true,
  auth: jest.fn<() => Promise<null>>().mockResolvedValue(null),
  signOut: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  handlers: {
    GET: jest.fn(),
    POST: jest.fn(),
  },
}));

// Import routes AFTER mocks
import { GET as initiateGET } from '@/app/api/auth/initiate/route';
import { GET as sessionGET } from '@/app/api/auth/check-login-session/route';
import { POST as logoutPOST } from '@/app/api/auth/logout/route';

describe('External App Login Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('Auth Initiate Endpoint', () => {
    test('should reject invalid app_id', async () => {
      const request = new NextRequest(
        'http://localhost:8000/api/auth/initiate?app_id=invalid&return_url=http://localhost:3001/callback'
      );

      const response = await initiateGET(request);
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBe('Invalid app_id');
    });

    test('should reject invalid return_url', async () => {
      const request = new NextRequest(
        'http://localhost:8000/api/auth/initiate?app_id=app1&return_url=http://malicious.com/callback'
      );

      const response = await initiateGET(request);
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBe('Invalid return_url');
    });

    test('should reject missing parameters', async () => {
      const request = new NextRequest(
        'http://localhost:8000/api/auth/initiate?app_id=app1'
      );

      const response = await initiateGET(request);
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBe('Missing parameters');
    });

    test('should redirect to login with valid parameters', async () => {
      const request = new NextRequest(
        'http://localhost:8000/api/auth/initiate?app_id=app1&return_url=http://localhost:3001/auth/callback'
      );

      const response = await initiateGET(request);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
    });
  });

  describe('Session Endpoint', () => {
    test('should return 404 when no session cookie exists', async () => {
      const request = new NextRequest('http://localhost:8000/api/auth/check-login-session');

      const response = await sessionGET(request);
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.session).toBeNull();
    });
  });

  describe('Logout Endpoint', () => {
    test('should successfully logout', async () => {
      const request = new NextRequest('http://localhost:8000/api/auth/logout', {
        method: 'POST',
      });

      const response = await logoutPOST(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });
});
