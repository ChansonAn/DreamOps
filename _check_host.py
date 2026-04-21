import sys
sys.path.insert(0, '.')
from app.core.database import YasdbSession

with YasdbSession() as db:
    rows = db.execute("SELECT COUNT(*) cnt FROM cmdb_config_items WHERE type = 'host'")
    print('host config items:', rows[0]['cnt'] if rows else 0)
    
    rels = db.execute("""
        SELECT COUNT(*) cnt FROM cmdb_relationships 
        WHERE source_id IN (SELECT id FROM cmdb_config_items WHERE type='host')
           OR target_id IN (SELECT id FROM cmdb_config_items WHERE type='host')
    """)
    print('related relationships:', rels[0]['cnt'] if rels else 0)
