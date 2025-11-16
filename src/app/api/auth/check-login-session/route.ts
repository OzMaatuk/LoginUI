import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const sessionId = request.cookies.get('login_session')?.value;
  
  if (!sessionId) {
    return NextResponse.json({ session: null }, { status: 404 });
  }

  const session = await getSession(sessionId);
  return NextResponse.json(session || { session: null });
}
