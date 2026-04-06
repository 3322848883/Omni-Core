# Omni Core - High-performance VPN Service Platform

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.4-green)](https://vuejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

Omni Core 是一个高性能的 VPN 服务平台，基于 Xray-Core 构建，支持多种协议（VLESS、VMess、Trojan、Shadowsocks），提供完整的用户管理、订单系统、流量监控和节点管理功能。

## 功能特性

### 核心功能
- ✅ **多协议支持**: VLESS + REALITY、VLESS + WebSocket、Trojan、Shadowsocks
- ✅ **智能路由**: 国内流量直连，海外流量代理，广告拦截
- ✅ **中转模式**: 支持国内中转服务器 + 海外落地服务器架构
- ✅ **流量监控**: 实时流量统计、预警、限速管理
- ✅ **邀请系统**: 完整的邀请好友、奖励机制、防刷检测

### 管理后台
- 👥 **用户管理**: 用户CRUD、流量管理、状态控制
- 📦 **订单管理**: 套餐管理、支付集成、订单状态跟踪
- 🌐 **节点管理**: 多地区节点、负载均衡、健康检查
- 📊 **数据监控**: 实时仪表盘、流量趋势、收入统计
- ⚙️ **系统配置**: 动态配置、版本控制、灰度发布

### 技术栈

#### 后端
- **Runtime**: Node.js 18+ / Express
- **Language**: TypeScript 5.3
- **Database**: MySQL 8.0 + Redis 7.0
- **ORM**: Knex.js
- **Authentication**: JWT + bcrypt
- **Documentation**: Swagger/OpenAPI

#### 前端
- **Framework**: Vue 3.4 + Composition API
- **Build Tool**: Vite 5.0
- **UI Library**: Element Plus
- **State Management**: Pinia
- **Charts**: ECharts

#### 基础设施
- **VPN Core**: Xray-Core v1.8.0+
- **Container**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Monitoring**: Prometheus + Grafana

## 项目结构

```
Omni Core/
├── apps/
│   ├── admin-api/          # 管理端后端 API
│   ├── admin-web/          # 管理端前端
│   ├── client-api/         # 用户端后端 API
│   └── client-web/         # 用户端前端
├── shared/
│   ├── types/              # 共享类型定义
│   ├── constants/          # 共享常量
│   └── utils/              # 共享工具函数
├── infrastructure/
│   └── docker/             # Docker 编排配置
├── docs/                   # 文档
├── spec.md                 # 项目规范
├── tasks.md                # 开发任务
└── checklist.md            # 验收清单
```

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker >= 24.0.0
- Docker Compose >= 2.0.0

### 安装步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd omni-core
```

2. **安装依赖**

```bash
npm install
```

3. **配置环境变量**

```bash
# 管理端后端
cp apps/admin-api/.env.example apps/admin-api/.env

# 管理端前端
cp apps/admin-web/.env.example apps/admin-web/.env

# Docker 环境
cp infrastructure/docker/.env.example infrastructure/docker/.env
```

4. **启动 Docker 服务**

```bash
cd infrastructure/docker
docker-compose up -d
```

5. **运行数据库迁移**

```bash
npm run db:migrate -w @omnicore/admin-api
npm run db:seed -w @omnicore/admin-api
```

6. **启动开发服务器**

```bash
# 终端 1: 管理端后端
npm run dev:admin-api

# 终端 2: 管理端前端
npm run dev:admin-web
```

7. **访问应用**

- 管理后台: http://localhost:5173
- 管理 API: http://localhost:3001
- Grafana: http://localhost:3000
- Prometheus: http://localhost:9090

### 默认账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| superadmin | admin123 | 超级管理员 |
| admin | admin123 | 管理员 |
| operator | admin123 | 运营人员 |

## 开发指南

### 可用脚本

```bash
# 启动开发服务器
npm run dev:admin-api      # 管理端后端
npm run dev:admin-web      # 管理端前端
npm run dev:client-api     # 用户端后端
npm run dev:client-web     # 用户端前端

# 构建
npm run build:admin-api    # 构建管理端后端
npm run build:admin-web    # 构建管理端前端

# 代码检查
npm run lint               # 运行 ESLint
npm run lint:fix           # 修复 ESLint 错误

# 测试
npm run test               # 运行测试
npm run test:coverage      # 运行测试并生成覆盖率报告

# 数据库
npm run db:migrate         # 运行迁移
npm run db:rollback        # 回滚迁移
npm run db:seed            # 运行种子

# Docker
npm run docker:up          # 启动 Docker 服务
npm run docker:down        # 停止 Docker 服务
npm run docker:build       # 构建 Docker 镜像
```

### 开发工作流

1. **创建功能分支**
```bash
git checkout -b feature/your-feature-name
```

2. **开发并提交**
```bash
git add .
git commit -m "feat: your feature description"
```

3. **运行测试**
```bash
npm run test
npm run lint
```

4. **提交 PR**

## 文档

- [项目规范](spec.md) - 详细的技术规范和架构设计
- [开发任务](tasks.md) - 开发任务清单和进度
- [验收清单](checklist.md) - 功能验收标准
- [环境配置指南](ENVIRONMENT_SETUP_GUIDE.md) - 环境配置详细说明

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

[MIT](LICENSE) © Omni Core Team
