import sys
sys.path.insert(0, r'I:\APP\dreamops\backend')
from app.db.yasdb_pool import get_db

with get_db() as db:
    db.execute('''
        SELECT id, name, ip, ssh_port, ssh_username, ssh_password
        FROM cmdb_config_items
        ORDER BY id DESC
        FETCH FIRST 5 ROWS ONLY
    ''')
    rows = db.fetchall_dicts()
    print('=== Latest 5 records ===')
    for r in rows:
        print(r)
