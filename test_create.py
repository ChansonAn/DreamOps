import urllib.request, json

# 测试创建资产
data = {
    'id': f'test-{int(__import__("time").time())}',
    'name': '测试资产',
    'type': 'network',
    'status': 'active',
    'environment': 'dev',
    'business_line': '测试',
    'owner': 'admin',
    'ip': '192.168.1.200',
    'ssh_port': 22,
    'ssh_username': 'root',
    'ssh_password': 'test123'
}

req = urllib.request.Request(
    'http://127.0.0.1:8000/api/cmdb/config-items',
    data=json.dumps(data).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='POST'
)

try:
    r = urllib.request.urlopen(req, timeout=10)
    print('Status:', r.status)
    print('Response:', r.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print('Error:', e.code)
    print('Response:', e.read().decode('utf-8'))
except Exception as e:
    print('Exception:', e)
