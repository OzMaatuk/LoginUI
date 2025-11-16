#!/bin/bash
# Entrypoint script for SSO Login application
# Runs Authentik setup before starting the app

set -e

echo "=== SSO Login Application Startup ==="
echo ""

# Check if we should run Authentik setup
if [ "${AUTO_SETUP_AUTHENTIK}" = "true" ]; then
    echo "Running Authentik setup..."
    /app/scripts/setup-authentik.sh || {
        echo "Warning: Authentik setup failed, but continuing with app startup"
        echo "You can run setup manually: docker-compose exec sso-login /app/scripts/setup-authentik.sh"
    }
    echo ""
fi

echo "Starting application..."
exec "$@"
