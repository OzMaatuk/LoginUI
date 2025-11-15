import { describe, test, expect } from '@jest/globals';

describe('External App Login Flow', () => {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:8000';

  test('should reject invalid app_id', async () => {
    const response = await fetch(
      `${baseUrl}/api/auth/initiate?app_id=invalid&return_url=http://localhost:3001/callback`
    );
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid app_id');
  });

  test('should reject invalid return_url', async () => {
    const response = await fetch(
      `${baseUrl}/api/auth/initiate?app_id=app1&return_url=http://malicious.com/callback`
    );
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid return_url');
  });

  test('should reject missing parameters', async () => {
    const response = await fetch(`${baseUrl}/api/auth/initiate?app_id=app1`);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Missing parameters');
  });

  test('should return 401 for unauthenticated session check', async () => {
    const response = await fetch(`${baseUrl}/api/auth/session`);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.user).toBeNull();
  });

  test('should successfully logout', async () => {
    const response = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('should redirect to login with valid parameters', async () => {
    const response = await fetch(
      `${baseUrl}/api/auth/initiate?app_id=app1&return_url=http://localhost:3001/auth/callback`,
      { redirect: 'manual' }
    );
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
  });
});
