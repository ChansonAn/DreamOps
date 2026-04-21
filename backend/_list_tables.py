import sys, os
sys.path.insert(0, '.')
os.environ['YASDB_HOME'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64'
os.environ['PATH'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64\lib;' + os.environ.get('PATH', '')
import yasdb

conn = yasdb.connect(host='192.168.10.100', port=1688, user='dreamops', password='123456')
cur = conn.cursor()

# 列出相关表
cur.execute("SELECT table_name FROM user_tables")
for row in cur.fetchall():
    print('TABLE:', row[0])

conn.close()
