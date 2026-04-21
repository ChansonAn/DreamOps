import sys
sys.path.insert(0, r'I:\APP\dreamops\backend')
from app.db.yasdb_pool import get_db

with get_db() as db:
    # 查有 IP 的资产（机器类型）
    db.execute('''
        SELECT id, name, type, ip, ssh_port, ssh_username, ssh_password
        FROM cmdb_config_items
        WHERE ip IS NOT NULL AND ip != ''
        ORDER BY id
        FETCH FIRST 10 ROWS ONLY
    ''')
    rows = db.fetchall_dicts()

    print('=== SSH fields in assets with IP ===')
    for r in rows:
        print(f"ID: {r.get('ID', 'N/A')}")
        print(f"  Name: {r.get('NAME', 'N/A')}")
        print(f"  Type: {r.get('TYPE', 'N/A')}")
        print(f"  IP: {r.get('IP', 'N/A')}")
        print(f"  SSH_PORT: '{r.get('SSH_PORT', 'N/A')}'")
        print(f"  SSH_USER: '{r.get('SSH_USERNAME', 'N/A')}'")
        print(f"  SSH_PASS: '{r.get('SSH_PASSWORD', 'N/A')}'")
        print()

    # 统计 SSH 字段有值的数量
    db.execute('''
        SELECT COUNT(*) as CNT FROM cmdb_config_items
        WHERE ssh_port IS NOT NULL
    ''')
    port_count = db.fetchone_dict()
    print(f"Records with SSH_PORT: {port_count}")

    db.execute('''
        SELECT COUNT(*) as CNT FROM cmdb_config_items
        WHERE ssh_username IS NOT NULL AND ssh_username != ''
    ''')
    user_count = db.fetchone_dict()
    print(f"Records with SSH_USERNAME: {user_count}")
