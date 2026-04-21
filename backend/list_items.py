import requests

r = requests.get('http://localhost:8000/api/cmdb/config-items?limit=10', timeout=10)
items = r.json()
print('CMDB items:')
for item in items[:10]:
    print(f"  {item['id']} - {item['name']}")