from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from app.config import ACCESS_TOKEN_EXPIRE_MINUTES
from app.models.schemas import Token, User, UserCreate
from app.auth.jwt import create_access_token
from app.crud.users import authenticate_user_from_db, create_user_in_db, get_all_users_from_db, update_user_role_in_db
from app.api.dependencies import get_current_active_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user_from_db(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=User)
async def register_user(user: UserCreate):
    # 检查用户是否已存在
    existing_user = authenticate_user_from_db(user.username, user.password)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户已存在",
        )
    
    # 创建新用户
    created_user = create_user_in_db(user)
    if not created_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="创建用户失败",
        )
    
    return created_user

@router.get("/users", response_model=list[User])
async def get_users(current_user: User = Depends(get_current_active_user)):
    # 只有管理员可以获取用户列表
    if current_user.role_id != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足",
        )
    
    users = get_all_users_from_db()
    return users

@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: int, 
    role_id: int,
    current_user: User = Depends(get_current_active_user)
):
    # 只有管理员可以更新用户角色
    if current_user.role_id != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足",
        )
    
    success = update_user_role_in_db(user_id, role_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户未找到",
        )
    
    return {"message": "用户角色更新成功"}