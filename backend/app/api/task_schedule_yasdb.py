"""
Task Schedule API - YashanDB
任务编排：可包含多个作业模板，按顺序执行
"""
import json
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from app.crud.task_schedule_yasdb import (
    get_schedules, get_schedule, create_schedule,
    update_schedule, delete_schedule,
    add_schedule_item, remove_schedule_item, reorder_schedule_items,
    update_schedule_execution_stats
)
from app.crud.job_template_yasdb import get_job_templates, get_job_template
from app.db.yasdb_pool import get_db
from datetime import datetime

router = APIRouter()


# Schema
class ScheduleItemCreate(BaseModel):
    template_id: int


class ScheduleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    schedule_type: str = "immediate"
    cron_expression: Optional[str] = None
    items: List[ScheduleItemCreate] = []


class ScheduleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    schedule_type: Optional[str] = None
    cron_expression: Optional[str] = None
    status: Optional[str] = None
    items: Optional[List[ScheduleItemCreate]] = None  # 传整个items列表则全量替换


class ScheduleItemResponse(BaseModel):
    id: int
    schedule_id: int
    template_id: int
    sort_order: int
    template_name: Optional[str] = None


class ScheduleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    schedule_type: str
    cron_expression: Optional[str] = None
    status: str
    creator: str
    create_time: Optional[str] = None
    last_execution_time: Optional[str] = None
    total_executions: int
    failed_executions: int
    items: List[ScheduleItemResponse]


