import { NextRequest, NextResponse } from 'next/server';
import { signOut } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    await signOut({ redirect: false });
    
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                request.headers.get('x-real-ip') || 
                'unknown';
    console.log('[AUTH]', {
      action: 'logout',
      timestamp: new Date().toISOString(),
      ip,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[AUTH] Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
