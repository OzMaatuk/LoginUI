# Centralized Authentication: Benefits & Implementation Comparison

## Overview

This document compares two approaches for authenticating multiple applications:
1. **Current Approach**: Each app implements its own auth with Authentik
2. **Centralized Approach**: This app becomes an OAuth2 provider for all apps

---

## Approach 1: Each App Uses Authentik Directly (Current)

### Architecture
```
┌─────────┐     ┌─────────┐     ┌─────────┐
│  App 1  │     │  App 2  │     │  App 3  │
└────┬────┘     └────┬────┘     └────┬────┘
     │               │               │
     └───────────────┼───────────────┘
                     │
                ┌────▼────┐
                │Authentik│ (Identity Provider)
                └─────────┘
```

### Implementation in Each App

**App 1 Code:**
```typescript
// app1/src/auth.ts
import NextAuth from "next-auth";

export const { handlers, auth } = NextAuth({
  providers: [
    {
      id: "authentik",
      type: "oidc",
      issuer: "https://authentik.company.com/application/o/app1/",
      clientId: process.env.AUTHENTIK_CLIENT_ID,
      clientSecret: process.env.AUTHENTIK_CLIENT_SECRET,
    }
  ],
  session: { strategy: "jwt" }
});
```

**App 1 Environment:**
```env
AUTHENTIK_CLIENT_ID=app1-client-id
AUTHENTIK_CLIENT_SECRET=app1-secret-xyz
AUTHENTIK_ISSUER=https://authentik.company.com/application/o/app1/
AUTH_SECRET=random-secret-for-app1
```

**App 1 Login Page:**
```typescript
// app1/src/app/login/page.tsx
import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <button onClick={() => signIn("authentik")}>
      Login with Authentik
    </button>
  );
}
```

**App 2 Code:** (Same pattern, different credentials)
```typescript
// app2/src/auth.ts - DUPLICATE CODE
import NextAuth from "next-auth";

export const { handlers, auth } = NextAuth({
  providers: [
    {
      id: "authentik",
      type: "oidc",
      issuer: "https://authentik.company.com/application/o/app2/",
      clientId: process.env.AUTHENTIK_CLIENT_ID,
      clientSecret: process.env.AUTHENTIK_CLIENT_SECRET,
    }
  ],
  session: { strategy: "jwt" }
});
```

### Pros ✅
- **Battle-tested**: Authentik is production-ready
- **Feature-rich**: MFA, user management, admin UI
- **Direct integration**: No middleman
- **Independent**: Each app controls its own auth

### Cons ❌
- **Duplicate code**: Every app implements the same auth logic
- **Multiple configs**: Each app needs Authentik credentials
- **Maintenance burden**: Update auth in 10 apps = 10 PRs
- **Inconsistent UX**: Each app might have different login flows
- **Setup overhead**: New app = configure Authentik provider + implement auth

---

## Approach 2: Centralized Login App (Proposed)

### Architecture
```
┌─────────┐     ┌─────────┐     ┌─────────┐
│  App 1  │     │  App 2  │     │  App 3  │
└────┬────┘     └────┬────┘     └────┬────┘
     │               │               │
     └───────────────┼───────────────┘
                     │
              ┌──────▼──────┐
              │ Login App   │ (OAuth2 Provider)
              │ (This App)  │
              └──────┬──────┘
                     │
                ┌────▼────┐
                │Authentik│ (Identity Provider)
                └─────────┘
```

### Implementation in Each App

