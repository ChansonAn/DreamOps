"""
DreamOP Platform Main - YashanDB 版本
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 使用 yasdb 版本的 API
from app.modules.user.api import users_yasdb as users
from app.api import script_yasdb as script, cmdb_yasdb as cmdb
from app.api import job_template_yasdb as job_template, job_yasdb as job, execution_log_yasdb as execution_log
from app.api import task_schedule_yasdb as task_schedule
from app.modules.knowledge import knowledge
from app.modules.blog.api import articles_yasdb as articles, categories_yasdb as categories, tags_yasdb as tags, comments_yasdb as comments, likes_yasdb as likes, favorites_yasdb as favorites

from config.config import settings

app = FastAPI(
    title="DreamOP Platform API (YashanDB)",
    description="DreamOP 运维管理平台后端 API - YashanDB 版本",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api/users", tags=["用户管理"])
app.include_router(script.router, prefix="/api/script", tags=["脚本管理"])
app.include_router(job_template.router, prefix="/api/job-templates", tags=["作业模板"])
app.include_router(job.router, prefix="/api/jobs", tags=["作业管理"])
app.include_router(task_schedule.router, prefix="/api/task-schedules", tags=["任务编排"])
app.include_router(execution_log.router, prefix="/api/execution-logs", tags=["执行日志"])
app.include_router(cmdb.router, prefix="/api/cmdb", tags=["配置管理"])
app.include_router(knowledge, prefix="/api/knowledge", tags=["知识库"])
app.include_router(articles.router, prefix="/api/articles", tags=["articles"])
app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
app.include_router(tags.router, prefix="/api/tags", tags=["tags"])
app.include_router(comments.router, prefix="/api/comments", tags=["comments"])
app.include_router(likes.router, prefix="/api/likes", tags=["likes"])
app.include_router(favorites.router, prefix="/api/favorites", tags=["favorites"])

# 兼容旧路由 /scripts -> /api/script
@app.get("/scripts")
async def redirect_scripts():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/api/script")

@app.get("/scripts/{script_id}")
async def redirect_script(script_id: int):
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=f"/api/script/{script_id}")

@app.post("/scripts")
async def redirect_create_script():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/api/script")

@app.put("/scripts/{script_id}")
async def redirect_update_script(script_id: int):
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=f"/api/script/{script_id}")

@app.delete("/scripts/{script_id}")
async def redirect_delete_script(script_id: int):
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=f"/api/script/{script_id}")

@app.post("/scripts/{script_id}/run")
async def redirect_run_script(script_id: int):
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=f"/api/script/{script_id}/run")

@app.get("/")
async def root():
    return {"message": "DreamOP Platform API v2.1 (YashanDB)"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main_yasdb:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False
    )
