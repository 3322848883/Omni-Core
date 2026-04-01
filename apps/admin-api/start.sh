#!/bin/bash
cd /omni-core/apps/admin-api
export PATH=/root/.nvm/versions/node/v24.14.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export NODE_ENV=production
export PORT=3005
export HOST=0.0.0.0
export CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:8081,http://localhost:8082
export IPDATA_API_KEY=a3ca0631918fd0bc54433c969399eb6df23cca1e67a40eee2f759cd8

# 使用 tsx 直接运行 TypeScript 源码
exec /root/.nvm/versions/node/v24.14.0/bin/tsx src/index.ts