**App 1 Code:**
```typescript
// app1/src/lib/auth.ts - SIMPLE!
export async function getUser(token: string) {
  const response = await fetch('https://login.company.com/api/user', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}

export function getLoginUrl(returnUrl: string) {
  return `https://login.company.com/api/oauth/authorize?` +
    `client_id=app1&` +
    `redirect_uri=${encodeURIComponent(returnUrl)}&` +
    `response_type=code&` +
    `state=${generateState()}`;
}
```

**App 1 Environment:**
```env
# That's it! Just 2 variables
LOGIN_SERVICE_URL=https://login.company.com
OAUTH_CLIENT_ID=app1
OAUTH_CLIENT_SECRET=app1-secret
```

**App 1 Login Page:**
```typescript
// app1/src/app/login/page.tsx - SUPER SIMPLE
export default function LoginPage() {
  const handleLogin = () => {
    const loginUrl = getLoginUrl(window.location.origin + '/callback');
    window.location.href = loginUrl;
  };

  return <button onClick={handleLogin}>Login</button>;
}
```

**App 1 Callback Handler:**
```typescript
// app1/src/app/callback/page.tsx
export default async function CallbackPage({ searchParams }) {
  const code = searchParams.code;
  
  // Exchange code for token
  const response = await fetch('https://login.company.com/api/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      client_id: 'app1',
      client_secret: process.env.OAUTH_CLIENT_SECRET,
      redirect_uri: window.location.origin + '/callback'
    })
  });
  
  const { access_token } = await response.json();
  
  // Store token and redirect
  cookies().set('auth_token', access_token, { httpOnly: true, secure: true });
  redirect('/dashboard');
}
```

**App 2 Code:** (Almost identical, just change client_id)
```typescript
// app2/src/lib/auth.ts - SAME CODE, different client_id
export async function getUser(token: string) {
  const response = await fetch('https://login.company.com/api/user', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}
```

### Pros ✅
- **Minimal code**: Apps need ~50 lines of code total
- **Consistent UX**: All apps have identical login experience
- **Single source of truth**: Auth logic in one place
- **Easy updates**: Fix bug once, all apps benefit
- **Fast onboarding**: New app = copy 50 lines + get credentials
- **Centralized monitoring**: See all logins in one place
- **Custom branding**: Control login page for all apps
- **Additional features**: Add OTP, MFA, etc. once for all apps

### Cons ❌
- **Single point of failure**: If login app is down, all apps affected
- **Custom maintenance**: You maintain the OAuth2 implementation
- **Initial complexity**: More work upfront to build
- **Token management**: Need to handle token refresh, expiration
- **Security responsibility**: OAuth2 must be implemented correctly

---

## Code Comparison: Adding a New App

### Approach 1: Direct Authentik (Current)

**Steps to add App 4:**
1. Configure Authentik provider (5 min)
2. Install dependencies: `npm install next-auth` (2 min)
3. Create `src/auth.ts` (~50 lines)
4. Create `src/app/api/auth/[...nextauth]/route.ts` (~10 lines)
5. Create `src/middleware.ts` (~30 lines)
6. Create login page (~50 lines)
7. Add environment variables (4 variables)
8. Test authentication flow (10 min)

**Total: ~150 lines of code, 30 minutes**

### Approach 2: Centralized Login App

**Steps to add App 4:**
1. Register app in login service (add to config)
2. Create `src/lib/auth.ts` (~30 lines)
3. Create callback handler (~20 lines)
4. Add environment variables (3 variables)
5. Test authentication flow (5 min)

**Total: ~50 lines of code, 10 minutes**

---

## Real-World Example: E-commerce Company

### Scenario
You have 5 applications:
- **Admin Dashboard** (internal)
- **Customer Portal** (external)
- **Mobile API** (backend)
- **Analytics Dashboard** (internal)
- **Support Tool** (internal)

### Approach 1: Each App with Authentik

**Total Implementation:**
- 5 apps × 150 lines = **750 lines of auth code**
- 5 apps × 4 env vars = **20 environment variables**
- 5 Authentik providers to configure
- 5 separate login pages (might look different)

**Maintenance:**
- Bug in session handling? Fix in 5 places
- Want to add MFA? Implement in 5 apps
- New security requirement? Update 5 codebases

### Approach 2: Centralized Login App

**Total Implementation:**
- 1 login app (OAuth2 provider) = **500 lines** (one-time)
- 5 apps × 50 lines = **250 lines of auth code**
- 5 apps × 3 env vars = **15 environment variables**
- 1 login page (consistent across all apps)

**Maintenance:**
- Bug in session handling? Fix once in login app
- Want to add MFA? Implement once, all apps get it
- New security requirement? Update 1 codebase

---

## Security Comparison

### Approach 1: Direct Authentik
```
✅ Authentik handles all security
✅ Industry-standard OIDC
✅ Regular security updates from Authentik team
⚠️ Each app must implement security correctly
⚠️ Secrets stored in multiple places
```

### Approach 2: Centralized Login App
```
✅ Single point for security updates
✅ Centralized secret management
✅ Consistent security policies
⚠️ You must implement OAuth2 correctly
⚠️ Single point of failure
⚠️ Requires security expertise
```

---

## Token Flow Examples

### Approach 1: Direct Authentik
```
User → App 1 → Authentik → App 1
                  ↓
              JWT Token (from Authentik)
```

### Approach 2: Centralized Login App
```
User → App 1 → Login App → Authentik → Login App → App 1
                              ↓
                          JWT Token (from Login App)
```

---

## My Recommendation

### Use Centralized Login App IF:
- ✅ You have 3+ applications
- ✅ You want consistent UX across apps
- ✅ You have security expertise on team
- ✅ You want to add custom auth features (OTP, custom MFA)
- ✅ You want centralized monitoring/analytics
- ✅ You're building a platform with many microservices

### Use Direct Authentik IF:
- ✅ You have 1-2 applications
- ✅ You want minimal maintenance
- ✅ You need Authentik's advanced features (LDAP, SAML, etc.)
- ✅ You don't want to maintain OAuth2 implementation
- ✅ Each app has different auth requirements

---

## Implementation Effort

### Centralized Login App (This Project)
**What needs to be built:**
1. OAuth2 Authorization endpoint (`/api/oauth/authorize`)
2. OAuth2 Token endpoint (`/api/oauth/token`)
3. User info endpoint (`/api/oauth/userinfo`)
4. Client registration system (database or config)
5. Token storage and validation
6. Token refresh mechanism
7. Security hardening (PKCE, state validation)
8. Documentation for client apps

**Estimated time:** 2-3 days of development + testing

**Ongoing maintenance:** Low (once stable)

---

## Decision Time

**Question 1:** How many apps will use this authentication?
- 1-2 apps → Use Authentik directly
- 3-5 apps → Centralized makes sense
- 6+ apps → Definitely centralized

**Question 2:** Do you need custom auth features?
- Just basic login → Use Authentik directly
- Custom OTP, branding, flows → Centralized

**Question 3:** Do you have security expertise?
- No → Use Authentik directly (safer)
- Yes → Centralized is fine

**Question 4:** How often do you add new apps?
- Rarely → Either approach works
- Frequently → Centralized saves time

---

## Next Steps

**If you choose Centralized Approach:**
I'll implement:
1. OAuth2 server endpoints
2. Client registration system
3. Token management
4. Example client integration
5. Security best practices
6. Documentation

**If you choose Direct Authentik:**
I'll help you:
1. Document the setup process
2. Create reusable auth templates
3. Streamline the configuration
4. Build deployment scripts

**What would you like to do?**
