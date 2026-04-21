"""
YashanDB database layer - yasdb wrapper with SQLAlchemy-like interface
"""
import os
import yasdb
from contextlib import contextmanager
from typing import Generator, Any, List, Optional, Dict

# 设置崖山客户端环境
os.environ['YASDB_HOME'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64'
os.environ['PATH'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64\lib;' + os.environ.get('PATH', '')

from config.config import settings


class YasdbConnection:
    """崖山数据库连接管理"""
    
    def __init__(self):
        self._conn = None
        self._connected = False
    
    def connect(self):
        if not self._connected:
            try:
                self._conn = yasdb.connect(
                    host=settings.DB_HOST,
                    port=settings.DB_PORT,
                    user=settings.DB_USER,
                    password=settings.DB_PASSWORD
                )
                self._connected = True
                print(f"成功连接到崖山数据库: {settings.DB_HOST}:{settings.DB_PORT}")
            except Exception as e:
                print(f"连接崖山数据库失败: {e}")
                # 即使连接失败，也允许服务启动
                self._connected = False
        return self._conn
    
    def close(self):
        if self._conn and self._connected:
            self._conn.close()
            self._connected = False
    
    @property
    def cursor(self):
        if not self._connected:
            self.connect()
        return self._conn.cursor()


class YasdbSession:
    """模拟 SQLAlchemy Session 接口"""
    
    def __init__(self, conn: YasdbConnection):
        self._conn = conn
        self._cursor = None
    
    def __enter__(self):
        self._cursor = self._conn.cursor
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self._cursor:
            self._cursor.close()
        if exc_type:
            self._conn.close()
    
    def execute(self, sql: str, params: Optional[Dict] = None) -> 'YasdbResult':
        """执行 SQL"""
        if not self._cursor:
            self._cursor = self._conn.cursor
        
        if params:
            # 处理命名参数，转换为位置参数
            self._cursor.prepare(sql)
            self._cursor.execute(params)
        else:
            self._cursor.execute(sql)
        
        return YasdbResult(self._cursor)
    
    def commit(self):
        """提交事务"""
        self._conn._conn.commit()
    
    def rollback(self):
        """回滚事务"""
        self._conn._conn.rollback()
    
    def close(self):
        if self._cursor:
            self._cursor.close()


class YasdbResult:
    """查询结果封装"""
    
    def __init__(self, cursor):
        self._cursor = cursor
        self._rows = None
    
    def fetchone(self) -> Optional[tuple]:
        return self._cursor.fetchone()
    
    def fetchall(self) -> List[tuple]:
        return self._cursor.fetchall()
    
    def fetchmany(self, size: int) -> List[tuple]:
        return self._cursor.fetchmany(size)
    
    @property
    def rowcount(self) -> int:
        return self._cursor.rowcount
    
    @property
    def description(self):
        return self._cursor.description


# 全局连接池（简化版）
_connection_pool: List[YasdbConnection] = []
_pool_size = 10


def _get_connection() -> YasdbConnection:
    """从连接池获取连接"""
    global _connection_pool
    if _connection_pool:
        return _connection_pool.pop()
    
    conn = YasdbConnection()
    conn.connect()
    return conn


def _return_connection(conn: YasdbConnection):
    """归还连接到连接池"""
    global _connection_pool
    if len(_connection_pool) < _pool_size:
        _connection_pool.append(conn)
    else:
        conn.close()


@contextmanager
def get_db() -> Generator[YasdbSession, None, None]:
    """获取数据库会话（模拟 SQLAlchemy get_db）"""
    conn = _get_connection()
    session = YasdbSession(conn)
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
        _return_connection(conn)


# 兼容性：提供 Base 类（用于模型定义）
class YasdbBase:
    """模拟 SQLAlchemy Base 类"""
    __tablename__ = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {k: v for k, v in self.__dict__.items() if not k.startswith('_')}


# 导出
Base = YasdbBase
engine = None  # 兼容性占位
SessionLocal = lambda: YasdbSession(_get_connection())
