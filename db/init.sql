-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 角色表
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- 用户角色关联表
CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER,
    role_id INTEGER,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- 图像同步状态表
CREATE TABLE IF NOT EXISTS image_sync_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    eagle_id VARCHAR(255) UNIQUE NOT NULL,
    last_sync_time TIMESTAMP,
    user_id INTEGER,
    status VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 属性结构表
CREATE TABLE IF NOT EXISTS attribute_structures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- TEXT, NUMBER, DATE, SELECT, MULTI
    options JSON,
    parent_id INTEGER,
    user_id INTEGER,
    FOREIGN KEY (parent_id) REFERENCES attribute_structures(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 图像属性值表
CREATE TABLE IF NOT EXISTS image_attribute_values (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    eagle_id VARCHAR(255) NOT NULL,
    attribute_id INTEGER NOT NULL,
    value_json JSON,
    FOREIGN KEY (attribute_id) REFERENCES attribute_structures(id)
);

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    operation_type VARCHAR(50),
    target_type VARCHAR(50),
    target_id VARCHAR(255),
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 插入默认角色
INSERT OR IGNORE INTO roles (id, name, description) VALUES 
(1, 'admin', '管理员'),
(2, 'user', '普通用户'),
(3, 'viewer', '只读用户'),
(4, 'guest', '访客');