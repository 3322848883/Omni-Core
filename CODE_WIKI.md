# Omni Core Project Code Wiki

## 项目概述

Omni Core 是一个现代化的 VPN 服务管理平台，采用微服务架构设计，提供完整的用户管理、节点管理、订阅管理、支付系统和监控功能。

### 核心特性

- 多服务类型支持（标准、专线、独享、静态住宅IP）
- 完整的用户认证和授权系统
- 多种支付方式集成（Stripe、PayPal、支付宝、微信支付）
- Xray 核心集成与管理
- 实时流量监控和统计
- IP池管理和ISP管理
- 邀请奖励系统

---

## 项目架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        Nginx (反向代理)                      │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──────┐ ┌──▼────────┐ ┌─▼─────────────┐
│  Admin-Web   │ │Client-Web │ │  Xray Core    │
│  (管理后台)   │ │ (用户端)  │ │  (VPN核心)    │
└───────┬──────┘ └──┬────────┘ └─┬─────────────┘
        │             │             │
┌───────▼──────┐ ┌──▼────────┐ ┌─▼─────────────┐
│  Admin-API   │ │Client-API │ │  Xray API     │
│  (管理接口)   │ │ (用户接口) │ │  (控制接口)    │
└───────┬──────┘ └──┬────────┘ └───────────────┘
        │             │
        └──────┬──────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼───┐ ┌──▼───┐  ┌───▼───┐
