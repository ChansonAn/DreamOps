import sys, os
sys.path.insert(0, r'I:\APP\dreamops\backend')
os.environ['YASDB_HOME'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64'
os.environ['PATH'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64\lib;' + os.environ.get('PATH', '')
import yasdb

conn = yasdb.connect(host='192.168.10.100', port=1688, user='dreamops', password='123456')
cur = conn.cursor()

cur.execute('SELECT count(*) FROM cmdb_config_items')
total = cur.fetchone()[0]
print('CMDB total records:', total)

cur.execute('SELECT id, name, ip_address, status, category FROM cmdb_config_items ORDER BY id FETCH FIRST 20 ROWS ONLY')
print('\n=== CMDB hosts (top 20) ===')
for row in cur.fetchall():
    print('  %s | %s | %s | %s | %s' % (row[0], row[1], row[2], row[3], row[4]))

cur.execute('SELECT DISTINCT category FROM cmdb_config_items')
print('\n=== categories ===')
for row in cur.fetchall():
    print(' ', row[0])

conn.close()
