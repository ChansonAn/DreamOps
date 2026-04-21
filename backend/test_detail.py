import requests
import traceback

BASE = 'http://localhost:8000'

tests = [
    '/api/tags/',
    '/api/articles',
    '/api/cmdb/config-items?limit=3',
]

for path in tests:
    print(f"\n=== {path} ===")
    try:
        r = requests.get(f'{BASE}{path}', timeout=10)
        print(f"Status: {r.status_code}")
        if r.status_code >= 400:
            print(f"Body: {r.text[:500]}")
            # Try to get full error
            try:
                err = r.json()
                print(f"JSON: {err}")
            except:
                pass
    except Exception as e:
        print(f"Exception: {e}")
        traceback.print_exc()
