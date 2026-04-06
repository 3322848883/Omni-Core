# FGVPN 套餐服务体系升级 - 部署指南

## 部署状态

| 模块 | 构建状态 | 说明 |
|------|---------|------|
| Admin API | ✅ 成功 | 已就绪 |
| Client API | ✅ 成功 | 已就绪 |
| Admin Web | ⚠️ 需调整 | vue-tsc版本问题 |
| Client Web | ⚠️ 需调整 | 现有代码TypeScript错误 |

## 快速部署方案

### 方案A：仅部署后端（推荐先验证核心功能）

```bash
# 1. 执行数据库迁移
cd apps/admin-api
npx knex migrate:latest

# 2. 启动 Admin API
npm run dev:admin-api

# 3. 启动 Client API
npm run dev:client-api
```

### 方案B：完整部署

#### 步骤1：数据库迁移

```bash
cd apps/admin-api

# 执行所有迁移
npx knex migrate:latest

# 验证迁移结果
npx ts-node scripts/verify-migration.ts
```

#### 步骤2：构建后端

```bash
# Admin API
npm run build:admin-api

# Client API
npm run build:client-api
```

#### 步骤3：构建前端（临时跳过TypeScript检查）

**Admin Web：**
```bash
cd apps/admin-web
# 临时修改package.json，跳过vue-tsc
npm run build
```

**Client Web：**
```bash
cd apps/client-web
# 需要先修复TypeScript错误，或临时跳过检查
npm run build
```

#### 步骤4：启动服务

```bash
# 使用Docker Compose
docker-compose up -d

# 或手动启动
npm run dev:admin-api
npm run dev:client-api
```

## 关键配置

### 环境变量

```bash
# .env

# IPData API配置
IPDATA_API_KEY=your_api_key_here
IPDATA_API_URL=https://api.ipdata.co

# IP检测配置
IP_REPUTATION_CACHE_TTL=86400
IP_REPUTATION_ALERT_THRESHOLD=60
IP_REPUTATION_CRITICAL_THRESHOLD=40

# IP池配置
IP_POOL_ROTATION_INTERVAL=86400
IP_POOL_MIN_HEALTHY_IPS=2
```

### 数据库配置

迁移脚本已创建：
- `20250324000001_add_ip_and_line_types_to_nodes.ts`
- `20250324000002_add_ip_line_types_to_subscription_plans.ts`
- `20250324000003_create_ip_pools_table.ts`
- `20250324000004_create_ip_reputation_cache_table.ts`
- `20250324000005_create_isps_table.ts`

## 功能验证

### 1. 基础功能验证

```bash
# 获取IP类型列表
curl http://localhost:3000/api/v1/meta/ip-types

# 获取线路类型列表
curl http://localhost:3000/api/v1/meta/line-types

# 获取ISP列表
curl http://localhost:3000/api/v1/isps
```

### 2. 节点管理验证

```bash
# 创建带IP类型的节点
curl -X POST http://localhost:3000/api/v1/nodes \
  -H "Content-Type: application/json" \
  -d '{
    "code": "test-node-1",
    "name": "测试节点",
    "host": "192.168.1.1",
    "port": 443,
    "protocol": "vless",
    "serviceType": "standard",
    "ipType": "datacenter",
    "lineType": "standard",
    "ispName": "TestISP"
  }'

# 查询节点列表（带筛选）
curl "http://localhost:3000/api/v1/nodes?ipType=datacenter"
```

### 3. IP池管理验证

```bash
# 创建IP池
curl -X POST http://localhost:3000/api/v1/ip-pools \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试IP池",
    "nodeId": "node-id",
    "ipType": "residential_dynamic",
    "ips": ["1.2.3.4", "5.6.7.8"],
    "rotationStrategy": "round_robin",
    "rotationInterval": 86400
  }'
```

### 4. 套餐权益验证

```bash
# 获取套餐列表
curl http://localhost:3001/api/v1/plans

# 获取用户可访问节点（带权限过滤）
curl -H "Authorization: Bearer token" \
  http://localhost:3001/api/v1/nodes
```

## 回滚方案

如果需要回滚：

```bash
# 1. 回滚数据库迁移
cd apps/admin-api
npx knex migrate:rollback

# 2. 恢复代码
git checkout main

# 3. 重启服务
npm run docker:restart
```

## 监控和日志

### 查看日志

```bash
# Admin API日志
docker logs fgvpn-admin-api

# Client API日志
docker logs fgvpn-client-api

# 查看IP检测任务日志
docker logs fgvpn-admin-api | grep "IPReputation"
```

### 关键指标监控

- IP检测成功率
- IP池轮换成功率
- 套餐权益验证成功率
- API响应时间

## 常见问题

### Q1: vue-tsc报错
**解决：** 升级vue-tsc版本或临时跳过类型检查

### Q2: 数据库迁移失败
**解决：** 检查数据库连接，手动执行迁移脚本

### Q3: IP检测API限流
**解决：** 配置API密钥，调整限流参数

### Q4: 套餐权益验证不正确
**解决：** 检查subscription_plans表的allowed_ip_types和allowed_line_types配置

## 联系支持

如有问题，请联系开发团队。

---

**部署日期：** 2026-03-24
**版本：** v3.0.0
