import requests, json, sys, os, time

sys.path.insert(0, r'I:\APP\dreamops\backend')
os.environ['YASDB_HOME'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64'
os.environ['PATH'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64\lib;' + os.environ.get('PATH', '')
import yasdb

# 1) 验证路由
print('=== 验证路由注册 ===')
for path in ['/api/task-schedules/', '/api/jobs/', '/api/job-templates/', '/api/execution-logs/']:
    r = requests.get('http://127.0.0.1:8000' + path, timeout=5)
    print('  %s -> %d' % (path, r.status_code))

# 2) 触发编排执行
print('\n=== 触发 Schedule 6 编排执行 ===')
r = requests.post('http://127.0.0.1:8000/api/task-schedules/6/execute',
                 json={'target_host': '192.168.10.100'}, timeout=120)
print('status:', r.status_code)
data = r.json()
log_id = data.get('log_id')
print('log_id:', log_id)
print('success:', data.get('success'))
api_out = data.get('output', '')
print('API output len:', len(api_out))

if not log_id:
    print('ERROR: no log_id')
    sys.exit(1)

# 3) 查数据库 CLOB 内容
print('\n=== 数据库验证 ===')
conn = yasdb.connect(host='192.168.10.100', port=1688, user='dreamops', password='123456')
cur = conn.cursor()
cur.execute('SELECT length(output) FROM execution_logs WHERE id = %d' % log_id)
row = cur.fetchone()
db_len = row[0] if row else 0
print('DB output len:', db_len)

if db_len > 0:
    cur.execute('SELECT output FROM execution_logs WHERE id = %d' % log_id)
    val = cur.fetchone()[0]
    try:
        j = json.loads(val)
        print('JSON parse OK')
        for tpl in j.get('templates', []):
            print('\n  template: %s (status=%s)' % (tpl['template_name'], tpl['status']))
            for sc in tpl.get('scripts', []):
                out = sc.get('output', '') or ''
                print('    script: %s | out=%d bytes | success=%s' % (sc['script_name'], len(out), sc['success']))
                if out:
                    print('      preview: %s' % repr(out[:120]))
    except Exception as e:
        print('JSON parse FAIL:', e)
        print('raw preview:', repr(val[:300]))
else:
    print('CLOB is empty!')

conn.close()
print('\n=== DONE ===')
