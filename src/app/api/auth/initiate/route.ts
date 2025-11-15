import { NextRequest, NextResponse } from 'next/server';
import { getApp, validateRedirectUrl } from '@/lib/app-registry';
import { setSession } from '@/lib/redis';
import { ratelimit } from '@/lib/rate-limit';
import { generateState, generateSessionId, sanitizeReturnUrl } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  // Rate limiting
  if (ratelimit) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                request.headers.get('x-real-ip') || 
                'anonymous';
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
  }

  const { searchParams } = request.nextUrl;
  const appId = searchParams.get('app_id');
  const returnUrl = searchParams.get('return_url');

  // Validate parameters
  if (!appId || !returnUrl) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  // Validate app
  const app = getApp(appId);
  if (!app) {
    return NextResponse.json({ error: 'Invalid app_id' }, { status: 400 });
  }

  // Sanitize and validate return URL
  try {
    sanitizeReturnUrl(returnUrl);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid return_url format' }, { status: 400 });
  }

  // Validate return URL against whitelist
  if (!validateRedirectUrl(appId, returnUrl)) {
    return NextResponse.json({ error: 'Invalid return_url' }, { status: 400 });
  }

  // Generate state for CSRF protection
  const state = generateState();
  const sessionId = generateSessionId();

  // Store state and return URL in session (10 min TTL)
  await setSession(sessionId, { appId, returnUrl, state }, 600);

  // Log the action
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
              request.headers.get('x-real-ip') || 
              'unknown';
  console.log('[AUTH]', {
    action: 'initiate',
    appId,
    timestamp: new Date().toISOString(),
    ip,
  });

  // Redirect to login page with session cookie
  const loginUrl = new URL('/login', request.url);
  const response = NextResponse.redirect(loginUrl);
  
  response.cookies.set('login_session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return response;
}
