# 套餐服务体系升级 - API文档

## 概述

本文档描述了套餐服务体系升级后的API接口，包括IP池管理、服务类型管理和套餐管理的新增和更新接口。

## 基础信息

- **Base URL**: `/api/v1`
- **认证方式**: Bearer Token
- **内容类型**: `application/json`

## IP池管理API

### 1. 获取IP池列表

```http
GET /ip-pools
```

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | integer | 否 | 页码，默认1 |
| limit | integer | 否 | 每页数量，默认20，最大100 |
| nodeId | string | 否 | 按节点ID筛选 |
| ipType | string | 否 | 按IP类型筛选(datacenter/residential_dynamic/residential_static/mobile) |
| isActive | boolean | 否 | 按激活状态筛选 |

**响应示例**:

```json
{
  "success": true,
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "pool-uuid",
        "name": "机房IP池-节点1",
        "nodeId": "node-uuid",
        "nodeCode": "NODE001",
        "nodeName": "香港节点1",
        "nodeStatus": "online",
        "ipType": "datacenter",
        "ipTypeLabel": "机房",
        "rotationStrategy": "round_robin",
        "rotationStrategyLabel": "轮询",
        "rotationInterval": 86400,
        "currentIndex": 0,
        "lastRotationAt": "2024-03-21T10:00:00Z",
        "isActive": true,
        "ipStats": {
          "total": 10,
          "active": 8,
          "blocked": 2
        },
        "createdAt": "2024-03-21T08:00:00Z",
        "updatedAt": "2024-03-21T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 2. 获取IP池详情

```http
GET /ip-pools/:id
```

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | IP池ID |

**响应示例**:

```json
{
  "success": true,
  "code": 200,
  "message": "success",
  "data": {
    "id": "pool-uuid",
    "name": "机房IP池-节点1",
    "nodeId": "node-uuid",
    "nodeCode": "NODE001",
    "nodeName": "香港节点1",
    "nodeStatus": "online",
    "currentNodeIp": "192.168.1.1",
    "ipType": "datacenter",
    "ipTypeLabel": "机房",
    "rotationStrategy": "round_robin",
    "rotationStrategyLabel": "轮询",
    "rotationInterval": 86400,
    "currentIndex": 0,
    "lastRotationAt": "2024-03-21T10:00:00Z",
    "nextRotationAt": "2024-03-22T10:00:00Z",
    "isActive": true,
    "ipStats": {
      "total": 10,
      "active": 8,
      "blocked": 2,
      "inactive": 0
    },
    "currentIp": "192.168.1.1",
    "ips": [
      {
        "id": "ip-uuid-1",
        "ip": "192.168.1.1",
        "status": "active",
        "score": 85,
        "usageCount": 100,
        "assignedAt": "2024-03-21T10:00:00Z",
        "releasedAt": null,
        "createdAt": "2024-03-21T08:00:00Z"
      }
    ],
    "createdAt": "2024-03-21T08:00:00Z",
    "updatedAt": "2024-03-21T10:00:00Z"
  }
}
```

### 3. 创建IP池

```http
POST /ip-pools
```

**请求体**:

```json
{
  "name": "机房IP池-节点1",
  "nodeId": "node-uuid",
  "ipType": "datacenter",
  "ips": ["192.168.1.1", "192.168.1.2", "192.168.1.3"],
  "rotationStrategy": "round_robin",
  "rotationInterval": 86400
}
```

**字段说明**:

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 是 | IP池名称 |
| nodeId | string | 是 | 关联节点ID |
| ipType | string | 是 | IP类型：datacenter/residential_dynamic/residential_static/mobile |
| ips | array | 是 | IP地址列表 |
| rotationStrategy | string | 否 | 轮换策略：round_robin/random/least_used/quality_first，默认round_robin |
| rotationInterval | integer | 否 | 轮换间隔（秒），默认86400 |

**响应示例**:

```json
{
  "success": true,
  "code": 201,
  "message": "IP pool created successfully",
  "data": {
    "id": "pool-uuid",
    "name": "机房IP池-节点1",
    "nodeId": "node-uuid",
    "ipType": "datacenter",
    "ipTypeLabel": "机房",
    "rotationStrategy": "round_robin",
    "rotationInterval": 86400,
    "currentIndex": 0,
    "isActive": true,
    "createdAt": "2024-03-21T08:00:00Z",
    "updatedAt": "2024-03-21T08:00:00Z"
  }
}
```

### 4. 更新IP池

```http
PUT /ip-pools/:id
```

**请求体**:

```json
{
  "name": "更新后的名称",
  "rotationStrategy": "quality_first",
  "rotationInterval": 3600,
  "isActive": true
}
```

### 5. 删除IP池

```http
DELETE /ip-pools/:id
```

### 6. 手动轮换IP

```http
POST /ip-pools/:id/rotate
```

**响应示例**:

```json
{
  "success": true,
  "code": 200,
  "message": "IP rotated successfully",
  "data": {
    "poolId": "pool-uuid",
    "previousIp": "192.168.1.1",
    "newIp": "192.168.1.2",
    "rotatedAt": "2024-03-21T10:00:00Z"
  }
}
```

### 7. 添加IP到池

```http
POST /ip-pools/:id/ips
```

**请求体**:

```json
{
  "ip": "192.168.1.100"
}
```

### 8. 从池中移除IP

```http
DELETE /ip-pools/:id/ips/:ipId
```

### 9. 刷新IP评分

```http
POST /ip-pools/:id/refresh-scores
```

### 10. 获取轮换策略列表

```http
GET /ip-pools/meta/rotation-strategies
```

**响应示例**:

```json
{
  "success": true,
  "code": 200,
  "message": "success",
  "data": [
    {
      "value": "round_robin",
      "label": "轮询",
      "description": "按顺序循环使用IP池中的IP"
    },
    {
      "value": "random",
      "label": "随机",
      "description": "随机选择IP池中的IP"
    },
    {
      "value": "least_used",
      "label": "最少使用",
      "description": "优先选择使用次数最少的IP"
    },
    {
      "value": "quality_first",
      "label": "质量优先",
      "description": "优先选择评分最高的IP"
    }
  ]
}
```

## 服务类型管理API

### 1. 获取服务类型列表

```http
GET /service-types
```

**响应示例**:

```json
{
  "success": true,
  "code": 200,
  "message": "success",
  "data": [
    {
      "type": "standard",
      "label": "标准服务",
      "description": "标准国际线路服务",
      "color": "#3B82F6",
      "icon": "globe",
      "priority": 1,
      "features": ["大流量", "多节点", "基础速度"]
    },
    {
      "type": "dedicated_line",
      "label": "专线服务",
      "description": "高质量专线，低延迟高稳定",
      "color": "#F59E0B",
      "icon": "zap",
      "priority": 2,
      "features": ["CN2/IEPL专线", "低延迟", "高稳定"]
    },
    {
      "type": "exclusive",
      "label": "独享服务",
      "description": "独立IP资源，单用户专用",
      "color": "#EC4899",
      "icon": "shield",
      "priority": 3,
      "features": ["独立IP", "IPLC专线", "企业级"]
    }
  ]
}
```

### 2. 获取服务类型统计

```http
GET /service-types/stats
```

**响应示例**:

```json
{
  "success": true,
  "code": 200,
  "message": "success",
  "data": {
    "byType": [
      {
        "serviceType": "standard",
        "label": "标准服务",
        "description": "标准国际线路服务",
        "color": "#3B82F6",
        "icon": "globe",
        "priority": 1,
        "nodes": {
          "total": 50,
          "online": 45,
          "offline": 5
        },
        "users": {
          "total": 1200
        },
        "connections": {
          "total": 3500
        },
        "bandwidth": {
          "totalLimit": 50000,
          "unit": "Mbps"
        }
      }
    ],
    "totals": {
      "nodes": 100,
      "onlineNodes": 90,
      "users": 2500,
      "connections": 8000,
      "bandwidth": 100000
    }
  }
}
```

### 3. 获取指定服务类型的详细统计

```http
GET /service-types/:type/stats
```

### 4. 获取指定服务类型的节点列表

```http
GET /service-types/:type/nodes?page=1&limit=20
```

### 5. 获取服务类型分组信息

```http
GET /service-types/groups/all
```

### 6. 获取服务类型概览（仪表盘）

```http
GET /service-types/overview/dashboard
```

## 套餐管理API更新

### 1. 获取套餐列表（增强版）

```http
GET /plans
```

**新增查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| serviceType | string | 否 | 按服务类型筛选 |
| group | string | 否 | 按套餐组筛选 |

**响应字段更新**:

```json
{
  "success": true,
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "plan-uuid",
        "name": "基础套餐",
        "description": "适合日常使用的经济型套餐",
        "group": "airport",
        "price": 9.99,
        "durationDays": 30,
        "trafficLimit": 107374182400,
        "serviceTypes": ["standard"],
        "primaryServiceType": "standard",
        "priorityBoost": 0,
        "guaranteedBandwidth": 0,
        "maxConnections": 3,
        "features": ["标准线路", "100GB流量", "3设备同时在线"],
        "isActive": true,
        "sortOrder": 1,
        "createdAt": "2024-03-21T08:00:00Z",
        "updatedAt": "2024-03-21T08:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

### 2. 创建套餐（增强版）

```http
POST /plans
```

**请求体**:

```json
{
  "name": "基础套餐",
  "description": "适合日常使用的经济型套餐",
  "group": "airport",
  "price": 9.99,
  "durationDays": 30,
  "trafficLimit": 107374182400,
  "serviceTypes": ["standard"],
  "primaryServiceType": "standard",
  "priorityBoost": 0,
  "guaranteedBandwidth": 0,
  "maxConnections": 3,
  "features": ["标准线路", "100GB流量", "3设备同时在线"],
  "isActive": true,
  "sortOrder": 1
}
```

**新增字段说明**:

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| group | string | 否 | 套餐组：airport/dedicated/residential/exclusive，默认standard |
| serviceTypes | array | 是 | 服务类型列表 |
| primaryServiceType | string | 是 | 主服务类型 |
| priorityBoost | integer | 否 | 优先级提升值，默认0 |
| guaranteedBandwidth | integer | 否 | 保证带宽(Mbps)，默认0 |
| maxConnections | integer | 否 | 最大连接数，默认3 |

### 3. 获取套餐统计

```http
GET /plans/:id/stats
```

**响应示例**:

```json
{
  "success": true,
  "code": 200,
  "message": "success",
  "data": {
    "planId": "plan-uuid",
    "planName": "基础套餐",
    "totalSubscriptions": 1000,
    "activeSubscriptions": 800,
    "expiredSubscriptions": 200,
    "totalRevenue": 9990.00,
    "monthlyRevenue": 999.00,
    "averageSubscriptionDuration": 28.5,
    "userRetentionRate": 80.00,
    "subscriptionsByServiceType": {
      "standard": 1000,
      "dedicated_line": 0,
      "exclusive": 0
    },
    "growthTrend": [
      {
        "period": "2024-03",
        "newSubscriptions": 100,
        "churnedSubscriptions": 20,
        "netGrowth": 80
      }
    ]
  }
}
```

### 4. 获取套餐组列表

```http
GET /plans/groups
```

**响应示例**:

```json
{
  "success": true,
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "airport",
      "name": "机场大流量套餐",
      "description": "大流量机房节点，适合下载和视频观看",
      "serviceTypes": ["standard"],
      "icon": "plane",
      "color": "#3B82F6",
      "recommendedFor": ["大流量下载", "视频观看", "日常代理"],
      "planCount": 5
    },
    {
      "id": "dedicated",
      "name": "专线加速套餐",
      "description": "高质量专线，低延迟高稳定",
      "serviceTypes": ["dedicated_line"],
      "icon": "crown",
      "color": "#F59E0B",
      "recommendedFor": ["游戏加速", "视频流媒体", "高频交易"],
      "planCount": 3
    },
    {
      "id": "residential",
      "name": "住宅IP套餐",
      "description": "真实家庭宽带IP，适合流媒体解锁和账号注册",
      "serviceTypes": ["standard"],
      "icon": "home",
      "color": "#10B981",
      "recommendedFor": ["流媒体解锁", "账号注册", "防追踪"],
      "planCount": 2
    },
    {
      "id": "exclusive",
      "name": "独享IP套餐",
      "description": "独立IP资源，单用户专用",
      "serviceTypes": ["exclusive"],
      "icon": "shield",
      "color": "#EC4899",
      "recommendedFor": ["企业用户", "IP敏感业务", "高安全需求"],
      "planCount": 1
    }
  ]
}
```

## 错误码

| 错误码 | HTTP状态码 | 说明 |
|--------|------------|------|
| BAD_REQUEST | 400 | 请求参数错误 |
| VALIDATION_ERROR | 400 | 数据验证失败 |
| UNAUTHORIZED | 401 | 未认证 |
| FORBIDDEN | 403 | 无权限 |
| NOT_FOUND | 404 | 资源不存在 |
| CONFLICT | 409 | 资源冲突 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

## 速率限制

- 认证接口: 5次/分钟
- 普通接口: 100次/分钟
- 批量操作接口: 10次/分钟

## 缓存策略

| 数据类型 | 缓存时间 | 说明 |
|----------|----------|------|
| IP声誉数据 | 24小时 | IP评分缓存 |
| IP池状态 | 5分钟 | 实时性要求较高 |
| 套餐列表 | 10分钟 | 相对稳定 |
| 服务类型统计 | 1分钟 | 需要较新数据 |
| 节点列表 | 2分钟 | 状态变化较快 |

## 更新日志

### v2.0.0 (2024-03-21)

- 新增IP池管理API
- 新增服务类型管理API
- 增强套餐管理API
- 新增套餐组概念
- 新增服务类型权益验证
- 优化API响应性能
