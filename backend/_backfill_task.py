import yasdb, os
os.environ['YASDB_HOME'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64'
os.environ['PATH'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64\lib;' + os.environ.get('PATH', '')
conn = yasdb.connect(host='192.168.10.100', port=1688, user='dreamops', password='123456')
conn.autocommit = True
cur = conn.cursor()

# Backfill existing logs with task_id = id
cur.execute("UPDATE execution_logs SET task_id = id WHERE task_id IS NULL")
print(f'Updated {cur.rowcount} rows')

# Verify
cur.execute("SELECT COUNT(*) FROM execution_logs WHERE task_id IS NULL")
null_count = cur.fetchone()[0]
print(f'Remaining NULL task_id: {null_count}')

# Show some samples
cur.execute("SELECT id, task_id, name, execution_type FROM execution_logs FETCH FIRST 5 ROWS ONLY")
rows = cur.fetchall()
print("Sample logs:")
for r in rows:
    print(f"  id={r[0]}, task_id={r[1]}, name={r[2]}, type={r[3]}")

conn.close()
