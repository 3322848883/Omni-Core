# FGVPN 生产环境配置说明

基于 `domain-config.md` 规范，生产环境部署配置指南。

---

## 1. 域名架构

| 子域名 | 用途 | 目标服务 | IP/记录值 |
|--------|------|----------|-----------|
| `embarks.uk` | 用户端主站 | client-web | 69.12.85.185 |
| `www.embarks.uk` | 用户端（备用） | client-web | CNAME → embarks.uk |
| `api.embarks.uk` | API 服务 | admin-api / client-api | 69.12.85.185 |
| `admin.embarks.uk` | 管理后台 | admin-web | 69.12.85.185 |

---

## 2. Cloudflare DNS 配置

### 2.1 必须配置的记录

```dns
# A 记录
embarks.uk          A     69.12.85.185     300
admin.embarks.uk    A     69.12.85.185     300
api.embarks.uk      A     69.12.85.185     300

# CNAME 记录
www.embarks.uk      CNAME embarks.uk       300
```

### 2.2 建议配置的安全记录

```dns
# SPF 记录
embarks.uk          TXT    "v=spf1 mx a:mail.embarks.uk ip4:69.12.85.185 ~all"

# DMARC 记录
_dmarc.embarks.uk   TXT    "v=DMARC1; p=quarantine; rua=mailto:dmarc@embarks.uk; pct=100"

# CAA 记录
embarks.uk          CAA    0 issue "letsencrypt.org"
embarks.uk          CAA    0 issuewild "letsencrypt.org"
```

---

## 3. 环境变量配置

### 3.1 Admin API (.env)

```env
# ============================================
# Domain Configuration (per domain-config.md)
# ============================================
DOMAIN_ROOT=embarks.uk
DOMAIN_ADMIN=admin.embarks.uk
DOMAIN_API=api.embarks.uk
DOMAIN_CLIENT=embarks.uk
DOMAIN_ENV=production

# ============================================
# Server Configuration
# ============================================
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# ============================================
# Database Configuration
# ============================================
USE_SQLITE=false
DB_CLIENT=mysql2
DB_HOST=localhost
DB_PORT=3306
DB_NAME=fgvpn_admin
DB_USER=fgvpn_admin
DB_PASSWORD=your_secure_password

# ============================================
# JWT Configuration
# ============================================
JWT_SECRET=your_production_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_production_jwt_refresh_secret_min_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ============================================
# CORS Configuration
# ============================================
CORS_ALLOWED_ORIGINS=https://admin.embarks.uk,https://embarks.uk

# ============================================
# Xray Service Configuration
# ============================================
XRAY_API_HOST=localhost
XRAY_API_PORT=10085

# ============================================
# Redis Configuration
# ============================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

# ============================================
# Frontend URL
# ============================================
ADMIN_WEB_URL=https://admin.embarks.uk
```

### 3.2 Client API (.env)

```env
# ============================================
# Domain Configuration
# ============================================
DOMAIN_ROOT=embarks.uk
DOMAIN_API=api.embarks.uk
DOMAIN_CLIENT=embarks.uk
DOMAIN_ENV=production

# ============================================
# Server Configuration
# ============================================
NODE_ENV=production
PORT=3002
HOST=0.0.0.0

# ============================================
# Database Configuration
# ============================================
DB_CLIENT=mysql2
DB_HOST=localhost
DB_PORT=3306
DB_NAME=fgvpn_client
DB_USER=fgvpn_client
DB_PASSWORD=your_secure_password

# ============================================
# JWT Configuration
# ============================================
CLIENT_JWT_SECRET=your_production_client_jwt_secret_min_32_chars
CLIENT_JWT_REFRESH_SECRET=your_production_client_jwt_refresh_secret_min_32_chars
JWT_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=30d

# ============================================
# CORS Configuration
# ============================================
CORS_ALLOWED_ORIGINS=https://embarks.uk

# ============================================
# Xray Service Configuration
# ============================================
XRAY_API_HOST=localhost
XRAY_API_PORT=10085

# ============================================
# Admin API URL (for internal calls)
# ============================================
ADMIN_API_URL=http://localhost:3001
```

---

## 4. 生产环境检查清单

### 4.1 部署前检查

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 域名已购买并解析 | ⬜ | 指向 69.12.85.185 |
| SSL 证书已配置 | ⬜ | Cloudflare Full SSL 或自签 |
| 数据库已创建 | ⬜ | MySQL/PostgreSQL |
| Redis 已配置 | ⬜ | 生产环境建议开启 |
| Xray Core 已安装 | ⬜ | VPN 核心服务 |
| 防火墙端口开放 | ⬜ | 80, 443, 3306, 6379 |

### 4.2 必需环境变量

```
Admin API:
- JWT_SECRET (≥32字符)
- DB_PASSWORD
- REDIS_PASSWORD (如启用)

Client API:
- CLIENT_JWT_SECRET (≥32字符)
- DB_PASSWORD
```

### 4.3 安全配置

| 配置项 | 推荐值 | 说明 |
|--------|--------|------|
| NODE_ENV | production | 启用生产模式 |
| CORS | 严格域名列表 | 不使用通配符 |
| Rate Limit | 100 req/min | 防止滥用 |
| JWT Expire | 15m | Access Token 短期有效 |
| BCRYPT_ROUNDS | 12 | 密码加密强度 |

---

## 5. 部署架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare DNS                          │
│   embarks.uk → 69.12.85.185                              │
│   admin.embarks.uk → 69.12.85.185                        │
│   api.embarks.uk → 69.12.85.185                          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    69.12.85.185                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Nginx      │  │  Admin API  │  │  Client API │        │
│  │  (SSL终止)   │  │  :3001      │  │  :3002      │        │
│  │ 443→3001/3002│  │             │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                           │                │                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Xray Core  │  │   MySQL     │  │   Redis     │        │
│  │  :10085     │  │   :3306     │  │   :6379     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. 快速部署命令

```bash
# 1. 克隆代码
git clone https://github.com/your-repo/fgvpn.git
cd fgvpn

# 2. 安装依赖
cd apps/admin-api && npm install
cd apps/client-api && npm install

# 3. 配置环境变量
cp apps/admin-api/.env.example apps/admin-api/.env
# 编辑 .env 填入生产配置

# 4. 数据库迁移
cd apps/admin-api
npm run db:migrate

# 5. 构建
npm run build

# 6. 启动服务 (使用 PM2)
pm2 start dist/index.js --name admin-api
```

---

## 7. 验证部署

```bash
# 检查 API 健康状态
curl https://api.embarks.uk/health

# 检查管理端
curl https://admin.embarks.uk/health

# 检查 Xray 连接
curl http://localhost:10085/v2/search
```

---

**文档版本**: v1.0.0
**基于**: domain-config.md (embarks.uk 域名配置规划方案)
**最后更新**: 2026-03-22
