import sys
sys.path.insert(0, 'I:/APP/dreamops/backend')

from app.main_yasdb import app
from fastapi.testclient import TestClient

client = TestClient(app)

data = {
    'source': 'app-svc-001',
    'target': 'cloud-001',
    'type': 'hosted_on',
    'description': 'test'
}

try:
    response = client.post('/api/cmdb/relationships', json=data)
    print(f'Status: {response.status_code}')
    if response.status_code >= 400:
        print(f'Error: {response.text}')
    else:
        print(f'Success: {response.json()}')
except Exception as e:
    import traceback
    traceback.print_exc()