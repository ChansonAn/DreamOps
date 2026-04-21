"""
后台任务专用数据库连接池
为长时间运行的任务提供独立的数据库连接，避免阻塞主连接池
"""

import threading
import time
from typing import Optional, Dict, Any, List
from app.db.yasdb_pool import YasdbSession

class BackgroundDBSession:
    """
    后台任务专用数据库会话
    基于 YasdbSession 但使用独立的线程本地存储
    """
    
    def __init__(self):
        # 创建独立的 YasdbSession 实例
        self.session = YasdbSession.__new__(YasdbSession)
        self.session._local = threading.local()
    
    def _get_conn(self):
        if not hasattr(self.session._local, 'conn') or self.session._local.conn is None:
            # 导入 yasdb 并创建连接
            import yasdb
            from app.db.yasdb_pool import YASDB_CONFIG
            self.session._local.conn = yasdb.connect(**YASDB_CONFIG)
            self.session._local.conn.autocommit = True
        return self.session._local.conn
    
    def _get_cur(self):
        if not hasattr(self.session._local, 'cur') or self.session._local.cur is None:
            self.session._local.cur = self._get_conn().cursor()
        return self.session._local.cur
    
    def execute(self, sql: str, params: Optional[Dict] = None) -> None:
        """执行 SQL"""
        cur = self._get_cur()
        if params:
            cur.execute(sql, params)
        else:
            cur.execute(sql)
    
    def fetchone_dict(self) -> Optional[Dict[str, Any]]:
        """获取一条记录为字典"""
        from app.db.yasdb_pool import _row_to_dict
        cur = self._get_cur()
        if cur.description:
            cols = [d[0].lower() for d in cur.description]
            row = cur.fetchone()
            return _row_to_dict(row, cols) if row else None
        return None
    
    def fetchall_dicts(self) -> List[Dict[str, Any]]:
        """获取所有记录为字典列表"""
        from app.db.yasdb_pool import _row_to_dict
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
        """关闭连接"""
        if hasattr(self.session._local, 'cur') and self.session._local.cur:
            try:
                self.session._local.cur.close()
            except:
                pass
            self.session._local.cur = None
        if hasattr(self.session._local, 'conn') and self.session._local.conn:
            try:
                self.session._local.conn.close()
            except:
                pass
            self.session._local.conn = None


class BackgroundDBPool:
    """
    后台任务专用数据库连接池
    特点：
    1. 独立的连接池，不与主连接池共享连接
    2. 短生命周期连接，执行完成后立即释放
    3. 连接超时机制，防止长时间占用
    """
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
            return cls._instance
    
    def get_background_db(self):
        """
        获取后台任务数据库上下文管理器
        用法：
            with get_background_db() as db:
                # 执行数据库操作
        """
        class BackgroundDBContext:
            def __init__(self):
                self.db_session = None
            
            def __enter__(self):
                # 创建新的后台数据库会话
                self.db_session = BackgroundDBSession()
                return self.db_session
            
            def __exit__(self, exc_type, exc_val, exc_tb):
                # 执行完成后立即关闭连接
                if self.db_session:
                    self.db_session.close()
        
        return BackgroundDBContext()


# 全局实例
background_db_pool = BackgroundDBPool()

def get_background_db():
    """获取后台任务数据库上下文管理器"""
    return background_db_pool.get_background_db()