import yasdb, os
os.environ['YASDB_HOME'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64'
os.environ['PATH'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64\lib;' + os.environ.get('PATH', '')
conn = yasdb.connect(host='192.168.10.100', port=1688, user='dreamops', password='123456')
cur = conn.cursor()
cur.execute("SELECT column_name FROM user_tab_columns WHERE table_name = 'EXECUTION_LOGS' AND column_name = 'TASK_ID'")
r = cur.fetchone()
print('TASK_ID exists:', r is not None)
if r:
    cur.execute("SELECT MAX(task_id) FROM execution_logs")
    m = cur.fetchone()
    print('max task_id:', m[0] if m else 'NULL')
conn.close()
