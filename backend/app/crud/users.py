from app.database.connection import get_db_connection
from app.models.schemas import UserInDB, UserCreate
from app.auth.security import get_password_hash, verify_password

def get_user_from_db(db, username: str):
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 检查数据库类型
    if conn.row_factory:  # SQLite
        cur.execute("SELECT id, username, email, hashed_password, is_active as isActive, role_id as roleId FROM users WHERE username = ?", (username,))
    else:  # PostgreSQL
        cur.execute("SELECT id, username, email, hashed_password, is_active as isActive, role_id as roleId FROM users WHERE username = %s", (username,))
    
    user_row = cur.fetchone()
    cur.close()
    conn.close()
    
    if user_row:
        return UserInDB(**dict(user_row))

def authenticate_user_from_db(username: str, password: str):
    conn = get_db_connection()
    user = get_user_from_db(conn, username)
    conn.close()
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_user_in_db(user: UserCreate):
    conn = get_db_connection()
    cur = conn.cursor()
    hashed_password = get_password_hash(user.password)
    
    # 检查数据库类型
    if conn.row_factory:  # SQLite
        cur.execute("""
            INSERT INTO users (username, email, hashed_password, is_active, role_id)
            VALUES (?, ?, ?, ?, ?)
            RETURNING id, username, email, hashed_password, is_active, role_id
        """, (user.username, user.email, hashed_password, user.is_active, user.role_id))
    else:  # PostgreSQL
        cur.execute("""
            INSERT INTO users (username, email, hashed_password, is_active, role_id)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, username, email, hashed_password, is_active, role_id
        """, (user.username, user.email, hashed_password, user.is_active, user.role_id))
    
    # 获取插入的用户数据
    user_row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    
    if user_row:
        return dict(user_row)

def get_all_users_from_db():
    """获取所有用户列表"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 检查数据库类型
    if conn.row_factory:  # SQLite
        cur.execute("SELECT id, username, email, is_active, role_id FROM users")
    else:  # PostgreSQL
        cur.execute("SELECT id, username, email, is_active, role_id FROM users")
    
    users_rows = cur.fetchall()
    cur.close()
    conn.close()
    
    users = []
    for row in users_rows:
        users.append(dict(row))
    
    return users

def update_user_role_in_db(user_id: int, role_id: int):
    """更新用户角色"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 检查数据库类型
    if conn.row_factory:  # SQLite
        cur.execute("UPDATE users SET role_id = ? WHERE id = ?", (role_id, user_id))
    else:  # PostgreSQL
        cur.execute("UPDATE users SET role_id = %s WHERE id = %s", (role_id, user_id))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return cur.rowcount > 0
