import os
os.environ['YASDB_HOME'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64'
os.environ['PATH'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64\lib;' + os.environ.get('PATH','')

import yasdb

conn = yasdb.connect(host='192.168.10.100', port=1688, user='dreamops', password='123456')
conn.autocommit = True
cur = conn.cursor()

# 前进序列到11（跳过现有的10条记录的ID）
for i in range(11):
    cur.execute("SELECT cmdb_relationships_seq.NEXTVAL FROM dual")
    val = cur.fetchone()[0]
    print(f"Sequence: {val}")

print("Sequence now at 11, ready for new inserts")

conn.close()