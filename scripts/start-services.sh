#!/bin/bash
set -e

echo "=== Omni Core Setup Script ==="
echo ""

# Setup admin-api symlinks
echo "Setting up admin-api symlinks..."
cd /omni-core/apps/admin-api/src
rm -rf shared 2>/dev/null || true
ln -sf ../../../../shared shared
cd /omni-core

# Setup client-api symlinks
echo "Setting up client-api symlinks..."
cd /omni-core/apps/client-api/src
rm -rf shared 2>/dev/null || true
ln -sf ../../../../shared shared
cd /omni-core

echo ""
echo "=== Setup Complete ==="
echo ""
echo "To start admin-api:"
echo "  cd /omni-core/apps/admin-api && npx tsx src/index.ts"
echo ""
echo "To start client-api:"
echo "  cd /omni-core/apps/client-api && npx tsx src/index.ts"
