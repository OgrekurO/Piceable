from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from app.database.init_db import init_db
from app.api.routes import auth, items, projects

# 初始化数据库
init_db()

app = FastAPI(title="Eagle Ontology API", version="1.0.0")

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origin_regex="https?://.*",
    expose_headers=["Access-Control-Allow-Origin"]
)

# 添加一个专门的CORS处理中间件，确保所有响应都包含正确的头部
@app.middleware("http")
async def add_cors_headers(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

# 包含路由
app.include_router(auth.router)
app.include_router(items.router)
app.include_router(projects.router)

# 其他路由
@app.get("/")
async def root():
    return {"message": "欢迎使用 Piceable"}

# 如果需要通过 python main.py 启动，保留以下代码
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)