│ MySQL │ │Redis │  │Prometheus│
│(数据库)│ │(缓存) │  │(监控)   │
└───────┘ └──────┘  └───────┘
```

### 目录结构

```
/workspace/
├── apps/                          # 应用程序目录
│   ├── admin-api/                 # 管理后台 API
│   ├── admin-web/                 # 管理后台 Web
│   ├── client-api/                # 客户端 API
│   └── client-web/                # 客户端 Web
├── brand-assets/                  # 品牌资源
├── docs/                          # 文档
├── infrastructure/                # 基础设施配置
│   └── docker/                    # Docker 配置
├── scripts/                       # 脚本文件
├── shared/                        # 共享模块
│   ├── constants/                 # 常量定义
│   └── types/                     # 类型定义
└── docker-compose.yml             # 根 Docker Compose
```

---

## 主要模块职责

### 1. Admin API ([apps/admin-api](file:///workspace/apps/admin-api))

**职责：** 提供管理后台的核心业务逻辑和 API 接口

**核心模块：**

| 模块 | 路径 | 职责 |
|------|------|------|
| 配置管理 | [src/config/](file:///workspace/apps/admin-api/src/config) | 环境配置、安全配置 |
| 数据库 | [src/database/](file:///workspace/apps/admin-api/src/database) | 数据库迁移、数据种子 |
| 中间件 | [src/middlewares/](file:///workspace/apps/admin-api/src/middlewares) | 认证、错误处理、请求日志 |
| 路由 | [src/routes/](file:///workspace/apps/admin-api/src/routes) | API 路由定义 |
| 服务 | [src/services/](file:///workspace/apps/admin-api/src/services) | 核心业务逻辑 |
| 工具 | [src/utils/](file:///workspace/apps/admin-api/src/utils) | 通用工具函数 |

**关键技术栈：**
- Express.js (Web框架)
- TypeScript
- Knex.js (SQL查询构建器)
- MySQL (数据库)
- Redis (缓存)
- JWT (认证)
- Winston (日志)

### 2. Admin Web ([apps/admin-web](file:///workspace/apps/admin-web))

**职责：** 管理后台的用户界面

**核心模块：**

| 模块 | 路径 | 职责 |
|------|------|------|
| API | [src/api/](file:///workspace/apps/admin-web/src/api) | API 请求封装 |
| 组件 | [src/components/](file:///workspace/apps/admin-web/src/components) | 可复用组件 |
| 布局 | [src/layouts/](file:///workspace/apps/admin-web/src/layouts) | 页面布局 |
| 路由 | [src/router/](file:///workspace/apps/admin-web/src/router) | 路由配置 |
| 状态管理 | [src/stores/](file:///workspace/apps/admin-web/src/stores) | Pinia 状态管理 |
| 视图 | [src/views/](file:///workspace/apps/admin-web/src/views) | 页面组件 |

**关键技术栈：**
- Vue 3
- TypeScript
- Element Plus (UI组件库)
- Pinia (状态管理)
- Vue Router
- ECharts (图表)
- Vite (构建工具)

### 3. Client API ([apps/client-api](file:///workspace/apps/client-api))

**职责：** 提供客户端用户的核心业务逻辑和 API 接口

**核心模块：**

| 模块 | 路径 | 职责 |
|------|------|------|
| 配置 | [src/config/](file:///workspace/apps/client-api/src/config) | 环境配置 |
| 数据库 | [src/database/](file:///workspace/apps/client-api/src/database) | 数据库迁移、数据种子 |
| 中间件 | [src/middlewares/](file:///workspace/apps/client-api/src/middlewares) | 认证、限流、设备限制 |
| 路由 | [src/routes/](file:///workspace/apps/client-api/src/routes) | API 路由定义 |
| 服务 | [src/services/](file:///workspace/apps/client-api/src/services) | 核心业务逻辑 |

**关键技术栈：** 与 Admin API 类似

### 4. Client Web ([apps/client-web](file:///workspace/apps/client-web))

**职责：** 客户端用户的界面

**核心模块：**

| 模块 | 路径 | 职责 |
|------|------|------|
| API | [src/api/](file:///workspace/apps/client-web/src/api) | API 请求封装 |
| 组件 | [src/components/](file:///workspace/apps/client-web/src/components) | 可复用组件 |
| 组合式函数 | [src/composables/](file:///workspace/apps/client-web/src/composables) | Vue 组合式函数 |
| 布局 | [src/layouts/](file:///workspace/apps/client-web/src/layouts) | 页面布局 |
| 路由 | [src/router/](file:///workspace/apps/client-web/src/router) | 路由配置 |
| 状态管理 | [src/stores/](file:///workspace/apps/client-web/src/stores) | Pinia 状态管理 |
| 视图 | [src/views/](file:///workspace/apps/client-web/src/views) | 页面组件 |

**关键技术栈：** 与 Admin Web 类似，额外包含 Playwright 用于 E2E 测试

### 5. Shared ([shared](file:///workspace/shared))

**职责：** 提供跨项目共享的常量和类型定义

**核心模块：**

| 模块 | 路径 | 职责 |
|------|------|------|
| 常量 | [constants/](file:///workspace/shared/constants) | 服务类型、错误码、API端点 |
| 类型 | [types/](file:///workspace/shared/types) | 共享 TypeScript 类型 |

---

## 关键类与函数说明

### 服务类型定义 ([shared/constants/service-type.ts](file:///workspace/shared/constants/service-type.ts))

```typescript
enum ServiceType {
  STANDARD = 'standard',              // 标准/机场
  DEDICATED_LINE = 'dedicated_line',  // 专线
  EXCLUSIVE = 'exclusive',            // 独享
  STATIC_RESIDENTIAL = 'static_residential' // 静态住宅IP
}
```

**关键函数：**
- `getServiceTypeLabel(type)` - 获取服务类型标签
- `getServiceTypeColor(type)` - 获取服务类型颜色
- `isValidServiceType(type)` - 验证服务类型有效性
- `getAllServiceTypes()` - 获取所有服务类型列表

### Admin API 入口 ([apps/admin-api/src/index.ts](file:///workspace/apps/admin-api/src/index.ts))

**关键初始化：**
- `initializeXrayService()` - 初始化 Xray 服务
- `initializePaymentProviders()` - 初始化支付提供商

**关键中间件：**
- Helmet 安全头
- CORS 跨域配置
- 速率限制
- 请求日志
- 错误处理

### Xray 服务 ([apps/admin-api/src/services/xray/](file:///workspace/apps/admin-api/src/services/xray))

**核心功能：**
- 用户同步到 Xray 核心
- 流量收集
- 配置生成
- 订阅管理

### 支付服务 ([apps/admin-api/src/services/payment/](file:///workspace/apps/admin-api/src/services/payment))

**支持的支付方式：**
- Stripe
- PayPal
- 支付宝
- 微信支付

### 数据库表结构

#### 用户表 ([users](file:///workspace/apps/admin-api/src/database/migrations/20240321000001_create_users_table.ts))

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| user_id | string | 用户唯一ID |
| email | string | 邮箱 |
| username | string | 用户名 |
| vpn_uuid | string | VPN UUID |
| status | tinyint | 用户状态 |
| traffic_limit | bigint | 流量限制 |
| traffic_used | bigint | 已用流量 |
| expire_date | datetime | 过期时间 |

#### 节点表 ([nodes](file:///workspace/apps/admin-api/src/database/migrations/20240321000004_create_nodes_table.ts))

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| code | string | 节点代码 |
| name | string | 节点名称 |
| region | string | 区域 |
| country | string | 国家 |
| city | string | 城市 |
| host | string | 主机地址 |
| port | int | 端口 |
| protocol | string | 协议 |
| status | string | 状态 |
| health_score | tinyint | 健康评分 |
| load_percent | tinyint | 负载百分比 |
| active_connections | int | 活跃连接数 |

---

## 依赖关系

### 后端依赖

**核心框架：**
- express: ^4.18.2
- typescript: ^5.3.3
- knex: ^2.5.1
- mysql2: ^3.9.1
- ioredis: ^5.3.2

**安全与认证：**
- jsonwebtoken: ^9.0.2
- bcryptjs: ^2.4.3
- helmet: ^7.1.0
- cors: ^2.8.5

**支付集成：**
- stripe: ^14.14.0
- paypal-rest-sdk: ^1.8.1

**工具库：**
- winston: ^3.11.0
- zod: ^3.22.4
- dotenv: ^16.4.1
- axios: ^1.6.7
- node-cron: ^3.0.3

### 前端依赖

**核心框架：**
- vue: ^3.4.15
- typescript: ^5.3.3
- vite: ^5.0.12

**UI 组件：**
- element-plus: ^2.5.3
- @element-plus/icons-vue: ^2.3.1

**状态管理与路由：**
- pinia: ^2.1.7
- vue-router: ^4.2.5

**图表与工具：**
- echarts: ^5.4.3
- dayjs: ^1.11.10
- axios: ^1.6.7

**测试：**
- vitest: ^1.2.2
- @playwright/test: ^1.40.0

---

## 项目运行方式

### 开发环境

#### 使用 Docker Compose（推荐）

```bash
# 启动所有服务
cd /workspace/infrastructure/docker
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 本地开发

