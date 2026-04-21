import requests

r = requests.get('http://localhost:8000/api/cmdb/relationships', timeout=10)
print(f'Status: {r.status_code}')
if r.status_code == 200:
    data = r.json()
    print(f'Total: {len(data)}')
    for rel in data[:5]:
        print(f"  {rel['source']} -> {rel['target']} ({rel['type']})")
else:
    print(f'Error: {r.text[:200]}')