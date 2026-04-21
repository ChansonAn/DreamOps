import requests
import json

# 测试创建博客文章
def test_create_blog():
    # 首先登录获取token
    login_url = "http://localhost:8000/api/users/login"
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        # 登录
        print("尝试登录...")
        login_response = requests.post(login_url, data=login_data)
        print(f"登录响应状态码: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            token = login_result.get("access_token")
            print(f"登录成功，获取到token: {token[:20]}...")
            
            # 测试创建博客
            create_url = "http://localhost:8000/api/articles"
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            blog_data = {
                "title": "测试博客文章",
                "content": "这是一篇测试博客文章的内容。",
                "excerpt": "测试博客摘要",
                "is_published": True,
                "category_id": 1,
                "tag_ids": [1, 2]
            }
            
            print("\n尝试创建博客...")
            create_response = requests.post(create_url, json=blog_data, headers=headers)
            print(f"创建博客响应状态码: {create_response.status_code}")
            
            if create_response.status_code == 201:
                blog_result = create_response.json()
                print(f"博客创建成功！ID: {blog_result.get('id')}")
                print(f"标题: {blog_result.get('title')}")
                print(f"作者: {blog_result.get('author', {}).get('username')}")
            else:
                print(f"创建博客失败: {create_response.text}")
        else:
            print(f"登录失败: {login_response.text}")
            
    except Exception as e:
        print(f"测试过程中出现错误: {str(e)}")

# 测试获取博客列表
def test_get_blogs():
    print("\n测试获取博客列表...")
    try:
        url = "http://localhost:8000/api/articles"
        response = requests.get(url)
        print(f"获取博客列表响应状态码: {response.status_code}")
        
        if response.status_code == 200:
            blogs = response.json()
            print(f"获取到 {len(blogs)} 篇博客文章")
            for i, blog in enumerate(blogs[:3]):  # 只显示前3篇
                print(f"{i+1}. ID: {blog.get('id')}, 标题: {blog.get('title')}, 作者: {blog.get('author', {}).get('username')}")
        else:
            print(f"获取博客列表失败: {response.text}")
    except Exception as e:
        print(f"获取博客列表时出现错误: {str(e)}")

if __name__ == "__main__":
    print("开始测试博客功能...")
    test_get_blogs()
    test_create_blog()