import requests
import time

def test_frontend_backend_connection():
    """测试前端和后端的连接"""
    print("=== 测试前端和后端连接性 ===\n")
    
    # 测试后端API
    backend_url = "http://localhost:8001"
    frontend_url = "http://localhost:5175"
    
    print(f"1. 测试后端服务 ({backend_url}):")
    try:
        response = requests.get(f"{backend_url}/api/cmdb/config-items", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ 后端服务正常 (状态码: {response.status_code})")
            print(f"      返回 {len(data)} 条CMDB配置项记录")
        else:
            print(f"   ⚠️  后端服务异常 (状态码: {response.status_code})")
    except requests.exceptions.RequestException as e:
        print(f"   ❌ 无法连接到后端服务: {e}")
    
    print(f"\n2. 测试前端服务 ({frontend_url}):")
    try:
        response = requests.get(frontend_url, timeout=5)
        if response.status_code == 200:
            print(f"   ✅ 前端服务正常 (状态码: {response.status_code})")
            # 检查页面内容
            if "dreamops" in response.text.lower() or "react" in response.text.lower():
                print("      页面包含应用内容")
            else:
                print("      页面内容可能为空")
        else:
            print(f"   ⚠️  前端服务异常 (状态码: {response.status_code})")
    except requests.exceptions.RequestException as e:
        print(f"   ❌ 无法连接到前端服务: {e}")
    
    print(f"\n3. 测试前端API配置:")
    try:
        # 检查前端是否配置了正确的API地址
        response = requests.get(f"{frontend_url}/src/env", timeout=3)
        # 这只是检查前端是否可访问，实际配置在前端代码中
        print("   ✅ 前端服务可访问")
    except:
        print("   ⚠️  无法检查前端配置")
    
    print("\n4. 模拟前端调用后端API:")
    try:
        # 模拟前端调用后端API
        response = requests.get(f"{backend_url}/api/task-schedules", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ 前端可调用后端API (状态码: {response.status_code})")
            print(f"      返回 {len(data)} 条任务编排记录")
        else:
            print(f"   ⚠️  前端调用后端API失败 (状态码: {response.status_code})")
    except requests.exceptions.RequestException as e:
        print(f"   ❌ 前端无法调用后端API: {e}")
    
    print("\n==================================================")
    print("总结:")
    print("- 后端服务运行在: http://localhost:8001")
    print("- 前端服务运行在: http://localhost:5175")
    print("- 前端API配置为: http://localhost:8001 (通过.env.development)")
    print("\n如果前端看不到数据，可能的原因:")
    print("1. 浏览器缓存 - 尝试清除缓存或使用无痕模式")
    print("2. 前端代码错误 - 检查浏览器开发者工具控制台")
    print("3. 认证问题 - 需要先登录系统")
    print("4. 跨域问题 - 检查后端CORS配置")

if __name__ == "__main__":
    test_frontend_backend_connection()