import requests

BASE = 'http://localhost:8000'

# 创建关系测试
data = {
    'source': 'app-svc-001',
    'target': 'cloud-001',
    'type': 'hosted_on',
    'description': '用户服务部署在云主机上'
}

r = requests.post(f'{BASE}/api/cmdb/relationships', json=data, timeout=10)
print(f'Create relationship: {r.status_code}')
if r.status_code == 200:
    print(f'Success: {r.json()}')
else:
    print(f'Error: {r.text[:200]}')

# 查询验证
r2 = requests.get(f'{BASE}/api/cmdb/relationships', timeout=10)
print(f'\nList relationships: {r2.status_code}')
if r2.status_code == 200:
    items = r2.json()
    print(f'Total: {len(items)}')
    for rel in items[-3:]:
        print(f"  {rel['id']}: {rel['source']} -> {rel['target']} ({rel['type']})")