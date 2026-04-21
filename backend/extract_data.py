"""从MySQL导出所有数据"""
import json
import requests

BASE = 'http://localhost:8000/api'

def get_json(path):
    r = requests.get(f'{BASE}{path}', timeout=10)
    if r.status_code == 200:
        return r.json()
    return []

# 1. 获取用户信息
users = get_json('/users/')
print(f'Users: {len(users)}')
for u in users:
    print(f'  ID={u["id"]} username={u["username"]} email={u["email"]}')

# 2. 获取分类
cats = get_json('/categories/')
print(f'Categories: {len(cats)}')
for c in cats:
    print(f'  ID={c["id"]} name={c["name"]}')

# 3. 获取标签
tags = get_json('/tags/')
print(f'Tags: {len(tags)}')
for t in tags:
    print(f'  ID={t["id"]} name={t["name"]}')

# 4. 获取文章
articles = get_json('/articles/')
print(f'Articles: {len(articles)}')
for a in articles:
    print(f'  ID={a["id"]} title={a["title"][:30]} author_id={a.get("author_id")} cat_id={a.get("category_id")}')

# 5. 获取脚本
scripts = get_json('/script/')
print(f'Scripts: {len(scripts)}')
for s in scripts:
    print(f'  ID={s["id"]} name={s["name"]} category={s["category"]} lang={s["language"]}')

# 6. 获取CMDB
items = get_json('/cmdb/config-items')
print(f'CMDB items: {len(items)}')
for item in items[:5]:
    print(f'  ID={item["id"]} name={item["name"]} type={item["type"]}')

# 保存完整数据到文件
data = {
    'users': users,
    'categories': cats,
    'tags': tags,
    'articles': articles,
    'scripts': scripts,
    'cmdb_items': items,
}
with open('I:/APP/dreamops/backend/mysql_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2, default=str)
print('Data saved to mysql_data.json')
