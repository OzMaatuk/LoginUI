# Docker Setup Guide

## Quick Start

### 1. Generate Secrets

```bash
# Generate AUTH_SECRET
openssl rand -base64 32

# Generate AUTHENTIK_SECRET_KEY
openssl rand -base64 32

# Generate PG_PASS
openssl rand -base64 32
```

### 2. Configure Environment

Edit `.env` file with generated secrets:

```env
PG_PASS=your-generated-postgres-password
AUTHENTIK_SECRET_KEY=your-generated-authentik-secret
AUTH_SECRET=your-generated-auth-secret
NEXTAUTH_SECRET=your-generated-auth-secret
```

### 3. Start Services

**Development (Authentik only):**
```bash
docker-compose -f docker-compose.dev.yml up -d
```

**Production (All services):**
```bash
docker-compose up -d
```

### 4. Configure Authentik

1. Access Authentik: http://localhost:9000
2. Initial login: `akadmin` / Use recovery key from logs
3. Create OAuth2/OpenID Provider:
   - Name: `SSO Login`
   - Client Type: `Confidential`
   - Redirect URIs: `http://localhost:8000/api/auth/callback/authentik`
   - Scopes: `openid`, `email`, `profile`
4. Create Application:
   - Name: `SSO Login`
   - Slug: `sso-login`
   - Provider: Select the provider created above
5. Copy Client ID and Client Secret to `.env`

### 5. Start Next.js App

**Development:**
```bash
npm run dev
```

**Production (Docker):**
```bash
docker-compose up -d sso-login
```

## Docker Compose Files

### `docker-compose.yml` (Production)
- Authentik (server + worker)
- PostgreSQL
- Redis
- SSO Login App

### `docker-compose.dev.yml` (Development)
- Authentik only (server + worker)
- PostgreSQL
- Redis
- Run Next.js locally with `npm run dev`

## Commands

```bash
# Start all services
docker-compose up -d

# Start only Authentik (dev)
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild app
docker-compose build sso-login
docker-compose up -d sso-login
```

## Ports

- `8000` - SSO Login App
- `9000` - Authentik HTTP
- `9443` - Authentik HTTPS
- `5432` - PostgreSQL (dev only)
- `6379` - Redis (dev only)

## Troubleshooting

**Get Authentik recovery key:**
```bash
docker-compose logs authentik-server | grep "Bootstrap"
```

**Reset Authentik:**
```bash
docker-compose down -v
docker-compose up -d
```

**Check app logs:**
```bash
docker-compose logs -f sso-login
```
