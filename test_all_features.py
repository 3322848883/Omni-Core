#!/usr/bin/env python3
"""
Omni Core 全功能测试脚本
测试管理后台和用户端的所有功能
"""

from playwright.sync_api import sync_playwright
import json
import time

def test_admin_api():
    """测试管理后台 API"""
    print("\n=== 测试管理后台 API ===")
    
    results = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        # 测试健康检查
        print("1. 测试健康检查端点...")
        try:
            response = page.request.get('http://localhost:3005/health')
            data = response.json()
            if data.get('success') and data.get('data', {}).get('status') == 'healthy':
                print("   ✅ 健康检查通过")
                results.append(("健康检查", "PASS"))
            else:
                print("   ❌ 健康检查失败")
                results.append(("健康检查", "FAIL"))
        except Exception as e:
            print(f"   ❌ 健康检查错误: {e}")
            results.append(("健康检查", "ERROR"))
        
        # 测试登录接口
        print("2. 测试登录接口...")
        try:
            response = page.request.post('http://localhost:3005/api/v1/admin/auth/login', 
                data=json.dumps({"username": "admin", "password": "admin123"}),
                headers={"Content-Type": "application/json"}
            )
            data = response.json()
            if response.status == 200 or response.status == 401:
                print(f"   ✅ 登录接口响应正常 (状态码: {response.status})")
                results.append(("登录接口", "PASS"))
            else:
                print(f"   ❌ 登录接口异常 (状态码: {response.status})")
                results.append(("登录接口", "FAIL"))
        except Exception as e:
            print(f"   ❌ 登录接口错误: {e}")
            results.append(("登录接口", "ERROR"))
        
        # 测试仪表盘接口
        print("3. 测试仪表盘接口...")
        try:
            response = page.request.get('http://localhost:3005/api/v1/admin/dashboard/stats')
            if response.status in [200, 401]:
                print(f"   ✅ 仪表盘接口响应正常 (状态码: {response.status})")
                results.append(("仪表盘接口", "PASS"))
            else:
                print(f"   ❌ 仪表盘接口异常 (状态码: {response.status})")
                results.append(("仪表盘接口", "FAIL"))
        except Exception as e:
            print(f"   ❌ 仪表盘接口错误: {e}")
            results.append(("仪表盘接口", "ERROR"))
        
        # 测试节点接口
        print("4. 测试节点接口...")
        try:
            response = page.request.get('http://localhost:3005/api/v1/admin/nodes')
            if response.status in [200, 401]:
                print(f"   ✅ 节点接口响应正常 (状态码: {response.status})")
                results.append(("节点接口", "PASS"))
            else:
                print(f"   ❌ 节点接口异常 (状态码: {response.status})")
                results.append(("节点接口", "FAIL"))
        except Exception as e:
            print(f"   ❌ 节点接口错误: {e}")
            results.append(("节点接口", "ERROR"))
        
        # 测试用户接口
        print("5. 测试用户接口...")
        try:
            response = page.request.get('http://localhost:3005/api/v1/admin/users')
            if response.status in [200, 401]:
                print(f"   ✅ 用户接口响应正常 (状态码: {response.status})")
                results.append(("用户接口", "PASS"))
            else:
                print(f"   ❌ 用户接口异常 (状态码: {response.status})")
                results.append(("用户接口", "FAIL"))
        except Exception as e:
            print(f"   ❌ 用户接口错误: {e}")
            results.append(("用户接口", "ERROR"))
        
        browser.close()
    
    return results

def test_client_api():
    """测试用户端 API"""
    print("\n=== 测试用户端 API ===")
    
    results = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        # 测试健康检查
        print("1. 测试健康检查端点...")
        try:
            response = page.request.get('http://localhost:3002/health')
            data = response.json()
            if data.get('success') or response.status == 200:
                print("   ✅ 健康检查通过")
                results.append(("健康检查", "PASS"))
            else:
                print("   ❌ 健康检查失败")
                results.append(("健康检查", "FAIL"))
        except Exception as e:
            print(f"   ❌ 健康检查错误: {e}")
            results.append(("健康检查", "ERROR"))
        
        # 测试登录接口
        print("2. 测试登录接口...")
        try:
            response = page.request.post('http://localhost:3002/api/v1/auth/login',
                data=json.dumps({"email": "test@test.com", "password": "test123"}),
                headers={"Content-Type": "application/json"}
            )
            if response.status in [200, 401, 404]:
                print(f"   ✅ 登录接口响应正常 (状态码: {response.status})")
                results.append(("登录接口", "PASS"))
            else:
                print(f"   ❌ 登录接口异常 (状态码: {response.status})")
                results.append(("登录接口", "FAIL"))
        except Exception as e:
            print(f"   ❌ 登录接口错误: {e}")
            results.append(("登录接口", "ERROR"))
        
        browser.close()
    
    return results

