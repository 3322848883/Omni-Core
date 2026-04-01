#!/bin/bash

echo "==========================================================="
echo "Omni Core 全功能测试（授权版）"
echo "==========================================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 测试结果
PASS_COUNT=0
FAIL_COUNT=0
TOKEN=""

# 测试函数 - 检查响应是否包含 success:true
test_endpoint() {
    local url=$1
    local test_name=$2
    local use_token=${3:-false}
    
    echo "测试: $test_name"
    
    if [ "$use_token" = true ] && [ -n "$TOKEN" ]; then
        response=$(curl -s -H "Authorization: Bearer $TOKEN" "$url" 2>/dev/null)
    else
        response=$(curl -s "$url" 2>/dev/null)
    fi
    
    if echo "$response" | grep -q '"success":true' > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 通过${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
        return 0
    else
        echo -e "${RED}❌ 失败${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        echo "   响应: ${response:0:100}..."
        return 1
    fi
}

# 测试函数 - 检查响应是否包含 HTML 内容
test_html() {
    local url=$1
    local test_name=$2
    
    echo "测试: $test_name"
    
    response=$(curl -s "$url" 2>/dev/null)
    
    if echo "$response" | grep -q '<!DOCTYPE html>' > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 通过${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
        return 0
    else
        echo -e "${RED}❌ 失败${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        echo "   响应: ${response:0:50}..."
        return 1
    fi
}

echo ""
echo "=== 第一步：登录获取 Token ==="
echo ""

# 测试管理后台登录
echo "测试: 管理后台登录功能"
LOGIN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' \
    "http://localhost:3005/api/v1/admin/auth/login" 2>/dev/null)

if echo "$LOGIN_RESPONSE" | grep -q '"success":true' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 登录成功${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
    
    # 提取 token
    TOKEN=$(echo "$LOGIN_RESPONSE" | sed 's/.*"accessToken":"\([^"]*\)".*/\1/')
    echo "   Token: ${TOKEN:0:30}..."
else
    echo -e "${RED}❌ 登录失败${NC}"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    echo "   响应: $LOGIN_RESPONSE"
    exit 1
fi

echo ""
echo "=== 测试管理后台 API（使用授权 Token） ==="
echo ""

# 1. 健康检查
test_endpoint "http://localhost:3005/health" "管理后台健康检查" false

# 2. 公开配置
test_endpoint "http://localhost:3005/api/v1/admin/site-config/public" "管理后台公开配置" false

# 3. 用户列表
test_endpoint "http://localhost:3005/api/v1/admin/users" "管理后台用户列表" true

# 4. 节点列表
test_endpoint "http://localhost:3005/api/v1/admin/nodes" "管理后台节点列表" true

# 5. 订单列表
test_endpoint "http://localhost:3005/api/v1/admin/orders" "管理后台订单列表" true

# 6. 套餐列表
test_endpoint "http://localhost:3005/api/v1/admin/plans" "管理后台套餐列表" true

# 7. 服务类型
test_endpoint "http://localhost:3005/api/v1/admin/service-types" "管理后台服务类型" true

# 8. IP池列表
test_endpoint "http://localhost:3005/api/v1/admin/ip-pools" "管理后台IP池列表" true

# 9. ISP列表
test_endpoint "http://localhost:3005/api/v1/admin/isps" "管理后台ISP列表" true

# 10. 仪表盘统计
test_endpoint "http://localhost:3005/api/v1/admin/dashboard/stats" "管理后台仪表盘统计" true

# 11. 流量统计
test_endpoint "http://localhost:3005/api/v1/admin/traffic/stats" "管理后台流量统计" true

# 12. 邀请码统计
test_endpoint "http://localhost:3005/api/v1/admin/invites/stats" "管理后台邀请码统计" true

echo ""
echo "=== 测试用户端 API ==="
echo ""

# 1. 健康检查
test_endpoint "http://localhost:3002/health" "用户端健康检查" false

# 2. 用户信息 (需要授权)
test_endpoint "http://localhost:3002/api/v1/user/profile" "用户端用户信息 (未授权)" false

echo ""
echo "=== 测试前端页面 ==="
echo ""

# 1. 管理后台前端
test_html "http://localhost:8081/" "管理后台前端首页"

# 2. 用户端前端
test_html "http://localhost:8082/" "用户端前端首页"

# 3. 管理后台登录页
test_html "http://localhost:8081/login" "管理后台登录页"

# 4. 用户端登录页
test_html "http://localhost:8082/login" "用户端登录页"

echo ""
echo "==========================================================="
echo "测试总结"
echo "==========================================================="
echo ""
echo -e "${GREEN}总计: $((PASS_COUNT + FAIL_COUNT)) 个测试${NC}"
echo -e "${GREEN}通过: $PASS_COUNT 个${NC}"
echo -e "${RED}失败: $FAIL_COUNT 个${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}所有测试通过!${NC}"
    exit 0
else
    exit 1
fi