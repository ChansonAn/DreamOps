import sys
import traceback

# Import and test directly
from app.main_yasdb import app
from fastapi.testclient import TestClient

client = TestClient(app)

tests = [
    '/api/tags/',
    '/api/articles',
    '/api/cmdb/config-items?limit=3',
]

for path in tests:
    print(f"\n=== {path} ===")
    response = client.get(path)
    print(f"Status: {response.status_code}")
    if response.status_code >= 400:
        print(f"Body: {response.text[:500]}")
