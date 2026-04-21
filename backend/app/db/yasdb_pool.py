"""
YashanDB 连接池管理器 - 简化版
"""
import os
import threading
from contextlib import contextmanager
from typing import Optional, Dict, Any, List, Generator
from decimal import Decimal
from datetime import datetime, date

os.environ['YASDB_HOME'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64'
os.environ['PATH'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64\lib;' + os.environ.get('PATH', '')

import yasdb

YASDB_CONFIG = {
    'host': '192.168.10.100',
    'port': 1688,
    'user': 'dreamops',
    'password': '123456'
}


def _convert_value(v):
    """转换 yasdb 返回的 Decimal/datetime 为 Python 原生类型"""
    if v is None:
        return None
    if isinstance(v, Decimal):
        # 转为 int 如果是小数或转 float
        try:
            return int(v) if v == v.to_integral_value() else float(v)
        except (ValueError, TypeError):
            return float(v)
    if isinstance(v, (datetime, date)):
        return str(v)
    return v


def _row_to_dict(row: tuple, cols: List[str]) -> Dict[str, Any]:
    """行转字典，自动转换类型"""
    return {col: _convert_value(val) for col, val in zip(cols, row)}


class YasdbSession:
    """崖山数据库会话，模拟 SQLAlchemy Session"""
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        self._local = threading.local()
    
    def _get_conn(self):
        if not hasattr(self._local, 'conn') or self._local.conn is None:
            self._local.conn = yasdb.connect(**YASDB_CONFIG)
            self._local.conn.autocommit = True
        return self._local.conn
    
    def _get_cur(self):
        if not hasattr(self._local, 'cur') or self._local.cur is None:
            self._local.cur = self._get_conn().cursor()
        return self._local.cur
    
    def execute(self, sql: str, params: Optional[Dict] = None) -> None:
        """执行 SQL"""
        cur = self._get_cur()
        if params:
            # yasdb 支持命名参数
            cur.execute(sql, params)
        else:
            cur.execute(sql)
    
    def fetchone_dict(self) -> Optional[Dict[str, Any]]:
        """获取一条记录为字典"""
        cur = self._get_cur()
        if cur.description:
            cols = [d[0].lower() for d in cur.description]
            row = cur.fetchone()
            return _row_to_dict(row, cols) if row else None
        return None
    
    def fetchall_dicts(self) -> List[Dict[str, Any]]:
        """获取所有记录为字典列表"""
        cur = self._get_cur()
        if cur.description:
            cols = [d[0].lower() for d in cur.description]
            rows = cur.fetchall()
            return [_row_to_dict(row, cols) for row in rows]
        return []
    
    def commit(self):
        self._get_conn().commit()
    
    def rollback(self):
        self._get_conn().rollback()
    
    def close(self):
        if hasattr(self._local, 'cur') and self._local.cur:
            try:
                self._local.cur.close()
            except:
                pass
            self._local.cur = None
        if hasattr(self._local, 'conn') and self._local.conn:
            try:
                self._local.conn.close()
            except:
                pass
            self._local.conn = None


# 全局会话
_db = YasdbSession()


@contextmanager
def get_db() -> Generator[YasdbSession, None, None]:
    """数据库会话上下文管理器"""
    try:
        yield _db
        _db.commit()
    except Exception:
        _db.rollback()
        raise


def get_db_session() -> YasdbSession:
    return _db


# ========== 辅助函数 ==========

def query_one(sql: str, params: Optional[Dict] = None) -> Optional[Dict[str, Any]]:
    """查询单条"""
    _db.execute(sql, params)
    return _db.fetchone_dict()


def query_all(sql: str, params: Optional[Dict] = None) -> List[Dict[str, Any]]:
    """查询多条"""
    _db.execute(sql, params)
    return _db.fetchall_dicts()


def execute_sql(sql: str, params: Optional[Dict] = None) -> None:
    """执行 SQL（INSERT/UPDATE/DELETE）"""
    _db.execute(sql, params)


def get_next_id(table: str) -> int:
    """
    获取下一个可用的ID。直接用 MAX(id)+1，不依赖序列，
    避免数据迁移时序列与实际数据不同步的问题。
    """
    _db.execute(f"SELECT MAX(id) as max_id FROM {table}")
    result = _db.fetchone_dict()
    if result:
        max_val = result.get('max_id')
        return (int(max_val) + 1) if max_val is not None else 1
    return 1


def get_next_task_id() -> int:
    """从全局序列获取下一个 TaskID（执行任务全局序列号）"""
    _db.execute("SELECT task_id_seq.NEXTVAL FROM DUAL")
    result = _db.fetchone_dict()
    # fetchone_dict 的 key 是完整的列表达式，如 'task_id_seq.nextval'
    if result:
        for v in result.values():
            return int(v)
    return 1
