#!/bin/bash
set -e

echo "=== Post-install: Creating symlinks ==="

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Create symlinks for admin-api
echo "Creating symlinks for admin-api..."
if [ -d "apps/admin-api/src" ]; then
    cd apps/admin-api/src
    rm -rf shared constants types utils 2>/dev/null || true
    ln -sf ../../../shared shared
    cd "$PROJECT_ROOT"
fi

# Create symlinks for client-api
echo "Creating symlinks for client-api..."
if [ -d "apps/client-api/src" ]; then
    cd apps/client-api/src
    rm -rf shared constants types utils 2>/dev/null || true
    ln -sf ../../../shared shared
    cd "$PROJECT_ROOT"
fi

echo "=== Post-install complete ==="
