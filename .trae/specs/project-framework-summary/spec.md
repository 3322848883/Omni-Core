# Omni Core 项目框架总结 - 产品需求文档

## Overview
- **Summary**: Omni Core 是一个现代化的 VPN 服务管理平台，采用前后端分离的微服务架构设计，提供完整的用户管理、节点管理、订阅管理、支付系统和监控功能。
- **Purpose**: 构建一个可扩展、安全、高性能的商业化 VPN 代理管理平台，支持多服务类型、多支付渠道、实时监控和完善的用户管理体系。
- **Target Users**: 系统管理员、运维人员、终端用户

## Goals
- 提供完整的 VPN 服务管理功能
- 支持多服务类型（标准、专线、独享、静态住宅IP）
- 集成多种支付方式（Stripe、PayPal、支付宝、微信支付）
- 实现实时流量监控和统计
- 提供 IP 池管理和 ISP 管理功能
- 实现邀请奖励系统
- 确保系统安全性和性能

## Non-Goals (Out of Scope)
- 不开发新的 VPN 协议（仅集成 Xray 核心）
- 不开发移动端 APP
- 不实现第三方社交媒体登录
- 不开发自定义防火墙规则
- 不实现 AI 驱动的智能路由

## Background & Context
项目采用现代化技术栈，包括：
- 后端：Node.js + Express + TypeScript + MySQL + Redis
- 前端：Vue 3 + TypeScript + Element Plus + Pinia
- 部署：Docker + Docker Compose + Nginx 反向代理
- 监控：Prometheus + Grafana
- VPN 核心：Xray-core

项目已具备完整的基础架构，包括用户认证、节点管理、订阅管理、支付集成等核心功能。

## Functional Requirements
- **FR-1**: 用户注册、登录、登出和密码重置
- **FR-2**: 用户信息管理和设备管理
- **FR-3**: 节点列表展示和筛选
- **FR-4**: 订阅计划购买和管理
- **FR-5**: 流量统计和可视化
- **FR-6**: 邀请码生成和奖励管理
- **FR-7**: 管理员后台功能（用户、节点、订单、配置）
- **FR-8**: Xray 核心集成和配置管理
- **FR-9**: 多支付渠道集成
- **FR-10**: IP 池和 ISP 管理

## Non-Functional Requirements
- **NFR-1**: 系统可用性 ≥ 99.9%
- **NFR-2**: API 响应时间 < 200ms（95% 的请求）
- **NFR-3**: 支持 10,000+ 并发用户
- **NFR-4**: 数据加密存储和传输
- **NFR-5**: 完善的日志记录和审计
- **NFR-6**: 多语言支持（中文、英文）
- **NFR-7**: 响应式设计，支持多种设备

## Constraints
- **Technical**: 必须使用现有的技术栈，不能大规模重构
- **Business**: 项目必须保持向后兼容
- **Dependencies**: 依赖 Xray-core、MySQL、Redis 等外部系统

## Assumptions
- 用户已有 Docker 和 Docker Compose 环境
- 数据库和缓存服务正常运行
- Xray 核心已正确配置
- 支付渠道凭证已正确配置

## Acceptance Criteria

### AC-1: 用户认证功能正常
- **Given**: 用户访问平台
- **When**: 用户注册、登录或重置密码
- **Then**: 功能正常执行，返回正确响应
- **Verification**: `programmatic`

### AC-2: 节点管理功能正常
- **Given**: 管理员登录后台
- **When**: 管理员添加、编辑或删除节点
- **Then**: 节点数据正确保存和展示
- **Verification**: `programmatic`

### AC-3: 支付功能正常
- **Given**: 用户选择支付方式
- **When**: 用户完成支付流程
- **Then**: 订单创建，订阅更新
- **Verification**: `programmatic`

### AC-4: 监控功能正常
- **Given**: 系统运行中
- **When**: 查看监控指标和日志
- **Then**: 监控数据正常展示
- **Verification**: `programmatic`

### AC-5: API 文档完整
- **Given**: 开发人员访问 API 文档
- **When**: 查看 Swagger 文档
- **Then**: 所有 API 接口有完整的文档说明
- **Verification**: `human-judgment`

### AC-6: 安全配置正确
- **Given**: 系统部署完成
- **When**: 检查安全配置
- **Then**: HTTPS 启用、速率限制启用、安全头正确设置
- **Verification**: `programmatic`

## Open Questions
- [ ] 是否需要添加更多支付渠道？
- [ ] 是否需要实现更多语言支持？
- [ ] 是否需要添加实时聊天支持？

