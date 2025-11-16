ARG NODE_VERSION=20

# Builder stage
FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package files
COPY package*.json ./
COPY packages/auth-sdk/package*.json ./packages/auth-sdk/

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build internal package and app
RUN npm run build

# Runner stage
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install curl and jq for Authentik setup script
RUN apk add --no-cache curl jq bash

# Copy built internal package
COPY --from=builder --chown=node:node /app/packages/auth-sdk/dist ./packages/auth-sdk/dist
COPY --from=builder --chown=node:node /app/packages/auth-sdk/package.json ./packages/auth-sdk/

# Copy Next.js standalone build
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# Copy setup scripts
COPY --chown=node:node scripts/setup-authentik.sh /app/scripts/setup-authentik.sh
COPY --chown=node:node scripts/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/scripts/setup-authentik.sh /app/entrypoint.sh

USER node

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "server.js"]
