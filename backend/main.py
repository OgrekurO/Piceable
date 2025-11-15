from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Eagle Ontology Manager API", version="2.0.0")

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 包含路由
from app.auth.routes import router as auth_router
from app.users.routes import router as users_router
from app.eagle.routes import router as eagle_router
from app.logs.routes import router as logs_router

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(eagle_router, prefix="/api/v1", tags=["eagle"])
app.include_router(logs_router, prefix="/logs", tags=["logs"])

@app.get("/")
async def root():
    return {"message": "Eagle Ontology Manager API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)