#!/bin/bash
cd "$(dirname "$0")"
export NODE_ENV=production
export PORT=3005
export HOST=0.0.0.0
export CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:8081,http://localhost:8082
export IPDATA_API_KEY=a3ca0631918fd0bc54433c969399eb6df23cca1e67a40eee2f759cd8

# 使用 npx tsx 直接运行 TypeScript 源码
exec npx tsx src/index.ts
