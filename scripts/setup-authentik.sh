#!/bin/bash
# Authentik Setup Script - Robust and Debuggable
# Run this from inside the application container
# Prerequisites: Docker services must be running (docker compose up -d)

set -euo pipefail # Exit immediately on error, unset variables, and pipe failure

# --- Configuration (Pulled from Environment Variables) ---
AUTHENTIK_URL="${AUTHENTIK_URL:-http://authentik-server:9000}"
TOKEN="${AUTHENTIK_BOOTSTRAP_TOKEN:?Error: AUTHENTIK_BOOTSTRAP_TOKEN environment variable not set}"
CALLBACK_URL="${CALLBACK_URL:-http://localhost:8000/api/auth/callback/authentik}"
MAX_RETRIES="${MAX_RETRIES:-30}"
RETRY_DELAY="${RETRY_DELAY:-5}"

echo "=== Starting Authentik Setup ==="
echo "Authentik URL: $AUTHENTIK_URL"
echo "Using Token: ${TOKEN:0:15}..."
echo ""

# Check if running inside container
if [ ! -f /.dockerenv ] && ! grep -q docker /proc/1/cgroup 2>/dev/null; then
    echo "❌ This script must be run from inside the application container"
    echo ""
    echo "To run:"
    echo "  1. Start containers: docker compose -f .devcontainer/docker-compose.dev.yml up -d"
    echo "  2. Enter container: docker exec -it sso-login-dev bash"
    echo "  3. Run script: ./scripts/setup-authentik.sh"
    exit 1
fi

# 1. Wait for Authentik API to be ready
echo "Waiting for Authentik API to be ready (may take 30-60 seconds)..."
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -sS "$AUTHENTIK_URL/api/v3/core/info/" > /dev/null 2>&1; then
        echo "✓ Authentik is ready"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "  Attempt $RETRY_COUNT/$MAX_RETRIES: Waiting..."
    sleep $RETRY_DELAY
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Authentik did not start. Check logs: docker compose logs authentik-server"
    exit 1
fi

# 2. Test the Bootstrap Token validity
echo ""
echo "Testing bootstrap token validity..."
AUTH_HEADER="Authorization: Bearer $TOKEN"
TEST_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$AUTHENTIK_URL/api/v3/core/applications/" -H "$AUTH_HEADER")

if [ "$TEST_RESPONSE" == "200" ]; then
    echo "✓ Bootstrap token is valid (HTTP 200 OK)"
elif [ "$TEST_RESPONSE" == "403" ]; then
    echo "❌ Bootstrap token failed (HTTP 403 Forbidden)"
    echo ""
    echo "The bootstrap token only works on FIRST startup with a fresh database."
    echo "Your Authentik was already initialized, so you need to create an API token manually."
    echo ""
    echo "To reset and start fresh:"
    echo "  docker compose -f .devcontainer/docker-compose.dev.yml down -v"
    echo "  docker compose -f .devcontainer/docker-compose.dev.yml up -d"
    echo ""
    echo "Or create a token manually:"
    echo "  1. Visit: http://localhost:9000"
    echo "  2. Login: akadmin / ${AUTHENTIK_BOOTSTRAP_PASSWORD:-akadmin}"
    echo "  3. Go to: Admin → Directory → Tokens → Create"
    echo "  4. Set: Identifier=setup-script, Intent=API, Expiring=No"
    echo "  5. Copy the token and run:"
    echo "     export AUTHENTIK_BOOTSTRAP_TOKEN=<new-token>"
    echo "     ./scripts/setup-authentik.sh"
    exit 1
else
    echo "❌ Token test returned unexpected HTTP code: $TEST_RESPONSE"
    exit 1
fi

# 3. Fetch required Flow UUIDs
echo ""
echo "Fetching default flow UUIDs..."

# Fetch all flows first for debugging
FLOWS_RESPONSE=$(curl -s -X GET "$AUTHENTIK_URL/api/v3/flows/instances/" -H "$AUTH_HEADER")

