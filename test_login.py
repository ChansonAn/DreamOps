import requests
import json

def test_login_functionality():
    """测试登录功能"""
    print("=== 测试系统登录功能 ===\n")
    
    backend_url = "http://localhost:8001"
    
    print("1. 测试登录API:")
    login_url = f"{backend_url}/api/users/login"
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        # 使用表单编码格式（与前端一致）
        response = requests.post(
            login_url,
            data=login_data,
            timeout=5
        )
        
        if response.status_code == 200:
            result = response.json()
            token = result.get('access_token')
            if token:
                print(f"   ✅ 登录成功，获取到token")
                print(f"      Token: {token[:30]}...")
                
                # 测试使用token获取用户信息
                print("\n2. 测试获取用户信息:")
                headers = {"Authorization": f"Bearer {token}"}
                user_response = requests.get(
                    f"{backend_url}/api/users/me",
                    headers=headers,
                    timeout=5
                )
                
                if user_response.status_code == 200:
                    user_data = user_response.json()
                    print(f"   ✅ 成功获取用户信息")
                    print(f"      用户名: {user_data.get('username')}")
                    print(f"      用户ID: {user_data.get('id')}")
                    print(f"      是否管理员: {user_data.get('is_admin')}")
                else:
                    print(f"   ❌ 获取用户信息失败: {user_response.status_code}")
                    print(f"      响应: {user_response.text[:100]}")
                
                # 测试使用token访问受保护的数据
                print("\n3. 测试访问受保护的数据:")
                cmdb_response = requests.get(
                    f"{backend_url}/api/cmdb/config-items",
                    headers=headers,
                    timeout=5
                )
                
                if cmdb_response.status_code == 200:
                    cmdb_data = cmdb_response.json()
                    print(f"   ✅ 成功访问CMDB数据")
                    print(f"      返回 {len(cmdb_data)} 条记录")
                else:
                    print(f"   ❌ 访问CMDB数据失败: {cmdb_response.status_code}")
                    
            else:
                print(f"   ⚠️  登录成功但未返回token")
                print(f"      响应: {response.text}")
                
        elif response.status_code == 401:
            print(f"   🔐 登录失败: 用户名或密码错误")
            print(f"      响应: {response.text}")
        elif response.status_code == 422:
            print(f"   ⚠️  请求格式错误 (422)")
            print(f"      响应: {response.text}")
            print("\n   尝试使用表单编码格式...")
            # 使用application/x-www-form-urlencoded格式
            form_data = "username=admin&password=admin123"
            headers = {"Content-Type": "application/x-www-form-urlencoded"}
            form_response = requests.post(login_url, data=form_data, headers=headers, timeout=5)
            print(f"      表单编码响应: {form_response.status_code}")
            if form_response.status_code == 200:
                print(f"      ✅ 表单编码登录成功")
            else:
                print(f"      ❌ 表单编码登录失败: {form_response.text[:100]}")
        else:
            print(f"   ❌ 登录请求失败: {response.status_code}")
            print(f"      响应: {response.text[:100]}")
            
    except requests.exceptions.ConnectionError:
        print(f"   ❌ 连接失败 - 后端服务可能未运行")
    except requests.exceptions.Timeout:
        print(f"   ⏰ 请求超时")
    except Exception as e:
        print(f"   ❌ 错误: {e}")
    
    print("\n4. 测试前端访问:")
    frontend_url = "http://localhost:5175"
    try:
        frontend_response = requests.get(frontend_url, timeout=5)
        if frontend_response.status_code == 200:
            print(f"   ✅ 前端服务可访问")
            # 检查页面是否包含登录相关元素
            content = frontend_response.text.lower()
            if "login" in content or "登录" in content or "username" in content:
                print(f"      页面包含登录表单")
            else:
                print(f"      页面可能不是登录页")
        else:
            print(f"   ⚠️  前端服务异常: {frontend_response.status_code}")
    except Exception as e:
        print(f"   ❌ 无法访问前端: {e}")
    
    print("\n==================================================")
    print("总结:")
    print("1. 后端服务: http://localhost:8001")
    print("2. 前端服务: http://localhost:5175")
    print("3. 登录地址: http://localhost:5175/login")
    print("\n如果前端看不到数据，请按以下步骤检查:")
    print("1. 打开浏览器访问: http://localhost:5175")
    print("2. 使用用户名: admin, 密码: admin123 登录")
    print("3. 登录后查看数据是否正常显示")
    print("4. 如果仍有问题，按F12打开开发者工具，查看控制台错误")

if __name__ == "__main__":
    test_login_functionality()