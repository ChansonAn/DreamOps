"""
YashanDB migration utilities
将 SQLAlchemy 模型自动转换为 YashanDB DDL
"""
import os
os.environ['YASDB_HOME'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64'
os.environ['PATH'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64\lib;' + os.environ.get('PATH','')

import yasdb
from typing import Dict, Any, List, Optional


def get_seq_name(table: str) -> str:
    """获取 Sequence 名称"""
    return f"{table}_seq"


def get_next_id(cur, table: str) -> int:
    """获取下一个 ID"""
    seq_name = get_seq_name(table)
    cur.execute(f"SELECT {seq_name}.NEXTVAL FROM dual")
    return cur.fetchone()[0]


def execute_query(sql: str, params: Optional[Dict] = None) -> List[tuple]:
    """执行查询并返回结果"""
    conn = yasdb.connect(
        host='192.168.10.100',
        port=1688,
        user='dreamops',
        password='123456'
    )
    conn.autocommit = True
    cur = conn.cursor()
    
    if params:
        cur.prepare(sql)
        cur.execute(params)
    else:
        cur.execute(sql)
    
    try:
        results = cur.fetchall()
    except:
        results = []
    
    conn.close()
    return results


def execute_non_query(sql: str, params: Optional[Dict] = None):
    """执行非查询语句"""
    conn = yasdb.connect(
        host='192.168.10.100',
        port=1688,
        user='dreamops',
        password='123456'
    )
    conn.autocommit = True
    cur = conn.cursor()
    
    if params:
        cur.prepare(sql)
        cur.execute(params)
    else:
        cur.execute(sql)
    
    conn.close()


class YasdbModel:
    """YashanDB 模型基类"""
    table_name: str = ""
    id_column: str = "id"
    
    @classmethod
    def find_by_id(cls, id_val: Any) -> Optional[Dict]:
        """根据 ID 查找"""
        sql = f"SELECT * FROM {cls.table_name} WHERE {cls.id_column} = :id"
        results = execute_query(sql, {"id": id_val})
        if results and results[0]:
            return dict(zip([d[0] for d in results[0].cursor.description], results[0]))
        return None
    
    @classmethod
    def find_all(cls, limit: int = 100, offset: int = 0) -> List[Dict]:
        """查找所有"""
        sql = f"SELECT * FROM {cls.table_name} ORDER BY {cls.id_column} OFFSET {offset} ROWS FETCH NEXT {limit} ROWS ONLY"
        results = execute_query(sql)
        return results
    
    @classmethod
    def create(cls, data: Dict) -> int:
        """创建记录"""
        conn = yasdb.connect(host='192.168.10.100', port=1688, user='dreamops', password='123456')
        conn.autocommit = True
        cur = conn.cursor()
        
        # 获取下一个 ID
        new_id = get_next_id(cur, cls.table_name)
        
        # 构建 SQL
        cols = list(data.keys())
        vals = {k: v for k, v in data.items()}
        vals[cls.id_column] = new_id
        
        col_str = ", ".join([cls.id_column] + cols)
        param_str = ", ".join([f":{c}" for c in [cls.id_column] + cols])
        
        sql = f"INSERT INTO {cls.table_name} ({col_str}) VALUES ({param_str})"
        
        cur.execute(sql, vals)
        conn.close()
        return new_id
    
    @classmethod
    def update(cls, id_val: Any, data: Dict) -> bool:
        """更新记录"""
        if not data:
            return False
        
        set_str = ", ".join([f"{k} = :{k}" for k in data.keys()])
        data[cls.id_column] = id_val
        
        sql = f"UPDATE {cls.table_name} SET {set_str} WHERE {cls.id_column} = :id"
        execute_non_query(sql, data)
        return True
    
    @classmethod
    def delete(cls, id_val: Any) -> bool:
        """删除记录"""
        sql = f"DELETE FROM {cls.table_name} WHERE {cls.id_column} = :id"
        execute_non_query(sql, {"id": id_val})
        return True


# ========== 业务模型 ==========

class User(YasdbModel):
    table_name = "users"
    
    @classmethod
    def find_by_username(cls, username: str) -> Optional[Dict]:
        sql = "SELECT * FROM users WHERE username = :username"
        results = execute_query(sql, {"username": username})
        if results and len(results) > 0:
            # 获取列名
            desc = results[0].cursor.description
            cols = [d[0] for d in desc]
            return dict(zip(cols, results[0]))
        return None


class Category(YasdbModel):
    table_name = "categories"


class Article(YasdbModel):
    table_name = "articles"


class Comment(YasdbModel):
    table_name = "comments"


class Tag(YasdbModel):
    table_name = "tags"


class Script(YasdbModel):
    table_name = "scripts"


class CMDBConfigItem(YasdbModel):
    table_name = "cmdb_config_items"
    id_column = "id"


class CMDBTag(YasdbModel):
    table_name = "cmdb_tags"
    id_column = "id"


class CMDBRelationship(YasdbModel):
    table_name = "cmdb_relationships"