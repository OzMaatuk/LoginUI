# Getting Started

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- OpenSSL (for generating secrets)

## Installation

### 1. Clone and Install

```bash
git clone <repository-url>
cd LoginUI
npm install
```

### 2. Build Client SDK

```bash
cd packages/auth-sdk
npm install
npm run build
cd ../..
```

### 3. Generate Secrets

```bash
# Generate authentication secrets
openssl rand -base64 32  # Use for AUTH_SECRET
openssl rand -base64 32  # Use for NEXTAUTH_SECRET
openssl rand -base64 32  # Use for AUTHENTIK_SECRET_KEY
openssl rand -base64 32  # Use for PG_PASS
```

### 4. Configure Environment

Copy `.env.example` to `.env` and add your secrets:

```env
# Required
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_LOGIN_URL=http://localhost:8000
AUTHENTIK_ISSUER=http://localhost:9000/application/o/sso-login/
AUTHENTIK_CLIENT_ID=your-client-id-from-authentik
AUTHENTIK_CLIENT_SECRET=your-client-secret-from-authentik
AUTH_SECRET=your-generated-secret
NEXTAUTH_SECRET=your-generated-secret
PG_PASS=your-generated-postgres-password
AUTHENTIK_SECRET_KEY=your-generated-authentik-secret

# Optional (for rate limiting)
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=

# OTP Configuration
OTP_PROVIDER=mock
```

## Running the Application

### Development Mode

**Option 1: Run everything in Docker**

```bash
docker-compose up -d
```

Access:
- Login Service: http://localhost:8000
- Authentik: http://localhost:9000

**Option 2: Run Authentik in Docker, Next.js locally**

```bash
# Start Authentik only
docker-compose -f docker-compose.dev.yml up -d

# Run Next.js locally
npm run dev
```

### Production Mode

```bash
docker-compose up -d
```

## Configure Authentik

### 1. Access Authentik

Navigate to http://localhost:9000

### 2. Get Recovery Key

```bash
docker-compose logs authentik-server | grep "Bootstrap"
```

Login with username `akadmin` and the recovery key.

### 3. Create OAuth2/OIDC Provider

1. Go to **Applications** → **Providers** → **Create**
2. Select **OAuth2/OpenID Provider**
3. Configure:
   - **Name**: `SSO Login`
   - **Authorization flow**: `default-provider-authorization-implicit-consent`
   - **Client type**: `Confidential`
   - **Redirect URIs**: `http://localhost:8000/api/auth/callback/authentik`
   - **Scopes**: `openid`, `email`, `profile`
4. Click **Finish**
5. Copy the **Client ID** and **Client Secret**

### 4. Create Application

1. Go to **Applications** → **Applications** → **Create**
2. Configure:
   - **Name**: `SSO Login`
   - **Slug**: `sso-login`
   - **Provider**: Select the provider created above
3. Click **Create**

### 5. Update Environment

Add the Client ID and Secret to your `.env`:

```env
AUTHENTIK_CLIENT_ID=your-copied-client-id
AUTHENTIK_CLIENT_SECRET=your-copied-client-secret
```

Restart the login service:

```bash
docker-compose restart sso-login
# or if running locally
npm run dev
```

## Verify Installation

### 1. Test Login Page

Navigate to http://localhost:8000/login

You should see the login interface.

### 2. Test Authentik Login

Click "Login with Authentik" and verify the OIDC flow works.

### 3. Test API Endpoints

```bash
# Test session endpoint (should return 401)
curl http://localhost:8000/api/auth/session

# Test initiate endpoint
curl "http://localhost:8000/api/auth/initiate?app_id=app1&return_url=http://localhost:3001/auth/callback"
```

### 4. Run Tests

```bash
npm test
```

## Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f sso-login

# Stop all services
docker-compose down

# Stop and remove volumes (reset everything)
docker-compose down -v

# Rebuild and restart
docker-compose build sso-login
docker-compose up -d sso-login

# Check service status
docker-compose ps
```

## Ports

| Service | Port | Description |
|---------|------|-------------|
| Login Service | 8000 | Main application |
| Authentik HTTP | 9000 | Authentik web interface |
| Authentik HTTPS | 9443 | Authentik secure interface |
| Redis | 6379 | Session storage |
| PostgreSQL | 5432 | Authentik database (dev only) |

## Troubleshooting

### Authentik Not Starting

**Check logs:**
```bash
docker-compose logs authentik-server
```

**Common issues:**
- PostgreSQL not ready: Wait 30 seconds and retry
- Port conflict: Change ports in `docker-compose.yml`

### Login Service Connection Error

**Check Authentik is running:**
```bash
docker-compose ps
```

**Verify environment variables:**
```bash
docker-compose exec sso-login env | grep AUTHENTIK
```

### Redis Connection Failed

**Check Redis is running:**
```bash
docker-compose ps redis-sessions
```

**Test connection:**
```bash
redis-cli -h localhost -p 6379 ping
```

### Session Not Persisting

**Check cookies in browser:**
- Open DevTools → Application → Cookies
- Look for `authjs.session-token`

**Verify Redis has sessions:**
```bash
redis-cli KEYS "session:*"
```

### Port Already in Use

**Find process using port:**
```bash
# Windows
netstat -ano | findstr :8000

# Linux/Mac
lsof -i :8000
```

**Change port in docker-compose.yml:**
```yaml
ports:
  - "8001:8000"  # Use 8001 instead
```

## Next Steps

1. **Register Client Apps**: Edit `src/lib/app-registry.ts`
2. **Integrate Client Apps**: See [CLIENT_INTEGRATION.md](CLIENT_INTEGRATION.md)
3. **Configure OTP**: See [OTP_INTEGRATION.md](OTP_INTEGRATION.md)
4. **Review Architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md)
5. **Deploy to Production**: See main [README.md](../README.md#deployment)

## Development Tips

### Hot Reload

When running locally with `npm run dev`, changes are automatically reloaded.

### Debug Mode

Enable debug logging:

```env
NODE_ENV=development
DEBUG=*
```

### Clear Sessions

```bash
redis-cli FLUSHDB
```

### Reset Authentik

```bash
docker-compose down -v
docker-compose up -d
```

Wait for Authentik to initialize, then reconfigure.

## Common Development Workflow

```bash
# 1. Start services
docker-compose up -d

# 2. Make changes to code
# ... edit files ...

# 3. Restart if needed
docker-compose restart sso-login

# 4. View logs
docker-compose logs -f sso-login

# 5. Test changes
npm test

# 6. Stop services
docker-compose down
```
