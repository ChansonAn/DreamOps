#!/usr/bin/env python3
import sys
sys.path.append('.')
import requests
import json

print("=== 测试API端点连接性 ===\n")

base_url = "http://localhost:8001"

# 测试的API端点
test_endpoints = [
    ("/api/health", "健康检查"),
    ("/api/auth/login", "登录接口"),
    ("/api/cmdb/config-items", "CMDB配置项"),
    ("/api/scripts", "脚本列表"),
    ("/api/task-schedules", "任务编排"),
]

all_success = True

for endpoint, description in test_endpoints:
    url = base_url + endpoint
    try:
        print(f"测试 {description} ({endpoint}):")
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            print(f"  ✅ 成功 (状态码: {response.status_code})")
            # 如果是数据接口，检查返回的数据
            if endpoint in ["/api/cmdb/config-items", "/api/scripts", "/api/task-schedules"]:
                data = response.json()
                if isinstance(data, list):
                    print(f"     返回 {len(data)} 条记录")
                elif isinstance(data, dict):
                    print(f"     返回字典数据")
        elif response.status_code == 404:
            print(f"  ⚠️  端点不存在 (状态码: {response.status_code})")
        elif response.status_code == 401:
            print(f"  🔐 需要认证 (状态码: {response.status_code})")
        else:
            print(f"  ❌ 失败 (状态码: {response.status_code})")
            all_success = False
            
    except requests.exceptions.ConnectionError:
        print(f"  ❌ 连接失败 - 后端服务可能未运行")
        all_success = False
    except requests.exceptions.Timeout:
        print(f"  ⏰ 请求超时")
        all_success = False
    except Exception as e:
        print(f"  ❌ 错误: {e}")
        all_success = False
    
    print()

# 测试登录功能
print("测试登录功能:")
login_url = base_url + "/api/auth/login"
login_data = {
    "username": "admin",
    "password": "admin123"
}

try:
    response = requests.post(login_url, json=login_data, timeout=5)
    if response.status_code == 200:
        result = response.json()
        token = result.get('access_token')
        if token:
            print(f"  ✅ 登录成功，获取到token")
            # 测试带token的请求
            headers = {"Authorization": f"Bearer {token}"}
            test_response = requests.get(base_url + "/api/cmdb/config-items", headers=headers, timeout=5)
            if test_response.status_code == 200:
                print(f"  ✅ 带token的API请求成功")
            else:
                print(f"  ❌ 带token的API请求失败: {test_response.status_code}")
        else:
            print(f"  ⚠️  登录成功但未返回token")
    elif response.status_code == 401:
        print(f"  🔐 登录失败: 用户名或密码错误")
    else:
        print(f"  ❌ 登录请求失败: {response.status_code}")
except Exception as e:
    print(f"  ❌ 登录测试错误: {e}")

print(f"\n{'='*50}")
if all_success:
    print("✅ 所有API端点测试通过！")
else:
    print("⚠️  部分API端点存在问题，需要进一步检查。")