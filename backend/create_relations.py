import os
os.environ['YASDB_HOME'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64'
os.environ['PATH'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64\lib;' + os.environ.get('PATH','')
import yasdb

conn = yasdb.connect(host='192.168.10.100', port=1688, user='dreamops', password='123456')
conn.autocommit = True
cur = conn.cursor()

# 创建关系表
cur.execute("""
CREATE TABLE cmdb_relationships (
    id NUMBER(10) PRIMARY KEY,
    source VARCHAR2(50) NOT NULL,
    target VARCHAR2(50) NOT NULL,
    type VARCHAR2(50) NOT NULL,
    description VARCHAR2(255),
    create_time TIMESTAMP DEFAULT SYSTIMESTAMP
)
""")
print('Created cmdb_relationships table')

# 创建序列
cur.execute("""
CREATE SEQUENCE cmdb_relationships_seq
    START WITH 1
    INCREMENT BY 1
    NOMAXVALUE
    NOCYCLE
""")
print('Created cmdb_relationships_seq')

# 添加一些示例关系数据
sample_rels = [
    ('app-svc-001', 'db-001', 'depends_on', '用户服务依赖数据库'),
    ('app-svc-002', 'db-002', 'depends_on', '订单服务依赖数据库'),
    ('app-svc-003', 'db-001', 'depends_on', '支付服务依赖数据库'),
    ('app-svc-004', 'app-svc-001', 'depends_on', '客服依赖用户服务'),
    ('app-svc-005', 'app-svc-003', 'depends_on', '活动平台依赖支付'),
    ('app-svc-006', 'cloud-001', 'hosted_on', '运维平台托管在云主机'),
    ('app-svc-007', 'cloud-001', 'hosted_on', '监控平台托管在云主机'),
    ('app-svc-008', 'app-svc-001', 'depends_on', '通知服务依赖用户服务'),
    ('cloud-001', 'db-001', 'connects_to', '云主机连接数据库'),
    ('cloud-002', 'db-002', 'connects_to', 'RDS连接应用'),
]

for i, (src, tgt, typ, desc) in enumerate(sample_rels, 1):
    cur.execute("""
        INSERT INTO cmdb_relationships (id, source, target, type, description)
        VALUES (:id, :src, :tgt, :typ, :desc)
    """, {'id': i, 'src': src, 'tgt': tgt, 'typ': typ, 'desc': desc})

print(f'Inserted {len(sample_rels)} relationships')

# 验证
cur.execute('SELECT COUNT(*) FROM cmdb_relationships')
print(f'Total relationships: {cur.fetchone()[0]}')

conn.close()
print('Done!')