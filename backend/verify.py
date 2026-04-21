import requests

r = requests.get('http://localhost:8000/', timeout=5)
print(f'Backend: {r.status_code} - {r.text[:50]}')

r2 = requests.get('http://localhost:8000/api/cmdb/relationships', timeout=5)
print(f'Relationships: {r2.status_code} - {len(r2.json())} items')

r3 = requests.get('http://localhost:8000/api/cmdb/config-items?limit=5', timeout=5)
items = r3.json()
print(f'Config items: {r3.status_code} - {len(items)} items')
for item in items:
    print(f"  {item['id']} - {item['name']} ({item['type']})")