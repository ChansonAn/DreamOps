import sys, os
sys.path.insert(0, '.')
os.environ['YASDB_HOME'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64'
os.environ['PATH'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64\lib;' + os.environ.get('PATH', '')
import yasdb

conn = yasdb.connect(host='192.168.10.100', port=1688, user='dreamops', password='123456')
cur = conn.cursor()

cur.execute('SELECT id, schedule_id, template_id, sort_order FROM task_schedule_items WHERE schedule_id = 6 ORDER BY sort_order')
print('=== Schedule 6 items ===')
for row in cur.fetchall():
    print(row)

conn.close()