**1. 安装依赖：**

```bash
# 安装根目录依赖
cd /workspace
npm install

# 安装各应用依赖
cd apps/admin-api && npm install
cd ../admin-web && npm install
cd ../client-api && npm install
cd ../client-web && npm install
```

**2. 配置环境变量：**

复制各应用的 `.env.example` 为 `.env` 并配置相应的环境变量。

**3. 启动数据库和缓存：**

```bash
cd /workspace
docker-compose up -d mysql redis
```

**4. 运行数据库迁移：**

```bash
cd apps/admin-api
npm run db:migrate
npm run db:seed

cd ../client-api
npm run db:migrate
npm run db:seed
```

**5. 启动开发服务器：**

```bash
# Admin API
cd apps/admin-api
npm run dev

# Admin Web
cd ../admin-web
npm run dev

# Client API
cd ../client-api
npm run dev

# Client Web
cd ../client-web
npm run dev
```

### 生产环境

使用 `infrastructure/docker/docker-compose.prod.yml` 进行生产部署：

```bash
cd /workspace/infrastructure/docker
docker-compose -f docker-compose.prod.yml up -d
```

### 访问地址

| 服务 | 地址 |
|------|------|
| Admin Web | http://localhost:5173 |
| Client Web | http://localhost:5174 |
| Admin API | http://localhost:3001 |
| Client API | http://localhost:3002 |
| Xray API | http://localhost:10085 |
| phpMyAdmin | http://localhost:8080 |
| Grafana | http://localhost:3000 |
| Prometheus | http://localhost:9090 |

---

## 测试

### 后端测试

```bash
cd apps/admin-api
npm run test
npm run test:coverage

cd ../client-api
npm run test
npm run test:coverage
```

### 前端测试

```bash
cd apps/client-web
npm run test:run
npm run test:coverage
npm run test:e2e
```

---

## 构建与部署

### 构建应用

```bash
# Admin API
cd apps/admin-api
npm run build

# Admin Web
cd ../admin-web
npm run build

# Client API
cd ../client-api
npm run build

# Client Web
cd ../client-web
npm run build
```

### Docker 构建

每个应用都有自己的 `Dockerfile`，可以独立构建：

```bash
cd apps/admin-api
docker build -t omnicore-admin-api:latest .

cd ../admin-web
docker build -t omnicore-admin-web:latest .
```

---

## 开发指南

### 代码规范

项目使用 ESLint 和 Prettier 进行代码格式化和检查：

```bash
# 检查代码
npm run lint

# 自动修复
npm run lint:fix

# 格式化代码
npm run format
```

### Git 工作流

1. 创建功能分支
2. 提交代码（遵循约定式提交规范）
3. 推送并创建 Pull Request
4. 代码审查和合并

---

## 监控与运维

### 日志管理

- 使用 Winston 进行日志记录
- 日志文件按天轮转
- 日志目录：`./logs`

### 性能监控

- Prometheus 指标采集
- Grafana 可视化
- 健康检查端点：`/health`

### 备份与恢复

- MySQL 数据卷挂载
- Redis AOF 持久化
- 定期备份脚本

---

## 常见问题

### 数据库连接失败

检查：
- MySQL 容器是否正常运行
- 环境变量配置是否正确
- 数据库用户权限是否足够

### Redis 连接失败

检查：
- Redis 容器是否正常运行
- 端口是否被占用
- 连接配置是否正确

### Xray 服务异常

检查：
- Xray 容器日志
- API 端口连通性
- 配置文件正确性

---

## 参考资源

- [Express.js 文档](https://expressjs.com/)
- [Vue 3 文档](https://vuejs.org/)
- [Element Plus 文档](https://element-plus.org/)
- [Knex.js 文档](https://knexjs.org/)
- [Xray 文档](https://xtls.github.io/)

---

*文档版本：1.0.0*  
*最后更新：2026-04-05*
