"""
MySQL 数据迁移到崖山数据库 - 修复版（先清空后迁移）
"""
import os
import json

os.environ['YASDB_HOME'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64'
os.environ['PATH'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64\lib;' + os.environ.get('PATH', '')

import yasdb

conn = yasdb.connect(host='192.168.10.100', port=1688, user='dreamops', password='123456')
conn.autocommit = True
cur = conn.cursor()

def exe(sql, params=None):
    try:
        if params:
            cur.execute(sql, params)
        else:
            cur.execute(sql)
        return True
    except Exception as e:
        print(f"    Error: {e}")
        return False

# 先清空已有数据（按依赖顺序）
print("Clearing existing data...")
for table in ['article_tags', 'articles', 'tags', 'categories', 'scripts', 'cmdb_config_items']:
    try:
        exe(f"DELETE FROM {table.upper()}")
        print(f"  Cleared {table}")
    except:
        pass

with open('I:/APP/dreamops/backend/mysql_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("\nStarting migration...")
print(f"Data: {len(data['users'])} users, {len(data['categories'])} categories, {len(data['tags'])} tags, {len(data['articles'])} articles, {len(data['scripts'])} scripts, {len(data['cmdb_items'])} CMDB items")

# 1. 迁移分类（直接指定ID）
print("\n1. Categories...")
for cat in data['categories']:
    ok = exe("INSERT INTO categories (id, name, description) VALUES (:id, :name, :desc)",
             {'id': cat['id'], 'name': cat['name'], 'desc': cat.get('description', '')})
    if ok:
        print(f"  OK: {cat['name']}")

# 2. 迁移标签（直接指定ID）
print("\n2. Tags...")
for tag in data['tags']:
    ok = exe("INSERT INTO tags (id, name) VALUES (:id, :name)", {'id': tag['id'], 'name': tag['name']})
    if ok:
        print(f"  OK: {tag['name']}")

# 3. 迁移脚本（直接指定ID）
print("\n3. Scripts...")
for script in data['scripts']:
    tags_json = json.dumps(script.get('tags', []))
    params_json = json.dumps(script.get('parameters', []))
    ok = exe("""
        INSERT INTO scripts (id, name, category, language, creator, version, status, tags, parameters, content, description)
        VALUES (:id, :name, :cat, :lang, :creator, :version, :status, :tags, :params, :content, :desc)
    """, {
        'id': script['id'],
        'name': script.get('name'),
        'cat': script.get('category'),
        'lang': script.get('language'),
        'creator': script.get('creator'),
        'version': script.get('version', '1.0.0'),
        'status': script.get('status', '启用'),
        'tags': tags_json,
        'params': params_json,
        'content': script.get('content'),
        'desc': script.get('description'),
    })
    if ok:
        print(f"  OK: {script['name']}")

# 4. CMDB
print("\n4. CMDB items...")
count = 0
for item in data['cmdb_items']:
    tags_json = json.dumps(item.get('tags', []))
    ok = exe("""
        INSERT INTO cmdb_config_items (id, name, type, status, environment, business_line, owner, tags,
            ip, hostname, os, cpu, memory, disk, ssh_port, ssh_username, ssh_password, ssh_private_key,
            device_type, location, version, deploy_path, middleware_type, middleware_category, port, username,
            db_type, database_name, instance_name, storage_size, backup_policy, connection_string,
            mq_type, queue_name, message_model, app_server_type, jvm_params, cloud_provider, region)
        VALUES (
            :id, :name, :type, :status, :env, :bl, :owner, :tags,
            :ip, :hostname, :os, :cpu, :memory, :disk, :ssh_port, :ssh_user, :ssh_pass, :ssh_key,
            :dev_type, :location, :version, :deploy_path, :mw_type, :mw_cat, :port, :username,
            :db_type, :db_name, :inst_name, :storage, :backup, :conn_str,
            :mq_type, :queue_name, :msg_model, :app_type, :jvm_params, :cloud_provider, :region
        )
    """, {
        'id': item['id'],
        'name': item.get('name'),
        'type': item.get('type'),
        'status': item.get('status'),
        'env': item.get('environment'),
        'bl': item.get('business_line'),
        'owner': item.get('owner'),
        'tags': tags_json,
        'ip': item.get('ip'),
        'hostname': item.get('hostname'),
        'os': item.get('os'),
        'cpu': item.get('cpu'),
        'memory': item.get('memory'),
        'disk': item.get('disk'),
        'ssh_port': item.get('ssh_port'),
        'ssh_user': item.get('ssh_username'),
        'ssh_pass': item.get('ssh_password'),
        'ssh_key': item.get('ssh_private_key'),
        'dev_type': item.get('device_type'),
        'location': item.get('location'),
        'version': item.get('version'),
        'deploy_path': item.get('deploy_path'),
        'mw_type': item.get('middleware_type'),
        'mw_cat': item.get('middleware_category'),
        'port': item.get('port'),
        'username': item.get('username'),
        'db_type': item.get('db_type'),
        'db_name': item.get('database_name'),
        'inst_name': item.get('instance_name'),
        'storage': item.get('storage_size'),
        'backup': item.get('backup_policy'),
        'conn_str': item.get('connection_string'),
        'mq_type': item.get('mq_type'),
        'queue_name': item.get('queue_name'),
        'msg_model': item.get('message_model'),
        'app_type': item.get('app_server_type'),
        'jvm_params': item.get('jvm_params'),
        'cloud_provider': item.get('cloud_provider'),
        'region': item.get('region'),
    })
    if ok:
        count += 1
        if count % 10 == 0:
            print(f"  Migrated {count}...")
print(f"  Total: {count} CMDB items")

# 5. 迁移文章
print("\n5. Articles...")
for article in data['articles']:
    ok = exe("""
        INSERT INTO articles (id, title, content, summary, is_published, cover_image, author_id, category_id, view_count)
        VALUES (:id, :title, :content, :summary, :pub, :cover, :author, :cat, :views)
    """, {
        'id': article['id'],
        'title': article.get('title'),
        'content': article.get('content'),
        'summary': article.get('summary'),
        'pub': 1 if article.get('is_published') else 0,
        'cover': article.get('cover_image'),
        'author': article.get('author_id') or 1,
        'cat': article.get('category_id'),
        'views': article.get('view_count', 0),
    })
    if ok:
        print(f"  OK: {article['title'][:30]}")

# 6. 文章标签关联
print("\n6. Article-Tag relations...")
for article in data['articles']:
    tags_list = article.get('tags', [])
    if isinstance(tags_list, list):
        for t in tags_list:
            tag_id = t['id'] if isinstance(t, dict) else t
            exe("INSERT INTO article_tags (article_id, tag_id) VALUES (:aid, :tid)",
                {'aid': article['id'], 'tid': tag_id})
print("  Done")

# 验证
print("\n\nVerification:")
for table in ['categories', 'tags', 'scripts', 'cmdb_config_items', 'articles', 'article_tags']:
    try:
        cur.execute(f'SELECT COUNT(*) FROM {table.upper()}')
        cnt = cur.fetchone()[0]
        print(f"  {table}: {cnt}")
    except:
        print(f"  {table}: error")

conn.close()
print("\nMigration complete!")
