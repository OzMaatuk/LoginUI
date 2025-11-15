import { randomBytes } from 'crypto';

export function generateState(): string {
  return randomBytes(32).toString('hex');
}

export function generateSessionId(): string {
  return randomBytes(32).toString('hex');
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeReturnUrl(url: string): string {
  if (!isValidUrl(url)) {
    throw new Error('Invalid URL');
  }
  
  const parsed = new URL(url);
  // Only allow http and https protocols
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Invalid protocol');
  }
  
  return url;
}
