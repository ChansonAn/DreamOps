import urllib.request, json

r = urllib.request.urlopen('http://127.0.0.1:8000/api/cmdb/config-items?limit=50')
d = json.loads(r.read())

print('Items WITH IP address:')
for i in d:
    if i.get('ip'):
        print(f"  {i.get('name')}: ip={i.get('ip')}, cpu={i.get('cpu')}, mem={i.get('memory')}, type={i.get('type')}")

print()
print('Items WITHOUT IP address (first 10):')
count = 0
for i in d:
    if not i.get('ip'):
        count += 1
        if count <= 10:
            print(f"  {i.get('name')}: type={i.get('type')}")
print(f'  ... total {count} items without IP')
