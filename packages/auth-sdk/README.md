# @company/auth

Client SDK for centralized authentication service.

## Installation

```bash
npm install @company/auth
```

## Usage

### 1. Wrap your application

```tsx
import { AuthProvider } from '@company/auth';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider 
          loginUrl={process.env.NEXT_PUBLIC_LOGIN_URL!}
          appId="your-app-id"
          returnUrl={process.env.NEXT_PUBLIC_URL}
        >
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 2. Create callback page

```tsx
// app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/');
  }, []);

  return <div>Completing login...</div>;
}
```

### 3. Use in components

```tsx
import { useAuth } from '@company/auth';

export default function Dashboard() {
  const { user, isLoading, login, logout } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  
  if (!user) {
    return <button onClick={login}>Login</button>;
  }

  return (
    <div>
      <h1>Welcome {user.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Configuration

Register your app in the login service's `app-registry.ts`:

```typescript
{
  appId: 'your-app-id',
  name: 'Your App Name',
  allowedRedirectUrls: [
    'https://yourapp.com/auth/callback',
    'http://localhost:3001/auth/callback'
  ],
  allowedOrigins: ['https://yourapp.com', 'http://localhost:3001']
}
```
