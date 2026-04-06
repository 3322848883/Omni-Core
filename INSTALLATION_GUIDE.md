# FGVPN 安装指南

**日期**: 2024-03-21  
**Node.js 版本**: v24.14.0  
**npm 版本**: 11.9.0

---

## 安装状态摘要

| 组件 | 状态 | 说明 |
|------|------|------|
| Node.js 环境 | ✅ | v24.14.0 已就绪 |
| 管理端后端依赖 | ✅ | 安装成功 (581 packages) |
| 管理端前端依赖 | ⚠️ | 遇到 esbuild 问题 |
| Docker 服务 | ⏳ | 待启动 |
| 数据库迁移 | ⏳ | 待执行 |

---

## 已完成的安装步骤

### 1. 环境检查 ✅

```powershell
node --version  # v24.14.0
npm --version   # 11.9.0
```

### 2. 管理端后端依赖安装 ✅

```powershell
cd apps/admin-api
npm install
```

**结果**: 成功安装 581 个包

---

## 待完成的安装步骤

### 步骤 1: 修复并安装管理端前端依赖

由于 Windows 上 esbuild 的已知问题，请按以下步骤操作：

#### 方法 A: 使用 npm 配置 (推荐)

```powershell
# 1. 进入管理端前端目录
cd apps/admin-api

# 2. 配置 npm 使用正确的架构
npm config set platform win32
npm config set arch x64

# 3. 清理并重新安装
cd ../admin-web
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install
```

#### 方法 B: 手动安装 esbuild

```powershell
# 1. 进入管理端前端目录
cd apps/admin-web

# 2. 先安装 esbuild
npm install esbuild@0.19.12 --save-dev

# 3. 然后安装其他依赖
npm install
```

#### 方法 C: 使用 yarn (如果 npm 有问题)

```powershell
# 1. 安装 yarn
npm install -g yarn

# 2. 使用 yarn 安装依赖
cd apps/admin-web
yarn install
```

### 步骤 2: 启动 Docker 服务

```powershell
# 1. 进入 Docker 目录
cd infrastructure/docker

# 2. 确保 .env 文件已创建
if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
}

# 3. 启动 Docker 服务
docker-compose up -d

# 4. 检查服务状态
docker-compose ps
```

### 步骤 3: 运行数据库迁移

```powershell
# 1. 确保在根目录
cd D:\BaiduNetdiskDownload\FGVPN

# 2. 运行迁移
cd apps/admin-api
npx knex migrate:latest

# 3. 运行种子
npx knex seed:run
```

### 步骤 4: 启动开发服务器

```powershell
# 终端 1: 启动管理端后端
cd apps/admin-api
npm run dev

# 终端 2: 启动管理端前端
cd apps/admin-web
npm run dev
```

---

## 常见问题解决

### 问题 1: esbuild EFTYPE 错误

**症状**: 
```
Error: spawnSync ...\esbuild.exe EFTYPE
```

**解决**:
```powershell
# 1. 删除 node_modules
Remove-Item -Recurse -Force node_modules

# 2. 清理 npm 缓存
npm cache clean --force

# 3. 重新安装
npm install
```

### 问题 2: PowerShell 执行策略

**症状**:
```
无法加载文件 ...\npm.ps1，因为在此系统上禁止运行脚本
```

**解决**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
```

### 问题 3: 端口被占用

**症状**:
```
Error: listen EADDRINUSE: address already in use :::3001
```

**解决**:
```powershell
# 查找占用端口的进程
netstat -ano | findstr :3001

# 结束进程 (将 <PID> 替换为实际的进程 ID)
taskkill /PID <PID> /F
```

### 问题 4: Docker 启动失败

**症状**:
```
Error: No such image: mysql:8.0
```

**解决**:
```powershell
# 拉取镜像
docker-compose pull

# 重新启动
docker-compose up -d
```

---

## 验证安装

### 1. 检查后端服务

```powershell
# 访问健康检查端点
Invoke-RestMethod -Uri http://localhost:3001/health
```

预期输出:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "...",
    "version": "1.0.0"
  }
}
```

### 2. 检查前端服务

打开浏览器访问: http://localhost:5173

应该看到登录页面。

### 3. 检查 Docker 服务

```powershell
cd infrastructure/docker
docker-compose ps
```

预期看到以下服务运行:
- mysql
- redis
- xray
- admin-api (如果使用 Docker)
- nginx
- prometheus
- grafana

---

## 默认账号

安装完成后，可以使用以下账号登录:

| 用户名 | 密码 | 角色 |
|--------|------|------|
| superadmin | admin123 | 超级管理员 |
| admin | admin123 | 管理员 |
| operator | admin123 | 运营人员 |

---

## 下一步

安装完成后，可以:

1. **开始开发**: 访问 http://localhost:5173 进行开发
2. **查看文档**: 阅读 `spec.md` 了解项目规范
3. **查看任务**: 阅读 `tasks.md` 了解开发任务
4. **启动监控**: 访问 http://localhost:3000 (Grafana)

---

## 获取帮助

如果遇到问题:

1. 查看错误日志: `apps/admin-api/logs/`
2. 检查 Docker 日志: `docker-compose logs <service-name>`
3. 查看 npm 日志: `%APPDATA%\npm-cache\_logs\`

---

**安装指南版本**: v1.0.0  
**最后更新**: 2024-03-21
