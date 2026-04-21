import requests
BASE = 'http://localhost:8000'

tests = [
    ('GET', '/', None),
    ('GET', '/api/users/', None),
    ('GET', '/api/categories/', None),
    ('GET', '/api/tags/', None),
    ('GET', '/api/articles', None),
    ('GET', '/api/script/', None),
    ('GET', '/api/cmdb/config-items?limit=5', None),
    ('GET', '/api/cmdb/relationships', None),
]

print('=== DreamOP API Test ===\n')
all_pass = True
for method, path, data in tests:
    try:
        if method == 'GET':
            r = requests.get(f'{BASE}{path}', timeout=10)
        else:
            r = requests.post(f'{BASE}{path}', json=data, timeout=10)
        
        ok = r.status_code == 200
        if not ok:
            all_pass = False
        
        if ok:
            try:
                d = r.json()
                if isinstance(d, list):
                    print(f'[OK] {method} {path} ({len(d)} items)')
                else:
                    print(f'[OK] {method} {path}')
            except:
                print(f'[OK] {method} {path}')
        else:
            print(f'[FAIL] {method} {path} - {r.status_code}: {r.text[:80]}')
    except Exception as e:
        all_pass = False
        print(f'[FAIL] {method} {path} - ERROR: {e}')

# Login test
print('\n=== Login Test ===')
r = requests.post(f'{BASE}/api/users/login', data={'username': 'admin', 'password': 'admin123'}, timeout=10)
if r.status_code == 200:
    token = r.json().get('access_token')
    print(f'[OK] Login successful, token: {token[:30]}...')
    
    # Test protected endpoint
    r2 = requests.get(f'{BASE}/api/users/me', headers={'Authorization': f'Bearer {token}'}, timeout=10)
    if r2.status_code == 200:
        print(f'[OK] Protected endpoint with token works')
    else:
        print(f'[FAIL] Protected endpoint: {r2.status_code}')
else:
    all_pass = False
    print(f'[FAIL] Login: {r.status_code} - {r.text[:80]}')

result_msg = "ALL PASS" if all_pass else "SOME FAILED"
print(f'\n=== Result: {result_msg} ===')