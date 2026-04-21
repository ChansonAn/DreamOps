import os, sys
os.environ['YASDB_HOME'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64'
os.environ['PATH'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64\lib;' + os.environ.get('PATH','')
sys.path.insert(0, 'I:/APP/dreamops/backend')

from app.db.yasdb_pool import get_db_session, get_next_id

db = get_db_session()
new_id = get_next_id('cmdb_relationships')
print(f'Next ID: {new_id}')

if new_id:
    db.execute(
        "INSERT INTO cmdb_relationships (id, source, target, type, description) "
        "VALUES (:id, :s, :t, :tp, :d)",
        {'id': new_id, 's': 'app-svc-001', 't': 'cloud-001', 'tp': 'hosted_on', 'd': 'test from script'}
    )
    print(f'Inserted relationship with ID={new_id}')
    
    db.execute("SELECT * FROM cmdb_relationships WHERE id = :id", {'id': new_id})
    row = db.fetchone_dict()
    print(f'Verified: {row}')
else:
    print('ERROR: get_next_id returned None!')