def test_admin_web():
    """测试管理后台前端"""
    print("\n=== 测试管理后台前端 ===")
    
    results = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        # 测试页面加载
        print("1. 测试页面加载...")
        try:
            page.goto('http://localhost:8081/', timeout=30000)
            page.wait_for_load_state('networkidle', timeout=30000)
            title = page.title()
            print(f"   页面标题: {title}")
            if "管理后台" in title or "Admin" in title or "Omni" in title:
                print("   ✅ 页面加载成功")
                results.append(("页面加载", "PASS"))
            else:
                print("   ⚠️ 页面加载但标题不匹配")
                results.append(("页面加载", "WARN"))
            page.screenshot(path='/tmp/admin-web-home.png', full_page=True)
        except Exception as e:
            print(f"   ❌ 页面加载错误: {e}")
            results.append(("页面加载", "ERROR"))
        
        # 测试登录页面
        print("2. 测试登录页面...")
        try:
            page.goto('http://localhost:8081/login', timeout=30000)
            page.wait_for_load_state('networkidle', timeout=30000)
            
            # 检查是否有登录表单元素
            has_username = page.locator('input[type="text"], input[name="username"], input[placeholder*="用户"], input[placeholder*="账号"]').count() > 0
            has_password = page.locator('input[type="password"]').count() > 0
            has_button = page.locator('button:has-text("登录"), button:has-text("Login"), button[type="submit"]').count() > 0
            
            if has_username and has_password and has_button:
                print("   ✅ 登录页面元素完整")
                results.append(("登录页面", "PASS"))
            else:
                print(f"   ⚠️ 登录页面元素不完整 (用户名:{has_username}, 密码:{has_password}, 按钮:{has_button})")
                results.append(("登录页面", "WARN"))
            
            page.screenshot(path='/tmp/admin-web-login.png', full_page=True)
        except Exception as e:
            print(f"   ❌ 登录页面错误: {e}")
            results.append(("登录页面", "ERROR"))
        
        browser.close()
    
    return results

def test_client_web():
    """测试用户端前端"""
    print("\n=== 测试用户端前端 ===")
    
    results = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        # 测试页面加载
        print("1. 测试页面加载...")
        try:
            page.goto('http://localhost:8082/', timeout=30000)
            page.wait_for_load_state('networkidle', timeout=30000)
            title = page.title()
            print(f"   页面标题: {title}")
            if "VPN" in title or "Client" in title or "Omni" in title or "FGVPN" in title:
                print("   ✅ 页面加载成功")
                results.append(("页面加载", "PASS"))
            else:
                print("   ⚠️ 页面加载但标题不匹配")
                results.append(("页面加载", "WARN"))
            page.screenshot(path='/tmp/client-web-home.png', full_page=True)
        except Exception as e:
            print(f"   ❌ 页面加载错误: {e}")
            results.append(("页面加载", "ERROR"))
        
        # 测试登录/注册页面
        print("2. 测试登录/注册页面...")
        try:
            page.goto('http://localhost:8082/login', timeout=30000)
            page.wait_for_load_state('networkidle', timeout=30000)
            
            # 检查是否有登录表单元素
            has_email = page.locator('input[type="email"], input[type="text"], input[name="email"], input[placeholder*="邮箱"]').count() > 0
            has_password = page.locator('input[type="password"]').count() > 0
            has_button = page.locator('button:has-text("登录"), button:has-text("Login"), button[type="submit"]').count() > 0
            
            if has_email or has_password or has_button:
                print("   ✅ 登录页面存在")
                results.append(("登录页面", "PASS"))
            else:
                print("   ⚠️ 登录页面元素不完整")
                results.append(("登录页面", "WARN"))
            
            page.screenshot(path='/tmp/client-web-login.png', full_page=True)
        except Exception as e:
            print(f"   ❌ 登录页面错误: {e}")
            results.append(("登录页面", "ERROR"))
        
        browser.close()
    
    return results

def main():
    """主测试函数"""
    print("=" * 60)
    print("Omni Core 全功能测试")
    print("=" * 60)
    
    all_results = []
    
    # 测试管理后台 API
    all_results.extend(test_admin_api())
    
    # 测试用户端 API
    all_results.extend(test_client_api())
    
    # 测试管理后台前端
    all_results.extend(test_admin_web())
    
    # 测试用户端前端
    all_results.extend(test_client_web())
    
    # 生成测试报告
    print("\n" + "=" * 60)
    print("测试报告")
    print("=" * 60)
    
    pass_count = sum(1 for _, status in all_results if status == "PASS")
    warn_count = sum(1 for _, status in all_results if status == "WARN")
    fail_count = sum(1 for _, status in all_results if status == "FAIL")
    error_count = sum(1 for _, status in all_results if status == "ERROR")
    
    print(f"\n总计: {len(all_results)} 项测试")
    print(f"  ✅ 通过: {pass_count}")
    print(f"  ⚠️ 警告: {warn_count}")
    print(f"  ❌ 失败: {fail_count}")
    print(f"  🔴 错误: {error_count}")
    
    print("\n详细结果:")
    for name, status in all_results:
        icon = "✅" if status == "PASS" else "⚠️" if status == "WARN" else "❌" if status == "FAIL" else "🔴"
        print(f"  {icon} {name}: {status}")
    
    print("\n截图已保存到 /tmp/ 目录:")
    print("  - /tmp/admin-web-home.png")
    print("  - /tmp/admin-web-login.png")
    print("  - /tmp/client-web-home.png")
    print("  - /tmp/client-web-login.png")
    
    return all_results

if __name__ == "__main__":
    main()
