import requests

# 尝试创建关系 - 使用存在的ID
data = {
    'source': 'app-svc-001',
    'target': 'cloud-001',
    'type': 'hosted_on',
    'description': '用户服务部署在云主机上'
}

r = requests.post('http://localhost:8000/api/cmdb/relationships', json=data, timeout=10)
print(f'Status: {r.status_code}')
print(f'Body: {r.text[:500]}')