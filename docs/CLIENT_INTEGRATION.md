# Client App Integration

This guide shows how to integrate your application with the centralized login service using the `@company/auth` SDK.

## Prerequisites

- Login service running (see [GETTING_STARTED.md](GETTING_STARTED.md))
- Node.js application (Next.js, React, etc.)

## Integration Steps

### 1. Register Your App

Edit `src/lib/app-registry.ts` in the login service:

```typescript
const apps: Record<string, AppConfig> = {
  myapp: {
    appId: 'myapp',
    name: 'My Application',
    allowedRedirectUrls: [
      'https://myapp.com/auth/callback',
      'http://localhost:3001/auth/callback',
    ],
    allowedOrigins: ['https://myapp.com', 'http://localhost:3001'],
  },
};
```

### 2. Install SDK

```bash
npm install @company/auth
```

### 3. Configure Environment

Create `.env.local`:

```env
NEXT_PUBLIC_LOGIN_URL=http://localhost:8000
NEXT_PUBLIC_URL=http://localhost:3001
```

### 4. Wrap Your Application

**Next.js App Router** (`app/layout.tsx`):

```tsx
import { AuthProvider } from '@company/auth';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider 
          loginUrl={process.env.NEXT_PUBLIC_LOGIN_URL!}
          appId="myapp"
          returnUrl={process.env.NEXT_PUBLIC_URL}
        >
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

**Next.js Pages Router** (`pages/_app.tsx`):

```tsx
import { AuthProvider } from '@company/auth';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider 
      loginUrl={process.env.NEXT_PUBLIC_LOGIN_URL!}
      appId="myapp"
    >
      <Component {...pageProps} />
    </AuthProvider>
  );
}
```

### 5. Create Callback Page

**App Router** (`app/auth/callback/page.tsx`):

```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CallbackPage() {
  const router = useRouter();
  useEffect(() => { router.push('/'); }, [router]);
  return <div>Completing login...</div>;
}
```

**Pages Router** (`pages/auth/callback.tsx`):

```tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CallbackPage() {
  const router = useRouter();
  useEffect(() => { router.push('/'); }, [router]);
  return <div>Completing login...</div>;
}
```

### 6. Use in Components

```tsx
'use client';

import { useAuth } from '@company/auth';

export default function Dashboard() {
  const { user, isLoading, login, logout } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <button onClick={login}>Login</button>;

  return (
    <div>
      <h1>Welcome {user.name}</h1>
      <p>{user.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Advanced Usage

### Protected Routes (Middleware)

```tsx
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has('authjs.session-token');
  if (!hasSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*'],
};
```

### Protected API Routes

```tsx
// app/api/protected/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_LOGIN_URL}/api/auth/session`, {
    headers: { cookie: request.headers.get('cookie') || '' },
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { user } = await response.json();
  return NextResponse.json({ data: 'protected', user });
}
```

## Testing

1. Start login service: `docker-compose up -d`
2. Start your app: `npm run dev`
3. Navigate to http://localhost:3001
4. Click login → redirects to login service
5. Authenticate → returns to your app
6. User info displayed

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Session not persisting | Check cookies in DevTools, verify same domain or CORS config |
| CORS errors | Add origin to `allowedOrigins` in app registry |
| Redirect loop | Verify callback page doesn't trigger login, check `allowedRedirectUrls` |
| 401 Unauthorized | Ensure session cookie is sent with requests |

## Production Checklist

- [ ] App registered in `src/lib/app-registry.ts`
- [ ] Environment variables configured
- [ ] HTTPS enabled
- [ ] Secure cookie flags set
- [ ] CORS origins whitelisted
- [ ] Redirect URLs whitelisted
- [ ] Error handling implemented
- [ ] Logout flow tested
