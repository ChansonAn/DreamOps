from app.db.yasdb_pool import query_one, query_all

# 查 app-2
item = query_one('SELECT id, name, update_time FROM cmdb_config_items WHERE id = :id', {'id': 'app-2'})
print(f"app-2: id={item.get('id')}, name={item.get('name')}, update_time={item.get('update_time')}")

# 看几个其他记录
items = query_all('SELECT id, name, update_time FROM cmdb_config_items WHERE ROWNUM <= 5')
for i in items:
    print(f"{i.get('id')}: update_time={i.get('update_time')}")
