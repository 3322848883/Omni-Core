# FGVPN 环境配置指南

**配置日期**: 2024-03-21  
**版本**: v1.0.0

---

## 1. 配置完成清单

### 1.1 环境变量配置 ✅

| 文件 | 状态 | 说明 |
|------|------|------|
| `apps/admin-api/.env` | ✅ | 管理端后端环境变量 |
| `apps/admin-web/.env` | ✅ | 管理端前端环境变量 |
| `infrastructure/docker/.env` | ✅ | Docker 环境变量 |

### 1.2 数据库配置 ✅

| 文件 | 状态 | 说明 |
|------|------|------|
| `knexfile.ts` | ✅ | Knex 配置文件 |
| `migrations/20240321000001_create_users_table.ts` | ✅ | 用户表迁移 |
| `migrations/20240321000002_create_user_history_table.ts` | ✅ | 用户历史表迁移 |
| `migrations/20240321000003_create_orders_table.ts` | ✅ | 订单表迁移 |
| `migrations/20240321000004_create_nodes_table.ts` | ✅ | 节点表迁移 |
| `migrations/20240321000005_create_invite_tables.ts` | ✅ | 邀请相关表迁移 |
| `migrations/20240321000006_create_admin_tables.ts` | ✅ | 管理员表迁移 |
| `seeds/01_admin_users.ts` | ✅ | 管理员种子数据 |
| `seeds/02_nodes.ts` | ✅ | 节点种子数据 |
| `seeds/03_invite_reward_rules.ts` | ✅ | 邀请规则种子数据 |

### 1.3 基础设施配置 ✅

| 文件 | 状态 | 说明 |
|------|------|------|
| `xray/config.json` | ✅ | Xray 核心配置 |
| `nginx/nginx.conf` | ✅ | Nginx 主配置 |
| `nginx/conf.d/default.conf` | ✅ | Nginx 站点配置 |
| `monitoring/prometheus.yml` | ✅ | Prometheus 配置 |
| `monitoring/grafana/datasources/datasource.yml` | ✅ | Grafana 数据源配置 |

---

## 2. 环境变量详情

### 2.1 管理端后端 (.env)

```bash
# 服务器配置
NODE_ENV=development
PORT=3001
HOST=0.0.0.0
API_PREFIX=/api/v1

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=fgvpn_admin
DB_USER=fgvpn
DB_PASSWORD=fgvpn123

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT 配置
JWT_SECRET=fgvpn_jwt_secret_key_development_2024
JWT_REFRESH_SECRET=fgvpn_jwt_refresh_secret_key_development_2024

# Xray API 配置
XRAY_API_HOST=localhost
XRAY_API_PORT=10085

# 前端 URL
ADMIN_WEB_URL=http://localhost:5173
```

### 2.2 管理端前端 (.env)

```bash
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_APP_TITLE=FGVPN Admin
VITE_APP_VERSION=1.0.0
VITE_ENABLE_MOCK=false
VITE_ENABLE_DEBUG=true
```

### 2.3 Docker 环境 (.env)

```bash
# 数据库
MYSQL_ROOT_PASSWORD=rootpassword123
MYSQL_PASSWORD=fgvpn123

# JWT
JWT_SECRET=fgvpn_jwt_secret_key_development_2024

# 支付网关 (测试模式)
STRIPE_SECRET_KEY=sk_test_your_stripe_key_here
PAYPAL_CLIENT_ID=your_paypal_client_id_here

# 监控
GRAFANA_PASSWORD=admin123
```

---

## 3. 数据库表结构

### 3.1 用户相关表

```sql
-- 用户主表
users
├── id (BIGINT, PK)
├── user_id (VARCHAR, 前端系统用户唯一标识)
├── email (VARCHAR)
├── username (VARCHAR)
├── vpn_uuid (VARCHAR, VPN连接UUID)
├── status (TINYINT, 1-正常, 2-禁用, 3-删除)
├── traffic_limit (BIGINT, 默认10GB)
├── traffic_used (BIGINT)
├── expire_date (DATETIME)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
└── version (INT, 乐观锁)

-- 用户变更历史表
user_history
├── id (BIGINT, PK)
├── user_id (VARCHAR)
├── field_name (VARCHAR, 变更字段名)
├── old_value (TEXT)
├── new_value (TEXT)
├── changed_by (VARCHAR)
├── changed_at (TIMESTAMP)
└── ip_address (VARCHAR)
```