# Check if jq is available for better parsing
if command -v jq &> /dev/null; then
    echo "Using jq for JSON parsing..."
    
    # Fetch the Authentication Flow UUID
    IDENT_FLOW_UUID=$(echo "$FLOWS_RESPONSE" | jq -r '.results[] | select(.slug == "default-authentication-flow") | .pk')
    
    if [ -z "$IDENT_FLOW_UUID" ] || [ "$IDENT_FLOW_UUID" == "null" ]; then
        echo "❌ Could not find default-authentication-flow"
        echo "Available flows:"
        echo "$FLOWS_RESPONSE" | jq -r '.results[] | .slug'
        exit 1
    fi
    echo "✓ Authentication Flow UUID: $IDENT_FLOW_UUID"
    
    # Fetch the Authorization Flow UUID
    AUTH_FLOW_UUID=$(echo "$FLOWS_RESPONSE" | jq -r '.results[] | select(.slug == "default-provider-authorization-implicit-consent") | .pk')
    
    if [ -z "$AUTH_FLOW_UUID" ] || [ "$AUTH_FLOW_UUID" == "null" ]; then
        echo "❌ Could not find default-provider-authorization-implicit-consent flow"
        echo "Available flows:"
        echo "$FLOWS_RESPONSE" | jq -r '.results[] | .slug'
        exit 1
    fi
    echo "✓ Authorization Flow UUID: $AUTH_FLOW_UUID"
    
    # Fetch the Invalidation Flow UUID
    INVALID_FLOW_UUID=$(echo "$FLOWS_RESPONSE" | jq -r '.results[] | select(.slug == "default-invalidation-flow") | .pk')
    
    if [ -z "$INVALID_FLOW_UUID" ] || [ "$INVALID_FLOW_UUID" == "null" ]; then
        echo "❌ Could not find default-invalidation-flow flow"
        echo "Available flows:"
        echo "$FLOWS_RESPONSE" | jq -r '.results[] | .slug'
        exit 1
    fi
    echo "✓ Invalidation Flow UUID: $INVALID_FLOW_UUID"
