# SSO Login UI

A modern, minimal Next.js 14 frontend application for SSO authentication with support for email/password, OTP, and SSO login methods.

## Features

- **Multiple Authentication Methods**
  - Email/Password login
  - One-Time Password (OTP) via email
  - Single Sign-On (SSO) integration
- **Modern Tech Stack**
  - Next.js 14 with App Router
  - TypeScript for type safety
  - Tailwind CSS + shadcn/ui components
  - React Hook Form + Zod validation
  - TanStack Query for API state management
  - Zustand for UI state
- **Security Best Practices**
  - httpOnly cookies for token storage (configurable)
  - Secure session management
  - Input validation and sanitization
  - HTTPS-ready configuration

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Backend SSO Login Service running

### Development Container (Recommended)

This project includes a devcontainer configuration for consistent development environments:

1. Install [Docker](https://www.docker.com/products/docker-desktop) and [VS Code](https://code.visualstudio.com/)
2. Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
3. Open the project in VS Code
4. Click "Reopen in Container" when prompted (or use Command Palette: `Dev Containers: Reopen in Container`)

The devcontainer will automatically:

- Set up Node.js 20
- Install all dependencies
- Configure VS Code extensions (ESLint, Prettier, Tailwind CSS IntelliSense)
- Forward port 8000 for the dev server
- Copy `.env.example` to `.env.local`

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Create environment configuration:

```bash
cp .env.example .env.local
```

3. Configure your environment variables in `.env.local`:

```env
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3002
NEXT_PUBLIC_API_VERSION=v1

# Application Configuration
NEXT_PUBLIC_APP_NAME=SSO Login
NEXT_PUBLIC_APP_DESCRIPTION=Secure Single Sign-On Authentication

# Theme Colors (HSL format)
NEXT_PUBLIC_PRIMARY_COLOR=222.2 47.4% 11.2%
NEXT_PUBLIC_SECONDARY_COLOR=210 40% 96.1%

# Session Configuration
NEXT_PUBLIC_TOKEN_STORAGE=cookie
NEXT_PUBLIC_SESSION_TIMEOUT=3600000
```

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:8000](http://localhost:8000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── login/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx      # Email/password login
│   │   │   └── OTPForm.tsx        # OTP authentication
│   │   └── page.tsx               # Login page
│   ├── profile/
│   │   └── page.tsx               # User profile page
│   ├── callback/
│   │   └── page.tsx               # SSO callback handler
│   ├── layout.tsx                 # Root layout
│   └── providers.tsx              # React Query & Toast providers
├── components/
│   └── ui/                        # Reusable UI components
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Label.tsx
│       └── Card.tsx
├── hooks/
│   ├── useLogin.ts                # Login mutation hook
│   ├── useOTP.ts                  # OTP hooks
│   └── useProfile.ts              # Profile query hook
├── lib/
│   ├── api.ts                     # Axios API client
│   ├── auth.ts                    # Auth utilities
│   └── config.ts                  # App configuration
├── store/
│   └── useAuthStore.ts            # Zustand auth store
├── types/
│   └── auth.ts                    # TypeScript types
├── utils/
│   └── cn.ts                      # Class name utility
└── styles/
    └── globals.css                # Global styles
```

## Backend Integration

### API Endpoints Expected

The frontend expects the following backend endpoints:

- `POST /api/v1/auth/login` - Email/password authentication
- `POST /api/v1/auth/otp/request` - Request OTP
- `POST /api/v1/auth/otp/verify` - Verify OTP
- `GET /api/v1/auth/sso` - SSO redirect endpoint
- `GET /api/v1/auth/profile` - Get user profile

### Authentication Flow

1. **Password Login**: User submits email/password → Backend returns JWT token
2. **OTP Login**: User requests OTP → Enters code → Backend verifies and returns token
3. **SSO Login**: User redirects to SSO provider → Returns to `/callback` with token

### Token Storage

Tokens are stored using one of two methods (configured via `NEXT_PUBLIC_TOKEN_STORAGE`):

- `cookie` (default): httpOnly cookies for enhanced security
- `localStorage`: Browser localStorage as fallback

## Environment Variables

| Variable                      | Description                                       | Default                                |
| ----------------------------- | ------------------------------------------------- | -------------------------------------- |
| `NEXT_PUBLIC_API_URL`         | Backend API base URL                              | `http://localhost:3002`                |
| `NEXT_PUBLIC_API_VERSION`     | API version                                       | `v1`                                   |
| `NEXT_PUBLIC_APP_NAME`        | Application name                                  | `SSO Login`                            |
| `NEXT_PUBLIC_APP_DESCRIPTION` | App description                                   | `Secure Single Sign-On Authentication` |
| `NEXT_PUBLIC_TOKEN_STORAGE`   | Token storage method (`cookie` or `localStorage`) | `cookie`                               |
| `NEXT_PUBLIC_SESSION_TIMEOUT` | Session timeout in milliseconds                   | `3600000` (1 hour)                     |

## Customization

### Theme Colors

Modify theme colors in `src/styles/globals.css` or via environment variables. The app uses CSS variables for easy theming.

### Adding New Features

The architecture is designed for easy extension:

- Add new pages in `src/app/`
- Create reusable components in `src/components/`
- Add API hooks in `src/hooks/`
- Extend types in `src/types/`

## Security Considerations

- All API requests include CSRF protection
- Tokens are stored securely (httpOnly cookies recommended)
- Input validation on both client and server
- Automatic token refresh on 401 responses
- HTTPS enforced in production

## Deployment

### Vercel (Recommended)

```bash
vercel deploy
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables in Production

Ensure all `NEXT_PUBLIC_*` variables are set in your deployment platform.

## Code Quality

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```

## Troubleshooting

### CORS Issues

Ensure your backend allows requests from your frontend domain:

```python
# Backend CORS configuration example
origins = [
    "http://localhost:8000",
    "https://yourdomain.com"
]
```

### Token Not Persisting

Check `NEXT_PUBLIC_TOKEN_STORAGE` setting and browser cookie settings.

### SSO Callback Fails

Verify the backend SSO redirect URL matches your frontend callback route (`/callback`).

## License

MIT

## Support

For issues or questions, please open an issue in the repository.
