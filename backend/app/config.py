import os
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer

# 安全配置
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# 数据库连接配置
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///db/data.db")

# 密码加密上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")