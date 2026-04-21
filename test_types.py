import urllib.request, json

# 测试多类型参数
r = urllib.request.urlopen('http://127.0.0.1:8000/api/cmdb/config-items?types=host,vm,physical&limit=50')
d = json.loads(r.read())
print('With types=host,vm,physical:', len(d))
with_ip = sum(1 for i in d if i.get('ip'))
print('  Items with IP:', with_ip)
for i in d[:5]:
    t = i.get('type')
    n = i.get('name')
    ip = i.get('ip', 'N/A')
    print(f'  {t}: {n} ip={ip}')
