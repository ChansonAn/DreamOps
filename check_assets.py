import urllib.request, json

# 查看所有类型及其字段
r = urllib.request.urlopen('http://127.0.0.1:8000/api/cmdb/config-items?limit=50')
items = json.loads(r.read())

# 按类型分组统计
from collections import defaultdict
by_type = defaultdict(list)
for item in items:
    t = item.get('type', 'unknown')
    by_type[t].append({
        'name': item.get('name'),
        'ip': item.get('ip'),
        'ssh_port': item.get('ssh_port'),
        'ssh_username': item.get('ssh_username'),
    })

for t, lst in sorted(by_type.items()):
    print(f'\n=== {t} ({len(lst)}条) ===')
    for i in lst[:3]:
        print(f"  {i['name']}: ip={i['ip']}, port={i['ssh_port']}, user={i['ssh_username']}")
