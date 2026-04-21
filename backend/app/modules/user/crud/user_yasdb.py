"""
User CRUD - YashanDB 原生 SQL 版本
替代 SQLAlchemy ORM
"""
from typing import List, Optional, Dict, Any
import bcrypt


def get_password_hash(password: str) -> str:
    """生成密码哈希"""
    truncated_password = password[:72] if len(password) > 72 else password
    password_bytes = truncated_password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    truncated_password = plain_password[:72] if len(plain_password) > 72 else plain_password
    password_bytes = truncated_password.encode('utf-8')
    hash_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hash_bytes)


def get_user(db, user_id: int) -> Optional[Dict[str, Any]]:
    """根据 ID 获取用户"""
    from app.db.yasdb_pool import query_one
    return query_one("SELECT * FROM users WHERE id = :id", {"id": user_id})


def get_user_by_email(db, email: str) -> Optional[Dict[str, Any]]:
    """根据邮箱获取用户"""
    from app.db.yasdb_pool import query_one
    return query_one("SELECT * FROM users WHERE email = :email", {"email": email})


def get_user_by_username(db, username: str) -> Optional[Dict[str, Any]]:
    """根据用户名获取用户"""
    from app.db.yasdb_pool import query_one
    return query_one("SELECT * FROM users WHERE username = :username", {"username": username})


def get_users(db, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    """获取用户列表"""
    from app.db.yasdb_pool import query_all
    # 崖山分页语法
    sql = f"""
        SELECT * FROM users 
        ORDER BY id 
        OFFSET {skip} ROWS FETCH NEXT {limit} ROWS ONLY
    """
    return query_all(sql)


def create_user(db, user_in) -> Dict[str, Any]:
    """创建用户"""
    from app.db.yasdb_pool import get_next_id, execute_sql, query_one
    
    # 检查邮箱是否已存在
    existing_user = get_user_by_email(db, user_in.email)
    if existing_user:
        raise ValueError("Email already registered")
    
    # 检查用户名是否已存在
    existing_user = get_user_by_username(db, user_in.username)
    if existing_user:
        raise ValueError("Username already registered")
    
    # 获取新 ID
    new_id = get_next_id('users')
    
    # 插入记录
    sql = """
        INSERT INTO users (id, username, email, password_hash, avatar, bio, is_active, is_admin, created_at, updated_at)
        VALUES (:id, :username, :email, :password_hash, :avatar, :bio, 1, 0, SYSTIMESTAMP, SYSTIMESTAMP)
    """
    params = {
        'id': new_id,
        'username': user_in.username,
        'email': user_in.email,
        'password_hash': get_password_hash(user_in.password),
        'avatar': user_in.avatar,
        'bio': user_in.bio
    }
    execute_sql(sql, params)
    
    # 返回创建的用户
    return query_one("SELECT * FROM users WHERE id = :id", {"id": new_id})


def update_user(db, user_id: int, user_in) -> Optional[Dict[str, Any]]:
    """更新用户"""
    from app.db.yasdb_pool import execute_sql, query_one
    
    # 获取现有用户
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    update_data = user_in.dict(exclude_unset=True) if hasattr(user_in, 'dict') else dict(user_in)
    
    # 处理密码更新
    if "password" in update_data:
        update_data["password_hash"] = get_password_hash(update_data["password"])
        del update_data["password"]
    
    # 检查用户名唯一性
    if "username" in update_data and update_data["username"] != db_user['username']:
        existing_user = get_user_by_username(db, update_data["username"])
        if existing_user:
            raise ValueError("Username already registered")
    
    # 检查邮箱唯一性
    if "email" in update_data and update_data["email"] != db_user['email']:
        existing_user = get_user_by_email(db, update_data["email"])
        if existing_user:
            raise ValueError("Email already registered")
    
    # 构建 UPDATE 语句
    if not update_data:
        return db_user
    
    set_clauses = []
    params = {'id': user_id}
    for field, value in update_data.items():
        set_clauses.append(f"{field} = :{field}")
        params[field] = value
    
    # 添加 updated_at
    set_clauses.append("updated_at = SYSTIMESTAMP")
    
    sql = f"UPDATE users SET {', '.join(set_clauses)} WHERE id = :id"
    execute_sql(sql, params)
    
    return query_one("SELECT * FROM users WHERE id = :id", {"id": user_id})


def delete_user(db, user_id: int) -> bool:
    """删除用户"""
    from app.db.yasdb_pool import execute_sql, query_one
    
    db_user = get_user(db, user_id)
    if not db_user:
        return False
    
    execute_sql("DELETE FROM users WHERE id = :id", {"id": user_id})
    return True


def authenticate_user(db, username: str, password: str) -> Optional[Dict[str, Any]]:
    """用户认证（支持用户名或邮箱登录）"""
    # 尝试用户名登录
    user = get_user_by_username(db, username)
    if not user:
        # 尝试邮箱登录
        user = get_user_by_email(db, username)
    
    if not user:
        return None
    
    if not verify_password(password, user['password_hash']):
        return None
    
    return user


def get_users_count(db) -> int:
    """获取用户总数"""
    from app.db.yasdb_pool import query_one
    result = query_one("SELECT COUNT(*) as count FROM users")
    return result['count'] if result else 0
