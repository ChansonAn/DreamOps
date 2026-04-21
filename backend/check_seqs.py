import os, sys
os.environ['YASDB_HOME'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64'
os.environ['PATH'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64\lib;' + os.environ.get('PATH','')

import yasdb
conn = yasdb.connect(host='192.168.10.100', port=1688, user='dreamops', password='123456')
conn.autocommit = True
cur = conn.cursor()

# 删掉刚才测试插入的15号
cur.execute("DELETE FROM cmdb_relationships WHERE id > 10")
print('Cleaned test rows')

# 检查当前关系数量
cur.execute("SELECT COUNT(*) FROM cmdb_relationships")
print(f"Relationships: {cur.fetchone()[0]}")

# 检查所有表的序列状态
for seq in ['SCRIPTS_SEQ', 'TAGS_SEQ', 'ARTICLES_SEQ', 'CATEGORIES_SEQ', 'USERS_SEQ',
            'CMDB_CONFIG_ITEMS_SEQ', 'CMDB_RELATIONSHIPS_SEQ', 'COMMENTS_SEQ', 'LIKES_SEQ', 'FAVORITES_SEQ']:
    try:
        cur.execute(f"SELECT {seq}.NEXTVAL FROM dual")
        val = cur.fetchone()[0]
        print(f"  {seq}: next={val}")
    except Exception as e:
        print(f"  {seq}: ERROR {e}")

conn.close()
