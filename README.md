# Centralized SSO Login Service

A secure, centralized authentication service built with Next.js that acts as a proxy between client applications and Authentik OIDC provider. This service enables single sign-on (SSO) across multiple applications with a unified login experience.

## Features

- 🔐 **Centralized Authentication** - Single login service for multiple client apps
- 🛡️ **Security First** - CSRF protection, rate limiting, input validation, security headers
- 🚀 **Easy Integration** - Simple React SDK for client apps
- 📦 **Session Management** - Redis-based server-side sessions
- 🔄 **OIDC Support** - Integrates with Authentik (or any OIDC provider)
- 🎯 **Type Safe** - Full TypeScript support
- 🧪 **Tested** - Integration tests included

## Architecture

```
┌─────────────┐
│ Client App  │ ──1. Redirect to /api/auth/initiate──┐
└─────────────┘                                       │
                                                      ↓
                                          ┌─────────────────────┐
                                          │  Login Service      │
                                          │  ┌───────────────┐  │
                                          │  │ App Registry  │  │ ← 2. Validate
                                          │  └───────────────┘  │
                                          │  ┌───────────────┐  │
                                          │  │ Redis Session │  │ ← 3. Store
                                          │  └───────────────┘  │
                                          └──────────┬──────────┘
                                                     │ 4. Redirect
                                                     ↓
                                          ┌─────────────┐
                                          │ Login Page  │
                                          └──────┬──────┘
                                                 │ 5. Authenticate
                                                 ↓
                                          ┌─────────────┐
                                          │  Authentik  │
                                          └──────┬──────┘
                                                 │ 6. OIDC Callback
                                                 ↓
                                          ┌─────────────────────┐
                                          │  Login Service      │
                                          └──────┬──────────────┘
                                                 │ 7. Redirect
                                                 ↓
┌─────────────┐
│ Client App  │ ← 8. Session Established
└─────────────┘
```

## Quick Start

### 1. Installation

```bash
# Install dependencies
npm install

# Build client SDK
cd packages/auth-sdk
npm install
npm run build
cd ../..
```

### 2. Environment Setup

Copy `.env.example` to `.env` and configure:

```env
# Required
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_LOGIN_URL=http://localhost:8000
AUTHENTIK_ISSUER=http://localhost:9000/application/o/sso-login/
AUTHENTIK_CLIENT_ID=your-client-id
AUTHENTIK_CLIENT_SECRET=your-client-secret
AUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# Optional (for rate limiting)
UPSTASH_REDIS_URL=your-upstash-url
UPSTASH_REDIS_TOKEN=your-upstash-token
```

Generate secrets:
```bash
openssl rand -base64 32
```

### 3. Start Services

```bash
docker-compose up -d
```

This starts:
- Authentik (OIDC provider)
- PostgreSQL (Authentik database)
- Redis (Session storage)
- Login Service (This application)

### 4. Register Client Apps

Edit `src/lib/app-registry.ts`:

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

### 5. Test

```bash
npm test
```

## Client App Integration

### Step 1: Install SDK

```bash
npm install @company/auth
```

### Step 2: Wrap Your Application

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

### Step 3: Create Callback Page

```tsx
// app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/');
  }, [router]);

  return <div>Completing login...</div>;
}
```

