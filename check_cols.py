import sys
sys.path.insert(0, r'I:\APP\dreamops\backend')
from app.db.yasdb_pool import get_db

with get_db() as db:
    # 查表结构
    db.execute("""
        SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH
        FROM USER_TAB_COLUMNS
        WHERE TABLE_NAME = 'CMDB_CONFIG_ITEMS'
        ORDER BY COLUMN_ID
    """)
    cols = db.fetchall_dicts()
    print('=== CMDB_CONFIG_ITEMS table columns ===')
    for c in cols:
        # 打印所有 key 看看
        print(c)
