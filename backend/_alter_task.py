import yasdb, os
os.environ['YASDB_HOME'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64'
os.environ['PATH'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64\lib;' + os.environ.get('PATH', '')
conn = yasdb.connect(host='192.168.10.100', port=1688, user='dreamops', password='123456')
conn.autocommit = True
cur = conn.cursor()

# Check current columns
cur.execute("SELECT column_name, data_type FROM user_tab_columns WHERE table_name = 'EXECUTION_LOGS' ORDER BY column_id")
cols = cur.fetchall()
print("Current columns:")
for c in cols:
    print(f"  {c[0]}: {c[1]}")

# Check existing task_id_seq
cur.execute("SELECT sequence_name FROM user_sequences WHERE sequence_name = 'TASK_ID_SEQ'")
seq_exists = cur.fetchone()
print("TASK_ID_SEQ exists:", seq_exists is not None)

# Add TASK_ID column if not exists
cur.execute("SELECT column_name FROM user_tab_columns WHERE table_name = 'EXECUTION_LOGS' AND column_name = 'TASK_ID'")
if not cur.fetchone():
    cur.execute("ALTER TABLE execution_logs ADD (task_id NUMBER(20))")
    print("Added TASK_ID column")
else:
    print("TASK_ID column already exists")

# Create sequence
cur.execute("SELECT sequence_name FROM user_sequences WHERE sequence_name = 'TASK_ID_SEQ'")
if not cur.fetchone():
    cur.execute("CREATE SEQUENCE task_id_seq START WITH 1 INCREMENT BY 1 NOCACHE")
    print("Created TASK_ID_SEQ")
else:
    print("TASK_ID_SEQ already exists")

conn.close()
print("Done")
