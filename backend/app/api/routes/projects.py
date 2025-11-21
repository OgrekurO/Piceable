from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models.schemas import Project, ProjectCreate
from app.crud.projects import get_projects_from_db, get_project_from_db, create_project_in_db, delete_project_from_db
from app.api.dependencies import get_current_active_user
from app.models.schemas import User

router = APIRouter(prefix="/api/projects", tags=["projects"])

@router.get("/", response_model=List[Project])
async def get_projects(current_user: User = Depends(get_current_active_user)):
    projects = get_projects_from_db(current_user.id)
    return projects

@router.get("/{project_id}", response_model=Project)
async def get_project(project_id: int, current_user: User = Depends(get_current_active_user)):
    project = get_project_from_db(project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="项目未找到")
    return project

@router.post("/", response_model=Project)
async def create_project(project: ProjectCreate, current_user: User = Depends(get_current_active_user)):
    try:
        created_project = create_project_in_db(
            name=project.name, 
            user_id=current_user.id,
            description=project.description,
            source_type=project.source_type or "manual",
            source_metadata=project.source_metadata
        )
        return created_project
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建项目失败: {str(e)}")

@router.delete("/{project_id}")
async def delete_project(project_id: int, current_user: User = Depends(get_current_active_user)):
    try:
        success = delete_project_from_db(project_id, current_user.id)
        if not success:
            raise HTTPException(status_code=404, detail="项目未找到")
        return {"message": "项目删除成功"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除项目失败: {str(e)}")