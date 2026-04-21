import os
os.environ['YASDB_HOME'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64'
os.environ['PATH'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64\lib;' + os.environ.get('PATH','')
import yasdb

conn = yasdb.connect(host='192.168.10.100', port=1688, user='dreamops', password='123456')
conn.autocommit = True
cur = conn.cursor()

# 查看所有表
cur.execute("SELECT table_name FROM user_tables")
tables = [r[0] for r in cur.fetchall()]
print('Tables:', tables)

# 检查cmdb_relationships表是否存在
if 'cmdb_relationships' in tables:
    cur.execute('SELECT COUNT(*) FROM cmdb_relationships')
    print(f'Relationships: {cur.fetchone()[0]}')
else:
    print('cmdb_relationships table does not exist!')

conn.close()