### 3.2 订单表

```sql
orders
├── id (BIGINT, PK)
├── order_no (VARCHAR, ORD{YYYYMMDD}{6位随机数})
├── user_id (VARCHAR)
├── order_type (ENUM: monthly, quarterly, yearly, traffic)
├── status (ENUM: pending, paid, completed, cancelled, expired)
├── amount (DECIMAL)
├── traffic_limit (BIGINT)
├── duration_days (INT)
├── start_date (DATE)
├── end_date (DATE)
├── payment_method (VARCHAR)
├── payment_time (TIMESTAMP)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### 3.3 节点表

```sql
nodes
├── id (BIGINT, PK)
├── code (VARCHAR, 如: US-LA-01)
├── name (VARCHAR)
├── region (VARCHAR)
├── country (VARCHAR)
├── city (VARCHAR)
├── latitude (DECIMAL)
├── longitude (DECIMAL)
├── host (VARCHAR)
├── port (INT)
├── protocol (ENUM: vless, vmess, trojan, shadowsocks)
├── status (ENUM: online, offline, maintenance)
├── health_score (TINYINT, 0-100)
├── load_percent (TINYINT)
├── active_connections (INT)
├── max_connections (INT)
├── priority (TINYINT)
├── is_backup (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### 3.4 邀请系统表

```sql
-- 邀请关系表
invite_relations
├── id (BIGINT, PK)
├── invite_code (VARCHAR, 6位)
├── inviter_id (VARCHAR)
├── invitee_id (VARCHAR)
├── status (ENUM: pending, registered, completed, invalid)
├── invite_channel (VARCHAR)
├── invite_ip (VARCHAR)
├── invitee_ip (VARCHAR)
├── invitee_device_id (VARCHAR)
├── registered_at (TIMESTAMP)
├── first_order_at (TIMESTAMP)
└── created_at (TIMESTAMP)

-- 邀请奖励表
invite_rewards
├── id (BIGINT, PK)
├── invite_relation_id (BIGINT)
├── inviter_id (VARCHAR)
├── reward_type (ENUM: traffic, duration, cash, credit)
├── reward_value (DECIMAL)
├── reward_unit (VARCHAR)
├── trigger_event (VARCHAR)
├── status (ENUM: pending, issued, failed, revoked)
├── issued_at (TIMESTAMP)
└── created_at (TIMESTAMP)

-- 邀请奖励规则表
invite_reward_rules
├── id (BIGINT, PK)
├── rule_name (VARCHAR)
├── rule_code (VARCHAR)
├── trigger_event (ENUM)
├── condition_type (ENUM)
├── condition_value (JSON)
├── rewards (JSON)
├── is_active (BOOLEAN)
├── priority (TINYINT)
├── start_date (DATE)
├── end_date (DATE)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### 3.5 管理员表

```sql
-- 管理员账号表
admin_users
├── id (BIGINT, PK)
├── username (VARCHAR)
├── email (VARCHAR)
├── password_hash (VARCHAR)
├── role (VARCHAR, super_admin, admin, operator, auditor)
├── avatar (VARCHAR)
├── is_active (BOOLEAN)
├── last_login_at (TIMESTAMP)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

-- 管理员日志表
admin_logs
├── id (BIGINT, PK)
├── admin_id (BIGINT)
├── action (VARCHAR)
├── resource (VARCHAR)
├── details (JSON)
├── ip_address (VARCHAR)
├── user_agent (VARCHAR)
└── created_at (TIMESTAMP)

-- 配置表
configurations
├── id (BIGINT, PK)
├── config_key (VARCHAR)
├── config_value (JSON)
├── config_type (ENUM: global, node, user, feature)
├── environment (ENUM: dev, staging, production)
├── version (INT)
├── description (TEXT)
├── created_by (VARCHAR)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

---

## 4. Xray 配置说明

### 4.1 入站配置

| 协议 | 端口 | 传输层 | 安全层 | 用途 |
|------|------|--------|--------|------|
| VLESS + REALITY | 443 | TCP | REALITY | 主要入站 |
| VLESS + WebSocket | 8443 | WebSocket | TLS | 备用入站 |
| Trojan | 2083 | TCP | TLS | 备用入站 |
| Shadowsocks | 8388 | TCP | AEAD | 备用入站 |
| API | 10085 | TCP | None | 管理接口 |

### 4.2 路由规则

1. **国内IP直连**: geoip:private, geoip:cn → direct
2. **国内域名直连**: geosite:cn, geosite:private → direct
3. **广告拦截**: geosite:category-ads → block
4. **P2P阻断**: protocol:bittorrent → block
5. **默认代理**: 所有其他流量 → direct

---

## 5. 服务端口映射

| 端口 | 服务 | 说明 |
|------|------|------|
| 80/443 | Nginx | HTTP/HTTPS 反向代理 |
| 3306 | MySQL | 数据库 |
| 6379 | Redis | 缓存 |
| 3001 | Admin API | 管理端后端 |
| 3002 | Client API | 用户端后端 |
| 5173 | Admin Web | 管理端前端 (开发) |
| 5174 | Client Web | 用户端前端 (开发) |
| 9090 | Prometheus | 监控采集 |
| 3000 | Grafana | 监控可视化 |
| 443 | Xray | VLESS+REALITY |
| 8443 | Xray | VLESS+WS |
| 2083 | Xray | Trojan |
| 8388 | Xray | Shadowsocks |
| 10085 | Xray | API 端口 |

---

## 6. 启动步骤

### 6.1 安装依赖

```bash
# 安装根项目依赖
npm install

# 安装各应用依赖
npm install -w @fgvpn/admin-api
npm install -w @fgvpn/admin-web
```

### 6.2 启动 Docker 服务

```bash
cd infrastructure/docker

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 6.3 运行数据库迁移

```bash
# 运行迁移
npm run db:migrate -w @fgvpn/admin-api

# 运行种子
npm run db:seed -w @fgvpn/admin-api
```

### 6.4 启动开发服务器

```bash
# 终端 1: 管理端后端
npm run dev:admin-api

# 终端 2: 管理端前端
npm run dev:admin-web
```

---

## 7. 默认账号

### 7.1 管理员账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| superadmin | admin123 | 超级管理员 |
| admin | admin123 | 管理员 |
| operator | admin123 | 运营人员 |

### 7.2 种子节点

| 节点代码 | 名称 | 位置 | 协议 | 端口 |
|----------|------|------|------|------|
| US-LA-01 | Los Angeles 01 | 美国西部 | VLESS | 443 |
| US-NY-01 | New York 01 | 美国东部 | VLESS | 443 |
| US-DAL-01 | Dallas 01 | 美国中部 | VLESS | 443 |

---

## 8. 验证检查清单

### 8.1 基础服务

- [ ] MySQL 运行正常 (端口 3306)
- [ ] Redis 运行正常 (端口 6379)
- [ ] Nginx 运行正常 (端口 80)

### 8.2 后端服务

- [ ] Admin API 健康检查通过 (http://localhost:3001/health)
- [ ] Client API 健康检查通过 (http://localhost:3002/health)

### 8.3 前端服务

- [ ] Admin Web 可访问 (http://localhost:5173)
- [ ] 登录页面正常显示

### 8.4 监控服务

- [ ] Prometheus 可访问 (http://localhost:9090)
- [ ] Grafana 可访问 (http://localhost:3000)

---

## 9. 故障排查

### 9.1 数据库连接失败

```bash
# 检查 MySQL 容器
docker-compose ps mysql
docker-compose logs mysql

# 检查数据库是否创建
docker-compose exec mysql mysql -u root -p -e "SHOW DATABASES;"
```

### 9.2 Redis 连接失败

```bash
# 检查 Redis 容器
docker-compose ps redis
docker-compose logs redis

# 测试 Redis 连接
docker-compose exec redis redis-cli ping
```

### 9.3 端口冲突

```bash
# 检查端口占用
netstat -tlnp | grep :3001
netstat -tlnp | grep :5173

# 停止冲突服务或修改 .env 中的端口
```

---

## 10. 下一步

环境配置已完成！接下来可以：

1. **安装依赖**: `npm install`
2. **启动 Docker**: `docker-compose up -d`
3. **运行迁移**: `npm run db:migrate -w @fgvpn/admin-api`
4. **启动开发**: `npm run dev:admin-api` 和 `npm run dev:admin-web`
5. **开始开发**: 访问 http://localhost:5173 进行开发

---

**配置完成时间**: 2024-03-21  
**配置版本**: v1.0.0
