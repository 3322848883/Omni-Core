# 套餐服务体系升级 - 部署指南

## 概述

本文档描述了套餐服务体系升级的部署流程，包括数据库迁移、服务部署、配置更新和验证步骤。

## 前置条件

### 系统要求

- Node.js >= 18.0.0
- MySQL >= 8.0
- Redis >= 6.0
- 内存 >= 4GB
- 磁盘空间 >= 10GB

### 环境变量

确保以下环境变量已配置：

```bash
# 数据库
DB_HOST=localhost
DB_PORT=3306
DB_NAME=fgvpn_db
DB_USER=app_user
DB_PASSWORD=<secure_password>

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<secure_password>

# JWT
JWT_SECRET=<secure_secret>
JWT_EXPIRATION=3600
JWT_REFRESH_EXPIRATION=604800

# IPData API
IPDATA_API_KEY=<your_api_key>

# 性能配置
SLOW_QUERY_THRESHOLD=200
ENABLE_PERF_LOG=true
```

## 部署步骤

### 1. 备份数据

**重要：在生产环境部署前，务必备份数据库**

```bash
# 备份数据库
mysqldump -u root -p fgvpn_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 备份Redis数据（如果使用持久化）
redis-cli BGSAVE

# 备份配置文件
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
```

### 2. 代码部署

#### 2.1 拉取最新代码

```bash
# 进入项目目录
cd /path/to/fgvpn

# 拉取最新代码
git pull origin main

# 切换到升级分支
git checkout plan-service-upgrade
```

#### 2.2 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装admin-api依赖
cd apps/admin-api
npm install

# 安装client-api依赖
cd ../client-api
npm install

# 返回根目录
cd ../..
```

#### 2.3 构建项目

```bash
# 构建admin-api
npm run build:admin-api

# 构建client-api
npm run build:client-api

# 构建admin-web（如果需要）
npm run build:admin-web
```

### 3. 数据库迁移

#### 3.1 执行迁移脚本

```bash
# 进入admin-api目录
cd apps/admin-api

# 执行所有迁移
npx knex migrate:latest

# 或者指定环境
npx knex migrate:latest --env production
```

#### 3.2 验证迁移

```bash
# 检查迁移状态
npx knex migrate:status

# 预期输出应显示所有迁移已执行
```

#### 3.3 数据迁移脚本

执行数据迁移脚本，将现有数据迁移到新结构：

```bash
# 运行数据迁移脚本
npx tsx scripts/migrate-plan-data.ts

# 验证数据迁移
npx tsx scripts/verify-migration.ts
```

### 4. 配置更新

#### 4.1 更新环境变量

在 `.env` 文件中添加以下新配置：

```bash
# IP池配置
IP_POOL_ENABLED=true
IP_POOL_DEFAULT_ROTATION_STRATEGY=round_robin
IP_POOL_DEFAULT_ROTATION_INTERVAL=86400

# IP声誉检测配置
IP_REPUTATION_ENABLED=true
IP_REPUTATION_CACHE_TTL=86400
IP_REPUTATION_RATE_LIMIT_PER_MINUTE=10
IP_REPUTATION_RATE_LIMIT_PER_HOUR=100
IP_REPUTATION_RATE_LIMIT_PER_DAY=1000

# 缓存策略配置
CACHE_STRATEGY_ENABLED=true
CACHE_WARMUP_ON_START=true

# 性能优化配置
ENABLE_COMPRESSION=true
COMPRESSION_LEVEL=6
QUERY_OPTIMIZER_ENABLED=true
```

#### 4.2 更新配置文件

检查并更新以下配置文件：

- `apps/admin-api/src/config/index.ts`
- `apps/admin-api/src/config/database.ts`
- `apps/admin-api/src/config/redis.ts`

### 5. 服务启动

#### 5.1 启动顺序

按以下顺序启动服务：

1. **数据库** - 确保MySQL和Redis已启动
2. **Admin API** - 管理后台API服务
3. **Client API** - 客户端API服务
4. **Admin Web** - 管理后台前端（如果需要）

#### 5.2 启动命令

```bash
# 方式1：使用npm脚本
npm run start:admin-api
npm run start:client-api

# 方式2：使用PM2
pm2 start ecosystem.config.js

# 方式3：使用Docker
docker-compose up -d
```

#### 5.3 健康检查

```bash
# 检查API健康状态
curl http://localhost:3000/api/v1/health

# 预期响应
{
  "status": "healthy",
  "timestamp": "2024-03-21T10:00:00Z",
  "version": "2.0.0"
}
```

### 6. 缓存预热

#### 6.1 预热套餐数据

```bash
# 运行缓存预热脚本
npx tsx scripts/warmup-cache.ts
```

#### 6.2 验证缓存

```bash
# 检查Redis缓存
redis-cli KEYS "plan:*"
redis-cli KEYS "ip:*"
```

### 7. 功能验证

#### 7.1 API测试

```bash
# 测试IP池API
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/v1/ip-pools

# 测试服务类型API
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/v1/service-types

# 测试套餐API
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/v1/plans
```

#### 7.2 数据库验证

```bash
# 检查新表是否创建
mysql -u root -p -e "USE fgvpn_db; SHOW TABLES LIKE 'ip_%';"
mysql -u root -p -e "USE fgvpn_db; SHOW TABLES LIKE '%reputation%';"

