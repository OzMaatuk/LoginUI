/**
 * @jest-environment node
 */
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { GET as initiateGET } from '@/app/api/auth/initiate/route';
import { GET as sessionGET } from '@/app/api/auth/session/route';
import { POST as logoutPOST } from '@/app/api/auth/logout/route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/redis', () => ({
  setSession: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  getSession: jest.fn<() => Promise<null>>().mockResolvedValue(null),
}));

jest.mock('@/lib/rate-limit', () => ({
  ratelimit: null,
}));

jest.mock('@/auth', () => ({
  auth: jest.fn<() => Promise<null>>().mockResolvedValue(null),
  signOut: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

describe('External App Login Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    test('should return 401 for unauthenticated session check', async () => {
      const request = new NextRequest('http://localhost:8000/api/auth/session');

      const response = await sessionGET(request);
      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.user).toBeNull();
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
