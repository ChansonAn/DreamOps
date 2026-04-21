import os
os.environ['YASDB_HOME'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64'
os.environ['PATH'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64\lib;' + os.environ.get('PATH', '')

from app.db.yasdb_pool import get_db

# 创建表
with get_db() as db:
    # job_templates
    db.execute('''CREATE TABLE IF NOT EXISTS job_templates (
        id INT, name VARCHAR(255) NOT NULL, description VARCHAR(1000),
        script_ids VARCHAR(1000), cron_expression VARCHAR(100),
        status VARCHAR(20) DEFAULT '启用', creator VARCHAR(50) DEFAULT 'admin',
        create_time TIMESTAMP
    )''')
    
    # jobs
    db.execute('''CREATE TABLE IF NOT EXISTS jobs (
        id INT, name VARCHAR(255) NOT NULL, template_id INT,
        job_type VARCHAR(20) DEFAULT '立即执行', cron_expression VARCHAR(100),
        status VARCHAR(20) DEFAULT '待执行', creator VARCHAR(50) DEFAULT 'admin',
        create_time TIMESTAMP, last_execution TIMESTAMP, next_execution TIMESTAMP
    )''')
    
    # execution_logs
    db.execute('''CREATE TABLE IF NOT EXISTS execution_logs (
        id INT, job_id INT, template_id INT, script_id INT,
        execution_type VARCHAR(20) NOT NULL, name VARCHAR(255) NOT NULL,
        status VARCHAR(20) DEFAULT '执行中', output VARCHAR(4000),
        error VARCHAR(4000), creator VARCHAR(50) DEFAULT 'admin',
        start_time TIMESTAMP, end_time TIMESTAMP
    )''')
    
    db.commit()
    print('Tables created')

# 测试插入
with get_db() as db:
    from app.db.yasdb_pool import get_next_id
    
    # 获取脚本列表
    db.execute("SELECT id, name FROM scripts LIMIT 10")
    scripts = db.fetchall_dicts()
    print(f"Scripts: {scripts}")
    
    # 插入一个测试模板
    if scripts:
        script_ids = [s['id'] for s in scripts[:2]]
        template_id = get_next_id('job_templates')
        db.execute(f"""INSERT INTO job_templates (id, name, description, script_ids, status, creator, create_time)
            VALUES ({template_id}, '测试巡检模板', '包含MySQL和Linux巡检', '[{','.join(map(str,script_ids))}]', '启用', 'admin', SYSDATE)""")
        db.commit()
        print(f"Created template {template_id}")
        
        # 插入一个测试作业
        job_id = get_next_id('jobs')
        db.execute(f"""INSERT INTO jobs (id, name, template_id, job_type, status, creator, create_time)
            VALUES ({job_id}, '每日巡检作业', {template_id}, '定时执行', '待执行', 'admin', SYSDATE)""")
        db.commit()
        print(f"Created job {job_id}")
        
        # 插入一个测试日志
        log_id = get_next_id('execution_logs')
        db.execute(f"""INSERT INTO execution_logs (id, script_id, execution_type, name, status, creator, start_time)
            VALUES ({log_id}, {scripts[0]['id']}, 'script', '{scripts[0]['name']}', '成功', 'admin', SYSDATE)""")
        db.commit()
        print(f"Created log {log_id}")