# 检查索引是否创建
mysql -u root -p -e "USE fgvpn_db; SHOW INDEX FROM ip_pools;"
mysql -u root -p -e "USE fgvpn_db; SHOW INDEX FROM subscription_plans;"
```

#### 7.3 运行测试套件

```bash
# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:integration

# 运行所有测试
npm run test
```

## 回滚方案

如果部署出现问题，按以下步骤回滚：

### 1. 停止服务

```bash
# 停止所有服务
pm2 stop all
# 或
docker-compose down
```

### 2. 恢复数据库

```bash
# 恢复数据库备份
mysql -u root -p fgvpn_db < backup_YYYYMMDD_HHMMSS.sql
```

### 3. 恢复代码

```bash
# 切换到之前的版本
git checkout <previous-tag>

# 重新构建
npm run build:admin-api
npm run build:client-api
```

### 4. 重启服务

```bash
# 重启服务
npm run start:admin-api
npm run start:client-api
```

## 监控和日志

### 日志位置

```
logs/
├── admin-api/
│   ├── error.log
│   ├── access.log
│   └── performance.log
└── client-api/
    ├── error.log
    └── access.log
```

### 监控指标

- **API响应时间**: < 200ms (P95)
- **数据库查询时间**: < 100ms (P95)
- **缓存命中率**: > 80%
- **错误率**: < 0.1%
- **CPU使用率**: < 70%
- **内存使用率**: < 80%

### 告警配置

```yaml
# 示例告警规则
alerts:
  - name: HighErrorRate
    condition: error_rate > 1%
    duration: 5m
    severity: critical
  
  - name: SlowQueries
    condition: slow_query_count > 10/min
    duration: 5m
    severity: warning
  
  - name: LowCacheHitRate
    condition: cache_hit_rate < 70%
    duration: 10m
    severity: warning
```

## 常见问题

### Q1: 迁移失败怎么办？

**A**: 
1. 检查数据库连接配置
2. 查看迁移日志：`npx knex migrate:latest --debug`
3. 手动修复后重试
4. 必要时回滚到之前版本

### Q2: IP声誉检测API限流怎么办？

**A**:
1. 检查IPDATA_API_KEY是否有效
2. 调整限流配置：`IP_REPUTATION_RATE_LIMIT_PER_DAY`
3. 考虑升级API套餐

### Q3: 缓存未生效？

**A**:
1. 检查Redis连接
2. 验证缓存键格式
3. 检查TTL配置
4. 手动清除缓存：`redis-cli FLUSHDB`

### Q4: 性能问题？

**A**:
1. 检查数据库索引是否生效
2. 启用查询优化器
3. 调整缓存策略
4. 增加服务器资源

## 联系支持

如有问题，请联系：

- **技术支持**: support@fgvpn.com
- **紧急联系**: +86-xxx-xxxx-xxxx
- **文档**: https://docs.fgvpn.com

## 附录

### A. 迁移脚本清单

| 脚本 | 说明 | 执行顺序 |
|------|------|----------|
| 20240321000000_add_ip_pool_tables.ts | 创建IP池相关表 | 1 |
| 20240321000001_add_performance_indexes.ts | 添加性能索引 | 2 |
| migrate-plan-data.ts | 迁移套餐数据 | 3 |
| verify-migration.ts | 验证迁移 | 4 |
| warmup-cache.ts | 缓存预热 | 5 |

### B. 配置文件模板

```typescript
// config/index.ts
export const config = {
  ipPool: {
    enabled: process.env.IP_POOL_ENABLED === 'true',
    defaultRotationStrategy: process.env.IP_POOL_DEFAULT_ROTATION_STRATEGY || 'round_robin',
    defaultRotationInterval: parseInt(process.env.IP_POOL_DEFAULT_ROTATION_INTERVAL || '86400')
  },
  ipReputation: {
    enabled: process.env.IP_REPUTATION_ENABLED === 'true',
    apiKey: process.env.IPDATA_API_KEY,
    cacheTtl: parseInt(process.env.IP_REPUTATION_CACHE_TTL || '86400'),
    rateLimit: {
      perMinute: parseInt(process.env.IP_REPUTATION_RATE_LIMIT_PER_MINUTE || '10'),
      perHour: parseInt(process.env.IP_REPUTATION_RATE_LIMIT_PER_HOUR || '100'),
      perDay: parseInt(process.env.IP_REPUTATION_RATE_LIMIT_PER_DAY || '1000')
    }
  },
  cache: {
    enabled: process.env.CACHE_STRATEGY_ENABLED === 'true',
    warmupOnStart: process.env.CACHE_WARMUP_ON_START === 'true'
  },
  performance: {
    enableCompression: process.env.ENABLE_COMPRESSION === 'true',
    compressionLevel: parseInt(process.env.COMPRESSION_LEVEL || '6'),
    slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD || '200'),
    enableQueryOptimizer: process.env.QUERY_OPTIMIZER_ENABLED === 'true'
  }
};
```

### C. 检查清单

部署前检查：

- [ ] 数据库已备份
- [ ] 环境变量已配置
- [ ] 依赖已安装
- [ ] 代码已构建
- [ ] 测试已通过

部署后检查：

- [ ] 服务已启动
- [ ] 健康检查通过
- [ ] 数据库迁移成功
- [ ] 缓存已预热
- [ ] API响应正常
- [ ] 日志无错误
- [ ] 监控指标正常
