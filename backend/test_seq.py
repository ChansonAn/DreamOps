import os
os.environ['YASDB_HOME'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64'
os.environ['PATH'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64\lib;' + os.environ.get('PATH','')

from app.db.yasdb_pool import get_db_session

db = get_db_session()
db.execute("SELECT cmdb_relationships_seq.NEXTVAL FROM dual")
result = db.fetchone_dict()
print(f'Result: {result}')
print(f'Keys: {list(result.keys()) if result else None}')
db.close()