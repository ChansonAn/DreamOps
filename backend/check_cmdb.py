import requests

r = requests.get('http://localhost:8000/api/cmdb/config-items', timeout=10)
print(f'Status: {r.status_code}')
data = r.json()
print(f'Total items: {len(data)}')
for item in data[:10]:
    print(f"  ID={item['id']} name={item['name']} type={item['type']}")

# Check relationships
r2 = requests.get('http://localhost:8000/api/cmdb/relationships', timeout=10)
print(f'\nRelationships: {r2.status_code}')
rels = r2.json()
print(f'Total: {len(rels)}')
for rel in rels[:5]:
    print(f"  {rel['source']} -> {rel['target']} ({rel.get('type')})")