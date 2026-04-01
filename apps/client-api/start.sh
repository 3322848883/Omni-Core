#!/bin/bash
cd /omni-core/apps/client-api
export PATH=/root/.nvm/versions/node/v24.14.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export NODE_ENV=production
export PORT=3101
export HOST=0.0.0.0
exec /root/.nvm/versions/node/v24.14.0/bin/tsx src/index.ts
