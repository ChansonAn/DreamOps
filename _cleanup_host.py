# -*- coding: utf-8 -*-
import sys
sys.path.insert(0, 'I:/APP/dreamops/backend')
from app.db.yasdb_pool import YASDB_CONFIG
import yasdb

# 用独立连接
conn = yasdb.connect(**YASDB_CONFIG)
conn.autocommit = True  # 显式自动提交
cur = conn.cursor()

# 查询所有主机
cur.execute('SELECT id, name, type FROM cmdb_config_items')
all_rows = cur.fetchall()
# 列名大写：ID=0, NAME=1, TYPE=2
hosts = [all_rows[i] for i in range(len(all_rows)) if all_rows[i][2] == 'host']
host_ids = [str(h[0]) for h in hosts]
print(f'主机配置项共 {len(hosts)} 条:')
for h in hosts:
    print(f'  id={h[0]} name={h[1]}')

# 查询涉及主机的关系（ID=0, SOURCE=1, TARGET=2）
cur.execute('SELECT id, source, target FROM cmdb_relationships')
all_rels = cur.fetchall()
host_rels = [r for r in all_rels if r[1] in host_ids or r[2] in host_ids]
print(f'\n涉及主机的关系共 {len(host_rels)} 条:')
for r in host_rels:
    print(f'  id={r[0]} source={r[1]} target={r[2]}')

# 删除关系
print('\n--- 删除关系 ---')
for r in host_rels:
    sql = "DELETE FROM cmdb_relationships WHERE id = '" + str(r[0]) + "'"
    cur.execute(sql)
    print(f'  删除了关系 id={r[0]}')

# 删除主机配置项
print('\n--- 删除主机配置项 ---')
for h in hosts:
    sql = "DELETE FROM cmdb_config_items WHERE id = '" + str(h[0]) + "'"
    cur.execute(sql)
    print(f'  删除了配置项 id={h[0]}')

# 验证
cur.execute('SELECT id, type FROM cmdb_config_items')
rows = cur.fetchall()
hosts2 = [r for r in rows if r[1] == 'host']
print(f'\n验证：剩余 host 条目 = {len(hosts2)}')
print('完成')

cur.close()
conn.close()
