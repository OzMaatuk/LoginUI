# SSO Login with Authentik & OTP

A modern Next.js authentication application featuring Authentik SSO integration and flexible OTP delivery through external services.

## Features

- **Authentik SSO**: OpenID Connect (OIDC) authentication
- **OTP Authentication**: Email/SMS OTP with configurable providers (mock or external service)
- **Session Management**: Secure JWT-based sessions via NextAuth.js v5
- **Modern Stack**: React 19, Next.js 15, TypeScript, Tailwind CSS v4
- **Docker Support**: Full containerized setup with Authentik, PostgreSQL, and Redis

## Quick Start

### Option 1: Docker (Recommended)

The easiest way to get started with Authentik included:

```bash
# Generate required secrets
openssl rand -base64 32  # Use for AUTH_SECRET
openssl rand -base64 32  # Use for AUTHENTIK_SECRET_KEY
openssl rand -base64 32  # Use for PG_PASS

# Update .env with generated secrets
# Start all services (Authentik + PostgreSQL + Redis + App)
docker-compose up -d

# Access Authentik at http://localhost:9000
# Access App at http://localhost:8000
```

See [docs/DOCKER_SETUP.md](docs/DOCKER_SETUP.md) for detailed Docker instructions.

### Option 2: Local Development

If you have an existing Authentik instance:

**1. Install dependencies:**
```bash
npm install
```

**2. Configure environment:**
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Authentik Configuration
AUTHENTIK_ISSUER=https://your-authentik.com/application/o/your-app/
AUTHENTIK_CLIENT_ID=your-client-id
AUTHENTIK_CLIENT_SECRET=your-client-secret

# NextAuth Configuration
AUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:8000

# OTP Configuration
OTP_PROVIDER=mock  # or "external" for production
```

**3. Set up Authentik OAuth2 Provider:**
- Redirect URI: `http://localhost:8000/api/auth/callback/authentik`
- Scopes: `openid`, `email`, `profile`
- Client Type: Confidential

**4. Run the application:**
```bash
npm run dev
```

Visit http://localhost:8000

## OTP Integration

The application supports two OTP providers:

### Mock Provider (Development)
```env
OTP_PROVIDER=mock
```
OTP codes are logged to the console for easy testing:
```
[OTP Mock] Sending OTP to user@example.com via email: 123456
```

### External Provider (Production)
```env
OTP_PROVIDER=external
OTP_EXTERNAL_SERVICE_URL=https://your-otp-service.com/send
```

Your external service must implement this API contract:

**POST /send**
```json
{
  "recipient": "user@example.com",
  "code": "123456",
  "channel": "email"
}
```

**Response (200 OK):**
```json
{
  "status": "sent",
  "messageId": "optional-id"
}
```

See [docs/OTP_INTEGRATION.md](docs/OTP_INTEGRATION.md) for complete integration guide with examples.

## How It Works

### Authentik SSO Flow
1. User clicks "Login with Authentik"
2. Redirected to Authentik for authentication
3. After successful login, redirected to `/api/auth/callback/authentik`
4. NextAuth creates session and redirects to `/profile`

### OTP Flow
1. User enters email/phone on login page
2. App sends OTP via configured provider
3. User enters 6-digit code
4. Upon verification, session created (can be integrated with Authentik MFA)

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts  # NextAuth handlers
│   │   │   └── otp/send/route.ts            # OTP API endpoint
│   │   ├── login/                           # Login page
│   │   │   └── components/OTPForm.tsx       # OTP form component
│   │   ├── profile/                         # Protected profile page
│   │   └── providers.tsx                    # SessionProvider wrapper
│   ├── auth.ts                              # NextAuth config (Authentik OIDC)
│   ├── proxy.ts                             # Middleware logic
│   └── types/next-auth.d.ts                 # TypeScript definitions
├── middleware.ts                            # Route protection
├── docs/
│   ├── DOCKER_SETUP.md                      # Docker deployment guide
│   └── OTP_INTEGRATION.md                   # OTP service integration
├── docker-compose.yml                       # Production setup
└── docker-compose.dev.yml                   # Development setup
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AUTHENTIK_ISSUER` | Yes | - | Authentik OIDC issuer URL |
| `AUTHENTIK_CLIENT_ID` | Yes | - | OAuth2 client ID |
| `AUTHENTIK_CLIENT_SECRET` | Yes | - | OAuth2 client secret |
| `AUTH_SECRET` | Yes | - | NextAuth encryption key |
| `NEXTAUTH_URL` | Yes | `http://localhost:8000` | Application URL |
| `OTP_PROVIDER` | No | `mock` | `mock` or `external` |
| `OTP_EXTERNAL_SERVICE_URL` | No | - | External OTP service endpoint |
| `PORT` | No | `8000` | Application port |

Generate secrets with: `openssl rand -base64 32`

## Security Best Practices

- Use HTTPS in production
- Keep secrets secure (never commit `.env.local`)
- Implement rate limiting for OTP endpoints
- Configure CORS properly for external OTP services
- Enable Authentik MFA for additional security
- Review and update dependencies regularly

## Testing

Run the test suite:
```bash
npm test              # Run once
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

## Troubleshooting

**Authentik connection fails:**
- Verify issuer URL format: `https://authentik.com/application/o/slug/`
- Check redirect URI matches exactly in Authentik provider
- Ensure scopes include `openid`, `email`, `profile`

**OTP not sending:**
- Check `OTP_PROVIDER` is set correctly
- Verify external service URL is accessible
- Review console/logs for error messages
- Test with mock provider first

**Session issues:**
- Clear browser cookies and try again
- Verify `AUTH_SECRET` is set and matches
- Check `NEXTAUTH_URL` matches your domain

## Documentation

- [Docker Setup Guide](docs/DOCKER_SETUP.md) - Complete Docker deployment instructions
- [OTP Integration Guide](docs/OTP_INTEGRATION.md) - External OTP service integration with examples

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Auth**: NextAuth.js v5 (beta)
- **UI**: React 19, Tailwind CSS v4
- **Forms**: React Hook Form + Zod validation
- **State**: TanStack Query (React Query)
- **Testing**: Jest + React Testing Library
- **Container**: Docker + Docker Compose

## License

MIT
