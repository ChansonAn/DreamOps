import sys, os
sys.path.insert(0, r'I:\APP\dreamops\backend')
os.environ['YASDB_HOME'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64'
os.environ['PATH'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64\lib;' + os.environ.get('PATH', '')
import yasdb

conn = yasdb.connect(host='192.168.10.100', port=1688, user='dreamops', password='123456')
cur = conn.cursor()

cur.execute('SELECT column_name FROM user_tab_columns WHERE table_name = ? ORDER BY column_id', ('CMDB_CONFIG_ITEMS',))
print('=== CMDB columns ===')
for row in cur.fetchall():
    print(' ', row[0])

cur.execute('SELECT * FROM cmdb_config_items FETCH FIRST 10 ROWS ONLY')
cols = [d[0] for d in cur.description]
print('\n=== Sample data ===')
print('columns:', cols)
for row in cur.fetchall():
    print(row)

conn.close()