else
    echo "Using grep for JSON parsing (install jq for better results)..."
    
    # Fetch the Authentication Flow UUID
    IDENT_FLOW_UUID=$(echo "$FLOWS_RESPONSE" | grep -o '"slug":"default-authentication-flow"[^}]*"pk":"[^"]*' | grep -o '"pk":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$IDENT_FLOW_UUID" ]; then
        echo "❌ Could not find default-authentication-flow"
        echo "Install jq for better debugging: apt-get install jq"
        exit 1
    fi
    echo "✓ Authentication Flow UUID: $IDENT_FLOW_UUID"
    
    # Fetch the Authorization Flow UUID
    AUTH_FLOW_UUID=$(echo "$FLOWS_RESPONSE" | grep -o '"slug":"default-provider-authorization-implicit-consent"[^}]*"pk":"[^"]*' | grep -o '"pk":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$AUTH_FLOW_UUID" ]; then
        echo "❌ Could not find default-provider-authorization-implicit-consent flow"
        exit 1
    fi
    echo "✓ Authorization Flow UUID: $AUTH_FLOW_UUID"
    
    # Fetch the Invalidation Flow UUID
    INVALID_FLOW_UUID=$(echo "$FLOWS_RESPONSE" | grep -o '"slug":"default-invalidation-flow"[^}]*"pk":"[^"]*' | grep -o '"pk":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$INVALID_FLOW_UUID" ]; then
        echo "❌ Could not find default-invalidation-flow flow"
        exit 1
    fi
    echo "✓ Invalidation Flow UUID: $INVALID_FLOW_UUID"
fi

# 4. Generate credentials
echo ""
echo "Generating OAuth2 credentials..."
CLIENT_ID="sso-login-$(date +%s)"
CLIENT_SECRET=$(openssl rand -base64 32)

# 5. Create OIDC Provider using UUIDs
echo "Creating OIDC Provider..."
PROVIDER_DATA=$(cat <<EOF
{
  "name": "SSO Login Provider",
  "client_id": "$CLIENT_ID",
  "client_secret": "$CLIENT_SECRET",
  "redirect_uris": [
    {
      "matching_mode": "strict",
      "url": "$CALLBACK_URL"
    }
  ],
  "authentication_flow": "$IDENT_FLOW_UUID",
  "authorization_flow": "$AUTH_FLOW_UUID",
  "invalidation_flow": "$INVALID_FLOW_UUID",
  "issuer_mode": "per_provider"
}
EOF
)

PROVIDER_RESPONSE=$(curl -s -X POST "$AUTHENTIK_URL/api/v3/providers/oauth2/" \
    -H "$AUTH_HEADER" \
    -H "Content-Type: application/json" \
    --data "$PROVIDER_DATA")

# Check if jq is available for better JSON parsing
if command -v jq &> /dev/null; then
    PROVIDER_ID=$(echo "$PROVIDER_RESPONSE" | jq -r '.pk')
else
    # Fallback to grep if jq is not available
    PROVIDER_ID=$(echo "$PROVIDER_RESPONSE" | grep -o '"pk":[0-9]*' | head -1 | cut -d':' -f2)
fi

if [ -z "$PROVIDER_ID" ] || [ "$PROVIDER_ID" == "null" ]; then
    echo "❌ Failed to create provider"
    echo "Response: $PROVIDER_RESPONSE"
    exit 1
fi

echo "✓ Provider created (ID: $PROVIDER_ID)"

# 6. Get the self-signed certificate for RS256 signing
echo ""
echo "Fetching signing certificate..."
CERTS_RESPONSE=$(curl -s -X GET "$AUTHENTIK_URL/api/v3/crypto/certificatekeypairs/" -H "$AUTH_HEADER")

if command -v jq &> /dev/null; then
    SIGNING_KEY_UUID=$(echo "$CERTS_RESPONSE" | jq -r '.results[] | select(.name == "authentik Self-signed Certificate") | .pk')
else
    SIGNING_KEY_UUID=$(echo "$CERTS_RESPONSE" | grep -o '"name":"authentik Self-signed Certificate"[^}]*"pk":"[^"]*' | grep -o '"pk":"[^"]*' | cut -d'"' -f4)
fi

if [ -n "$SIGNING_KEY_UUID" ] && [ "$SIGNING_KEY_UUID" != "null" ]; then
    echo "✓ Found signing certificate: $SIGNING_KEY_UUID"
    echo "Configuring provider to use RS256 signing..."
    
    PATCH_RESPONSE=$(curl -s -X PATCH "$AUTHENTIK_URL/api/v3/providers/oauth2/$PROVIDER_ID/" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        --data "{\"signing_key\": \"$SIGNING_KEY_UUID\"}")
    
    echo "✓ Provider configured with RS256 signing"
else
    echo "⚠ Warning: Could not find signing certificate. Provider will use HS256 (less secure)"
fi

# 7. Create Application
echo ""
echo "Creating Application..."
APPLICATION_DATA=$(cat <<EOF
{
  "name": "SSO Login",
  "slug": "sso-login",
  "provider": $PROVIDER_ID,
  "meta_launch_url": "http://localhost:8000"
}
EOF
)

APPLICATION_RESPONSE=$(curl -s -X POST "$AUTHENTIK_URL/api/v3/core/applications/" \
    -H "$AUTH_HEADER" \
    -H "Content-Type: application/json" \
    --data "$APPLICATION_DATA")

if command -v jq &> /dev/null; then
    APP_ID=$(echo "$APPLICATION_RESPONSE" | jq -r '.pk')
    echo "$APPLICATION_RESPONSE" | jq .
else
    APP_ID=$(echo "$APPLICATION_RESPONSE" | grep -o '"pk":"[^"]*' | head -1 | cut -d'"' -f4)
fi

if [ -z "$APP_ID" ] || [ "$APP_ID" == "null" ]; then
    echo "❌ Failed to create application"
    echo "Response: $APPLICATION_RESPONSE"
    exit 1
fi

echo "✓ Application created"

# Save credentials
echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Add these to your .env.local:"
echo ""
echo "AUTHENTIK_CLIENT_ID=$CLIENT_ID"
echo "AUTHENTIK_CLIENT_SECRET=$CLIENT_SECRET"
echo "AUTHENTIK_ISSUER=$AUTHENTIK_URL/application/o/sso-login/"
echo "NEXT_PUBLIC_AUTHENTIK_ENABLED=true"
echo ""
echo "Authentik Admin Access:"
echo "  URL: $AUTHENTIK_URL"
echo "  Username: akadmin"
echo "  Password: ${AUTHENTIK_BOOTSTRAP_PASSWORD:-akadmin}"
echo ""
echo "Next: npm run dev"
echo ""
