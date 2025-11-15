# Architecture

## Overview

This is a centralized authentication service that acts as a secure proxy between client applications and Authentik OIDC provider. **Authentik remains the token issuer** - this app provides a branded UI and simplified integration layer.

## System Architecture

```
┌─────────────────────────────────────────┐
│         Client Applications             │
│  ┌────────┐  ┌────────┐  ┌────────┐    │
│  │ App 1  │  │ App 2  │  │ App N  │    │
│  │@co/auth│  │@co/auth│  │@co/auth│    │
│  └───┬────┘  └───┬────┘  └───┬────┘    │
└──────┼───────────┼───────────┼─────────┘
       │           │           │
       └───────────┼───────────┘
                   ↓
       ┌───────────────────────┐
       │   Login Service       │
       │  - Custom UI          │
       │  - Session cookies    │
       │  - App routing        │
       │  - Security layer     │
       └───────────┬───────────┘
                   ↓
           ┌──────────────┐
           │  Authentik   │
           │ (OIDC IdP)   │
           └──────────────┘
```

## Components

### Login Service (This App)

**Purpose**: Secure proxy with custom UI

**Responsibilities**:
- Custom branded login interface
- OIDC flow orchestration with Authentik
- Server-side token storage
- Session cookie management
- Client app routing and validation

**NOT responsible for**:
- Token issuance (Authentik handles this)
- User storage (Authentik manages users)
- MFA/policies (Authentik enforces these)

### Authentik

**Purpose**: Identity Provider (IdP)

**Responsibilities**:
- User authentication
- Token issuance (access, refresh, ID tokens)
- MFA enforcement
- User management
- Security policies

### Client Applications

**Purpose**: Business applications

**Integration**: Via `@company/auth` SDK (~50 LOC)

## Authentication Flow

```
1. User visits App 1 (no session)
   ↓
2. App 1 redirects to Login Service
   GET /api/auth/initiate?app_id=app1&return_url=...
   ↓
3. Login Service shows branded UI
   ↓
4. User chooses authentication method
   ↓
5. Login Service redirects to Authentik (OIDC)
   ↓
6. Authentik validates credentials, enforces MFA
   ↓
7. Authentik issues tokens, redirects to Login Service
   ↓
8. Login Service stores tokens server-side
   ↓
9. Login Service sets HttpOnly session cookie
   ↓
10. Login Service redirects to App 1 callback
    ↓
11. App 1 validates session, renders dashboard
```

## API Surface

### For Client Apps

```
GET  /api/auth/initiate?app_id={id}&return_url={url}
     → Starts login flow, returns session cookie

GET  /api/auth/session
     → Returns user object from session

POST /api/auth/logout
     → Clears session, revokes tokens
```

### Client SDK

```typescript
import { AuthProvider, useAuth } from '@company/auth';

// Wrap app
<AuthProvider loginUrl="https://login.company.com" appId="app1">
  {children}
</AuthProvider>

// Use in components
const { user, login, logout } = useAuth();
```

## Security Model

### Token Storage
- Authentik tokens stored server-side (Redis)
- Never exposed to client applications
- Encrypted at rest

### Session Management
- HttpOnly cookies prevent XSS
- Secure flag enforces HTTPS
- SameSite=Lax prevents CSRF
- 1-hour default expiration

### URL Validation
- Whitelist-based redirect validation
- Per-app allowed origins
- CSRF state parameter

### Rate Limiting
- 10 requests/minute per IP (configurable)
- Upstash Redis for distributed limiting
- Prevents brute force attacks

## Data Flow

### Login Flow
```
Client App → Login Service → Authentik
                ↓
            Redis (session)
                ↓
Client App ← Session Cookie
```

### Session Check
```
Client App → Login Service
                ↓
            Redis (lookup)
                ↓
Client App ← User Object
```

### Logout Flow
```
Client App → Login Service
                ↓
            Redis (delete)
                ↓
            Authentik (revoke)
                ↓
Client App ← Success
```

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Auth Library**: NextAuth.js v5
- **Session Store**: Redis (ioredis)
- **Rate Limiting**: Upstash Redis
- **IdP**: Authentik (OIDC)
- **Language**: TypeScript
- **Container**: Docker + Docker Compose

## Scalability

### Horizontal Scaling
- Stateless application design
- Redis for shared session state
- Load balancer compatible

### Session Storage
- Redis cluster for high availability
- Session replication across nodes
- Automatic failover

### Performance
- Server-side session validation
- Minimal client-side JavaScript
- CDN-ready static assets

## Integration Benefits

### For Client Apps
- **5-minute integration** - Install SDK, wrap app, done
- **No token management** - Login service handles complexity
- **Consistent UX** - Same login experience across apps
- **Security by default** - Best practices built-in

### For Platform
- **Centralized control** - One place to update auth logic
- **Audit trail** - All logins tracked centrally
- **Easy onboarding** - Register app, get credentials
- **Tenant routing** - Support multi-tenant scenarios

## Future Enhancements

- Multi-tenant support
- Social login providers
- Passwordless authentication
- Session analytics dashboard
- Advanced MFA options
