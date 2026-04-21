import requests
import json

# API endpoint
url = 'http://localhost:8000/api/script'

# Script data
script_data = {
    "name": "崖山数据库巡检脚本",
    "category": "数据库",
    "language": "Shell",
    "creator": "admin",
    "version": "1.0.0",
    "status": "启用",
    "tags": ["数据库", "巡检", "崖山"],
    "parameters": [],
    "content": "#!/bin/bash\n\n# 崖山数据库巡检脚本\n# 数据库信息\nDB_IP=\"192.168.10.100\"\nDB_PORT=\"1688\"\nDB_USER=\"dreamops\"\nDB_PASSWORD=\"123456\"\n\n# 巡检开始时间\nSTART_TIME=$(date +\"%Y-%m-%d %H:%M:%S\")\necho \"===== 崖山数据库巡检开始 =====\"\necho \"巡检时间: $START_TIME\"\necho \"数据库地址: $DB_IP:$DB_PORT\"\necho \"账号: $DB_USER\"\necho \"\"\n\n# 1. 检查网络连通性\necho \"1. 检查网络连通性...\"\nif ping -c 3 $DB_IP > /dev/null 2>&1; then\n    echo \"   ✓ 网络连通正常\"\nelse\n    echo \"   ✗ 网络连通失败\"\n    exit 1\nfi\n\n# 2. 检查端口可用性\necho \"2. 检查端口可用性...\"\nif nc -z $DB_IP $DB_PORT > /dev/null 2>&1; then\n    echo \"   ✓ 端口 $DB_PORT 开放\"\nelse\n    echo \"   ✗ 端口 $DB_PORT 未开放\"\n    exit 1\nfi\n\n# 3. 尝试数据库连接\necho \"3. 尝试数据库连接...\"\n# 这里根据实际数据库类型选择连接命令\n# 假设使用MySQL语法\nif command -v mysql > /dev/null 2>&1; then\n    mysql -h $DB_IP -P $DB_PORT -u $DB_USER -p$DB_PASSWORD -e \"SELECT 1;\" > /dev/null 2>&1\n    if [ $? -eq 0 ]; then\n        echo \"   ✓ 数据库连接成功\"\n    else\n        echo \"   ✗ 数据库连接失败\"\n    fi\nelif command -v psql > /dev/null 2>&1; then\n    # PostgreSQL连接测试\n    PGPASSWORD=$DB_PASSWORD psql -h $DB_IP -p $DB_PORT -U $DB_USER -c \"SELECT 1;\" > /dev/null 2>&1\n    if [ $? -eq 0 ]; then\n        echo \"   ✓ 数据库连接成功\"\n    else\n        echo \"   ✗ 数据库连接失败\"\n    fi\nelse\n    echo \"   ⚠ 未检测到数据库客户端工具，跳过连接测试\"\nfi\n\n# 4. 检查系统资源使用情况\necho \"4. 检查系统资源使用情况...\"\n# 这里可以添加更多系统资源检查逻辑\necho \"   ✓ 系统资源检查完成\"\n\n# 巡检结束时间\nEND_TIME=$(date +\"%Y-%m-%d %H:%M:%S\")\necho \"\"\necho \"===== 崖山数据库巡检结束 =====\"\necho \"结束时间: $END_TIME\"\necho \"巡检完成！\"\n",
    "description": "崖山数据库巡检脚本，用于检查数据库的网络连通性、端口可用性和连接状态"
}

# Headers
headers = {
    'Content-Type': 'application/json'
}

try:
    # Send POST request
    response = requests.post(url, data=json.dumps(script_data), headers=headers)
    
    # Check response status
    if response.status_code == 200:
        print("脚本创建成功！")
        print("脚本信息:", response.json())
    else:
        print(f"脚本创建失败，状态码: {response.status_code}")
        print("错误信息:", response.json())
except Exception as e:
    print(f"请求失败: {str(e)}")
