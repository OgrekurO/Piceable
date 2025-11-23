"""
用户数据访问层 (CRUD操作)
负责处理用户相关的数据库操作，包括用户认证、创建、查询等操作。
支持SQLite和PostgreSQL两种数据库。
"""

from app.database.connection import get_db_connection
from app.models.schemas import UserCreate, User, UserPublic
from app.auth.security import get_password_hash, verify_password

def get_user_from_db(db, username: str):
    """
    根据用户名从数据库获取用户信息
    
    Args:
        db: 数据库连接对象（注意：此参数在函数中未使用，实际使用的是get_db_connection获取的新连接）
        username (str): 用户名
        
    Returns:
        User对象或None（如果用户不存在）
    """
    # 获取数据库连接
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 检查数据库类型以使用相应的参数占位符
    if conn.row_factory:  # SQLite
        cur.execute("SELECT id, username, email, hashed_password, is_active, role_id FROM users WHERE username = ?", (username,))
    else:  # PostgreSQL
        cur.execute("SELECT id, username, email, hashed_password, is_active, role_id FROM users WHERE username = %s", (username,))
    
    # 获取查询结果
    user_row = cur.fetchone()
    cur.close()
    conn.close()
    
    # 如果找到用户，将数据库字段转换为模型字段并返回User对象
    if user_row:
        # 将数据库字段名转换为模型字段名
        user_dict = dict(user_row)
        user_dict['isActive'] = user_dict.pop('is_active')
        user_dict['roleId'] = user_dict.pop('role_id')
        return User(**user_dict)

def authenticate_user_from_db(username: str, password: str):
    """
    验证用户身份
    
    Args:
        username (str): 用户名
        password (str): 明文密码
        
    Returns:
        User对象（验证成功）或False（验证失败）
    """
    # 获取数据库连接并查询用户
    conn = get_db_connection()
    user = get_user_from_db(conn, username)
    conn.close()
    
    # 如果用户不存在，验证失败
    if not user:
        return False
    
    # 验证密码是否正确
    if not verify_password(password, user.hashed_password):
        return False
    
    # 验证成功，返回用户对象
    return user

def create_user_in_db(user: UserCreate):
    """
    在数据库中创建新用户
    
    Args:
        user (UserCreate): 包含用户信息的Pydantic模型
        
    Returns:
        创建的User对象或None（创建失败）
    """
    # 获取数据库连接
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 对用户密码进行哈希处理
    hashed_password = get_password_hash(user.password)
    
    # 根据数据库类型使用相应的SQL语句和参数占位符
    if conn.row_factory:  # SQLite
        cur.execute("""
            INSERT INTO users (username, email, hashed_password, is_active, role_id)
            VALUES (?, ?, ?, ?, ?)
            RETURNING id, username, email, hashed_password, is_active, role_id
        """, (user.username, user.email, hashed_password, user.isActive, user.roleId))
    else:  # PostgreSQL
        cur.execute("""
            INSERT INTO users (username, email, hashed_password, is_active, role_id)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, username, email, hashed_password, is_active, role_id
        """, (user.username, user.email, hashed_password, user.isActive, user.roleId))
    
    # 获取插入的用户数据
    user_row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    
    # 如果成功插入，将数据库字段转换为模型字段并返回User对象
    if user_row:
        # 将数据库字段名转换为模型字段名
        user_dict = dict(user_row)
        user_dict['isActive'] = user_dict.pop('is_active')
        user_dict['roleId'] = user_dict.pop('role_id')
        return User(**user_dict)
    return None

def get_all_users_from_db():
    """
    获取所有用户
    
    Returns:
        User对象列表
    """
    # 获取数据库连接
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 根据数据库类型使用相应的SQL语句和参数占位符
    if conn.row_factory:  # SQLite
        cur.execute("SELECT id, username, email, is_active, role_id FROM users")
    else:  # PostgreSQL
        cur.execute("SELECT id, username, email, is_active, role_id FROM users")
    
    # 获取所有用户数据
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    # 将数据库字段转换为模型字段，并创建User对象列表
    users = []
    for row in rows:
        # 将数据库字段名转换为模型字段名
        user_dict = dict(row)
        user_dict['isActive'] = user_dict.pop('is_active')
        user_dict['roleId'] = user_dict.pop('role_id')
        # 使用UserPublic模型而不是User模型，因为UserPublic不包含密码字段
        users.append(UserPublic(**user_dict))
    
    return users

def update_user_role_in_db(user_id: int, role_id: int):
    """
    更新用户角色
    
    Args:
        user_id (int): 用户ID
        role_id (int): 新的角色ID
        
    Returns:
        bool: 更新是否成功
    """
    # 获取数据库连接
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 根据数据库类型使用相应的SQL语句和参数占位符
    if conn.row_factory:  # SQLite
        cur.execute("UPDATE users SET role_id = ? WHERE id = ?", (role_id, user_id))
    else:  # PostgreSQL
        cur.execute("UPDATE users SET role_id = %s WHERE id = %s", (role_id, user_id))
    
    # 提交更改并检查影响的行数
    conn.commit()
    rows_affected = cur.rowcount
    cur.close()
    conn.close()
    
    # 如果影响的行数大于0，说明更新成功
    return rows_affected > 0