### Step 4: Use in Components

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
      <p>Email: {user.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## API Reference

### Initiate Login

```
GET /api/auth/initiate?app_id={appId}&return_url={returnUrl}
```

Starts the login flow for an external application.

**Parameters:**
- `app_id` - Registered application ID
- `return_url` - Callback URL (must be whitelisted)

**Response:**
- `302` - Redirect to login page with session cookie
- `400` - Invalid parameters
- `429` - Rate limit exceeded

### Check Session

```
GET /api/auth/session
```

Returns the current authenticated user.

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

### Logout

```
POST /api/auth/logout
```

Logs out the current user.

**Response:**
```json
{
  "success": true
}
```

## Project Structure

```
.
├── src/
│   ├── app/
│   │   ├── api/auth/              # Auth API endpoints
│   │   │   ├── initiate/          # Start external app login
│   │   │   ├── session/           # Session check
│   │   │   ├── logout/            # Logout
│   │   │   └── check-login-session/
│   │   ├── login/                 # Login page
│   │   └── profile/               # User profile
│   ├── lib/
│   │   ├── app-registry.ts        # Client app configuration
│   │   ├── redis.ts               # Session storage
│   │   ├── rate-limit.ts          # Rate limiting
│   │   └── auth-utils.ts          # Auth utilities
│   ├── types/
│   │   └── auth.ts                # TypeScript types
│   └── auth.ts                    # NextAuth configuration
├── packages/
│   └── auth-sdk/                  # Client SDK
│       ├── src/
│       │   ├── AuthProvider.tsx   # React provider
│       │   └── index.ts
│       └── package.json
├── tests/
│   └── integration/               # Integration tests
├── docs/
│   ├── MIGRATION_GUIDE.md         # Migration documentation
│   ├── CLIENT_INTEGRATION.md      # Client integration guide
│   └── DEPLOYMENT_CHECKLIST.md    # Deployment guide
└── docker-compose.yml             # Service orchestration
```

## Security Features

- ✅ **CSRF Protection** - State parameter validation
- ✅ **URL Validation** - Whitelist-based redirect validation
- ✅ **Origin Validation** - CORS protection
- ✅ **Rate Limiting** - 10 requests per minute (configurable)
- ✅ **Security Headers** - X-Frame-Options, CSP, HSTS
- ✅ **HttpOnly Cookies** - Prevents XSS attacks
- ✅ **Session Expiration** - 10-minute TTL for login flows
- ✅ **Input Sanitization** - URL and parameter validation
- ✅ **HTTPS Enforcement** - Production-ready security

## Common Patterns

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

### API Route Protection

```tsx
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const loginUrl = process.env.NEXT_PUBLIC_LOGIN_URL!;
  
  const response = await fetch(`${loginUrl}/api/auth/session`, {
    headers: {
      cookie: request.headers.get('cookie') || '',
    },
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { user } = await response.json();
  
  return NextResponse.json({ data: 'protected', user });
}
```

## Testing

### Run Integration Tests

```bash
npm test
```

### Manual API Testing

```bash
# Test initiate endpoint
curl "http://localhost:8000/api/auth/initiate?app_id=app1&return_url=http://localhost:3001/auth/callback"

# Test session endpoint
curl http://localhost:8000/api/auth/session

# Test logout
curl -X POST http://localhost:8000/api/auth/logout
```

## Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f sso-login

# Restart login service
docker-compose restart sso-login

# Check service status
docker-compose ps
```

## Redis Management

```bash
# Connect to Redis
redis-cli

# List all sessions
KEYS session:*

# Get session data
GET session:SESSION_ID

# Delete specific session
DEL session:SESSION_ID

# Clear all sessions
FLUSHDB

# Check memory usage
INFO memory
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Session not persisting | Check cookie settings, verify HTTPS in production |
| CORS errors | Add origin to `allowedOrigins` in app registry |
| Redirect loop | Verify callback page doesn't trigger another login |
| Redis connection failed | Check `REDIS_URL`, ensure Redis is running |
| Rate limit errors | Configure Upstash or disable rate limiting |
| Authentik connection failed | Verify `AUTHENTIK_ISSUER` and credentials |

## Deployment

### Production Checklist

- [ ] Enable HTTPS
- [ ] Set `NODE_ENV=production`
- [ ] Configure production URLs in app registry
- [ ] Set secure cookie flags
- [ ] Enable rate limiting with Upstash
- [ ] Configure monitoring and logging
- [ ] Set up Redis backups
- [ ] Rotate secrets regularly

### Environment Variables (Production)

```env
NODE_ENV=production
REDIS_URL=redis://production-redis:6379
NEXT_PUBLIC_LOGIN_URL=https://login.company.com
AUTHENTIK_ISSUER=https://auth.company.com/application/o/sso-login/
AUTHENTIK_CLIENT_ID=production-client-id
AUTHENTIK_CLIENT_SECRET=production-secret
AUTH_SECRET=production-secret-32-chars
NEXTAUTH_SECRET=production-secret-32-chars
UPSTASH_REDIS_URL=https://production.upstash.io
UPSTASH_REDIS_TOKEN=production-token
```

See `docs/DEPLOYMENT_CHECKLIST.md` for complete deployment guide.

## Documentation

- **[Getting Started](docs/GETTING_STARTED.md)** - Installation and setup guide
- **[Architecture](docs/ARCHITECTURE.md)** - System design and data flow
- **[Client Integration](docs/CLIENT_INTEGRATION.md)** - Integrate your apps with the SDK
- **[OTP Integration](docs/OTP_INTEGRATION.md)** - Configure external OTP service
- **[SDK Reference](packages/auth-sdk/README.md)** - Client SDK API documentation

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Authentication:** NextAuth.js v5 + Authentik OIDC
- **Session Storage:** Redis (ioredis)
- **Rate Limiting:** Upstash Redis (optional)
- **Language:** TypeScript
- **Testing:** Jest
- **Containerization:** Docker + Docker Compose

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

[Your License Here]

## Support

For issues or questions:
1. Check the [documentation](docs/)
2. Review [example implementations](examples/)
3. Check [integration tests](tests/)
4. Open an issue on GitHub

---

**Built with ❤️ using Next.js and Authentik**
