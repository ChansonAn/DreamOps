import urllib.request, json

r = urllib.request.urlopen('http://127.0.0.1:8000/api/cmdb/config-items?limit=50')
d = json.loads(r.read())

print('Total:', len(d))

# Check which fields have values
fields = ['ip', 'hostname', 'cpu', 'memory', 'disk', 'os', 'ssh_port']
stats = {f: 0 for f in fields}
for item in d:
    for f in fields:
        if item.get(f):
            stats[f] += 1

print('Fields with values:')
for f, c in stats.items():
    print(f'  {f}: {c}/{len(d)}')

print()
print('Sample items:')
for i in d[:3]:
    name = i.get('name', 'N/A')
    ip = i.get('ip', 'N/A')
    cpu = i.get('cpu', 'N/A')
    mem = i.get('memory', 'N/A')
    print(f'  {name}: ip={ip}, cpu={cpu}, mem={mem}')