@router.get("/", response_model=List[ScheduleResponse])
async def read_schedules(skip: int = 0, limit: int = 100):
    try:
        with get_db() as db:
            return get_schedules(db, skip, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{schedule_id}", response_model=ScheduleResponse)
async def read_schedule(schedule_id: int):
    with get_db() as db:
        schedule = get_schedule(db, schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="编排不存在")
    return schedule


@router.post("/", response_model=ScheduleResponse)
async def create_schedule_endpoint(schedule: ScheduleCreate):
    try:
        with get_db() as db:
            # 先创建编排
            schedule_dict = schedule.model_dump(mode='python')
            items_data = schedule_dict.pop("items", [])
            new_schedule = create_schedule(db, schedule_dict)
            sid = new_schedule["id"]
            # 再逐个添加模板项
            for item in items_data:
                add_schedule_item(db, sid, item["template_id"])
            return get_schedule(db, sid)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{schedule_id}", response_model=ScheduleResponse)
async def update_schedule_endpoint(schedule_id: int, schedule: ScheduleUpdate):
    with get_db() as db:
        existing = get_schedule(db, schedule_id)
        if not existing:
            raise HTTPException(status_code=404, detail="编排不存在")
        try:
            schedule_dict = schedule.model_dump(exclude_unset=True, mode='python')
            items_data = schedule_dict.pop("items", None)
            updated = update_schedule(db, schedule_id, schedule_dict)
            # 如果传了 items，全量替换
            if items_data is not None:
                db.execute(f"DELETE FROM task_schedule_items WHERE schedule_id = {schedule_id}")
                for idx, item in enumerate(items_data):
                    add_schedule_item(db, schedule_id, item["template_id"])
            return get_schedule(db, schedule_id)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{schedule_id}")
async def delete_schedule_endpoint(schedule_id: int):
    with get_db() as db:
        existing = get_schedule(db, schedule_id)
        if not existing:
            raise HTTPException(status_code=404, detail="编排不存在")
        try:
            delete_schedule(db, schedule_id)
            return {"message": "删除成功"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


# 添加模板项
@router.post("/{schedule_id}/items")
async def add_item_endpoint(schedule_id: int, template_id: int = Query(...)):
    with get_db() as db:
        schedule = get_schedule(db, schedule_id)
        if not schedule:
            raise HTTPException(status_code=404, detail="编排不存在")
        try:
            item = add_schedule_item(db, schedule_id, template_id)
            return {"message": "添加成功", "item": item}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


# 删除模板项
@router.delete("/{schedule_id}/items/{item_id}")
async def remove_item_endpoint(schedule_id: int, item_id: int):
    with get_db() as db:
        schedule = get_schedule(db, schedule_id)
        if not schedule:
            raise HTTPException(status_code=404, detail="编排不存在")
        try:
            remove_schedule_item(db, item_id)
            return {"message": "删除成功"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


# 重排模板项
@router.put("/{schedule_id}/items/reorder")
async def reorder_items_endpoint(schedule_id: int, item_ids: List[int]):
    with get_db() as db:
        schedule = get_schedule(db, schedule_id)
        if not schedule:
            raise HTTPException(status_code=404, detail="编排不存在")
        try:
            reorder_schedule_items(db, schedule_id, item_ids)
            return {"message": "排序成功"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


# 执行编排
@router.post("/{schedule_id}/execute")
async def execute_schedule_endpoint(
    schedule_id: int,
    body: Optional[dict] = None,
    target_host: Optional[str] = Query(None, description="目标主机IP")
):
    """
    执行任务编排（异步）：
    1. 创建一个全局 TaskID + 一条日志（type='schedule'）
    2. 立即返回TaskID，后台异步执行任务
    3. 用户可以在执行日志页面查看实时进度
    """
    from app.utils.job_engine import JobExecutionEngine
    from app.crud.execution_log_yasdb import create_execution_log
    from app.db.yasdb_pool import get_next_task_id
    import asyncio

    # 同时支持 JSON body 和 query string 传入 target_host
    if body and isinstance(body, dict):
        target_host = body.get('target_host') or target_host

    with get_db() as db:
        schedule = get_schedule(db, schedule_id)
        if not schedule:
            raise HTTPException(status_code=404, detail="编排不存在")
        items = schedule.get("items", [])
        if not items:
            raise HTTPException(status_code=400, detail="编排中没有模板，无法执行")

    task_id = get_next_task_id()
    schedule_start = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # 创建一条执行日志（状态为running）
    with get_db() as db:
        log = create_execution_log(db, {
            "job_id": None,
            "template_id": None,
            "script_id": None,
            "execution_type": "schedule",
            "name": schedule["name"],
            "status": "running",
            "output": "",
            "error": "",
            "creator": schedule.get("creator", "admin"),
            "start_time": schedule_start,
        }, task_id=task_id)
        log_id = log["id"]

    # 启动后台异步任务执行
    asyncio.create_task(_execute_schedule_background(
        schedule_id, schedule["name"], items, target_host, 
        task_id, log_id, schedule_start
    ))

    # 立即返回TaskID，让用户可以查看执行日志
    return {
        "success": True,
        "task_id": task_id,
        "log_id": log_id,
        "schedule_id": schedule_id,
        "schedule_name": schedule["name"],
        "message": f"任务已开始执行，TaskID: Task-{str(task_id).zfill(10)}，请前往执行日志页面查看进度",
        "redirect_url": f"/execution-logs"
    }


async def _execute_schedule_background(
    schedule_id: int,
    schedule_name: str,
    items: List[dict],
    target_host: Optional[str],
    task_id: int,
    log_id: int,
    schedule_start: str
):
    """
    后台异步执行任务编排
    使用后台数据库连接池，避免阻塞主连接池
    """
    from app.utils.job_engine import JobExecutionEngine
    from app.crud.execution_log_yasdb import update_execution_log
    from app.crud.job_template_yasdb import get_job_template
    from app.db.background_db import get_background_db
    import asyncio
    
    # 收集所有脚本结果（模板名、脚本名、开始/结束/耗时）
    scripts_result = []
    templates_result = []
    overall_success = True
    first_error = ""

    for idx, item in enumerate(items):
        tpl_id = item["template_id"]
        tpl_name = item["template_name"] or f"模板{tpl_id}"

        # 使用后台数据库连接获取模板数据
        with get_background_db() as db:
            template = get_job_template(db, tpl_id)
        if not template:
            templates_result.append({
                "template_id": tpl_id, "template_name": tpl_name,
                "status": "skipped", "error": "模板不存在",
                "scripts": []
            })
            continue

        template_scripts = template.get("script_ids", [])
        tpl_scripts = []
        tpl_success = True

        for s_idx, script_id in enumerate(template_scripts):
            # 使用后台数据库连接执行脚本
            with get_background_db() as db:
                r = JobExecutionEngine.execute_script_no_log(db, script_id, target_host)
            # 连接会自动释放

            r["index"] = f"{idx+1}.{s_idx+1}"
            r["template_id"] = tpl_id
            r["template_name"] = tpl_name
            r["script_index"] = s_idx + 1
            r["script_total"] = len(template_scripts)
            r["template_index"] = idx + 1
            r["template_total"] = len(items)
            scripts_result.append(r)
            tpl_scripts.append({
                "script_id": script_id,
                "script_name": r["script_name"],
                "start_time": r["start_time"],
                "end_time": r["end_time"],
                "duration_seconds": r["duration_seconds"],
                "success": r["success"],
                "output": r.get("output", ""),
                "error": r.get("error", ""),
            })

            if not r["success"]:
                tpl_success = False
                overall_success = False
                if not first_error:
                    first_error = f"模板「{tpl_name}」脚本「{r['script_name']}」失败：{r.get('error', '未知')}"
                break  # 停止当前模板，继续下一模板？按需求：任一失败则停止

        templates_result.append({
            "template_id": tpl_id,
            "template_name": tpl_name,
            "status": "success" if tpl_success else "failed",
            "scripts": tpl_scripts,
        })

        if not tpl_success:
            break  # 停止后续模板

    schedule_end = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    final_status = "success" if overall_success else "failed"

    output_text = _build_text_summary(templates_result, schedule_start, schedule_end, overall_success, first_error)

    # 使用后台数据库连接更新执行日志
    with get_background_db() as db:
        update_execution_log(db, log_id, {
            "status": final_status,
            "output": output_text,
            "error": first_error if not overall_success else "",
            "end_time": schedule_end,
        })
        update_schedule_execution_stats(db, schedule_id, overall_success)


def _calc_duration(start: str, end: str) -> float:
    try:
        fmt = "%Y-%m-%d %H:%M:%S"
        s = datetime.strptime(start, fmt)
        e = datetime.strptime(end, fmt)
        return round((e - s).total_seconds(), 2)
    except Exception:
        return 0.0


def _build_text_summary(templates_result, schedule_start, schedule_end, overall_success, first_error) -> str:
    """
    返回结构化 JSON，供前端 ExecutionLogs 详情弹窗解析渲染展开树。
    结构：
      {
        "schedule_id": int,
        "schedule_name": str,
        "schedule_start": str,
        "schedule_end": str,
        "total_duration_seconds": float,
        "templates": [
          {
            "template_id": int,
            "template_name": str,
            "template_index": int,   # 1-based，在编排中的顺序
            "template_total": int,
            "status": "success" | "failed" | "skipped",
            "scripts": [
              {
                "script_id": int,
                "script_name": str,
                "script_index": int,       # 1-based，在模板内的顺序
                "script_total": int,
                "start_time": str,
                "end_time": str,
                "duration_seconds": float,
                "success": bool,
                "output": str,             # 脚本标准输出（可能含 JSON）
                "error": str,              # 脚本错误输出
              }
            ]
          }
        ]
      }
    """
    total_duration = 0.0
    for tpl in templates_result:
        for sc in tpl.get("scripts", []):
            total_duration += sc.get("duration_seconds") or 0

    return json.dumps({
        "schedule_id": 0,
        "schedule_name": "",
        "schedule_start": schedule_start,
        "schedule_end": schedule_end,
        "total_duration_seconds": round(total_duration, 2),
        "templates": [
            {
                "template_id": tpl.get("template_id"),
                "template_name": tpl.get("template_name"),
                "template_index": idx + 1,
                "template_total": len(templates_result),
                "status": tpl.get("status", "failed"),
                "scripts": [
                    {
                        "script_id": sc.get("script_id"),
                        "script_name": sc.get("script_name"),
                        "script_index": sidx + 1,
                        "script_total": len(tpl.get("scripts", [])),
                        "start_time": sc.get("start_time"),
                        "end_time": sc.get("end_time"),
                        "duration_seconds": sc.get("duration_seconds"),
                        "success": sc.get("success", False),
                        "output": sc.get("output", ""),
                        "error": sc.get("error", ""),
                    }
                    for sidx, sc in enumerate(tpl.get("scripts", []))
                ],
            }
            for idx, tpl in enumerate(templates_result)
        ],
    }, ensure_ascii=False)
