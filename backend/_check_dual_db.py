import sys, os
sys.path.insert(0, r'I:\APP\dreamops\backend')
os.environ['YASDB_HOME'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64'
os.environ['PATH'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64\lib;' + os.environ.get('PATH', '')

# 1) 试试 MySQL 连接
try:
    import pymysql
    conn = pymysql.connect(host='localhost', port=3306, user='root', password='', database='dreamops')
    cur = conn.cursor()
    cur.execute('SELECT count(*) FROM cmdb_config_items')
    print('MySQL CMDB count:', cur.fetchone()[0])
    conn.close()
except Exception as e:
    print('MySQL:', e)

# 2) YashanDB
try:
    import yasdb
    conn = yasdb.connect(host='192.168.10.100', port=1688, user='dreamops', password='123456')
    cur = conn.cursor()
    cur.execute('SELECT count(*) FROM cmdb_config_items')
    print('YashanDB CMDB count:', cur.fetchone()[0])
    conn.close()
except Exception as e:
    print('YashanDB:', e)
