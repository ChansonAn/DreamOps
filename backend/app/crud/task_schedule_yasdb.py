"""
Task Schedule CRUD - YashanDB
"""
from typing import List, Optional
from app.db.yasdb_pool import get_db, get_next_id


def _escape_sql(value: str) -> str:
    if value is None:
        return None
    return value.replace("'", "''")


def _serialize_item(s: dict) -> dict:
    return {
        "id": s.get("id"),
        "schedule_id": s.get("schedule_id"),
        "template_id": s.get("template_id"),
        "sort_order": s.get("sort_order"),
        "template_name": s.get("template_name"),
    }


def _serialize_schedule(s: dict, items: List[dict] = None) -> dict:
    return {
        "id": s.get("id"),
        "name": s.get("name"),
        "description": s.get("description"),
        "schedule_type": s.get("schedule_type") or "immediate",
        "cron_expression": s.get("cron_expression"),
        "status": s.get("status") or "active",
        "creator": s.get("creator") or "admin",
        "create_time": s.get("create_time"),
        "last_execution_time": s.get("last_execution_time"),
        "total_executions": s.get("total_executions") or 0,
        "failed_executions": s.get("failed_executions") or 0,
        "items": items or [],
    }


def get_schedules(db, skip: int = 0, limit: int = 100) -> List[dict]:
    try:
        db.execute(
            f"SELECT id, name, description, schedule_type, cron_expression, status, creator, "
            f"create_time, last_execution_time, total_executions, failed_executions "
            f"FROM task_schedules ORDER BY id DESC OFFSET {skip} ROWS FETCH NEXT {limit} ROWS ONLY"
        )
        rows = db.fetchall_dicts()
        result = []
        for row in rows:
            r = dict(row)
            sid = r["id"]
            # fetch items
            db.execute(
                f"SELECT i.id, i.schedule_id, i.template_id, i.sort_order, COALESCE(t.name,'') as template_name "
                f"FROM task_schedule_items i LEFT JOIN job_templates t ON i.template_id = t.id "
                f"WHERE i.schedule_id = {sid} ORDER BY i.sort_order ASC"
            )
            items = [_serialize_item(dict(i)) for i in db.fetchall_dicts()]
            result.append(_serialize_schedule(r, items))
        return result
    except Exception as e:
        print(f"Error getting schedules: {e}")
        return []


def get_schedule(db, schedule_id: int) -> Optional[dict]:
    try:
        db.execute(
            f"SELECT id, name, description, schedule_type, cron_expression, status, creator, "
            f"create_time, last_execution_time, total_executions, failed_executions "
            f"FROM task_schedules WHERE id = {schedule_id}"
        )
        row = db.fetchone_dict()
        if not row:
            return None
        r = dict(row)
        sid = r["id"]
        db.execute(
            f"SELECT i.id, i.schedule_id, i.template_id, i.sort_order, COALESCE(t.name,'') as template_name "
            f"FROM task_schedule_items i LEFT JOIN job_templates t ON i.template_id = t.id "
            f"WHERE i.schedule_id = {sid} ORDER BY i.sort_order ASC"
        )
        items = [_serialize_item(dict(i)) for i in db.fetchall_dicts()]
        return _serialize_schedule(r, items)
    except Exception as e:
        print(f"Error getting schedule: {e}")
        return None


def create_schedule(db, schedule: dict) -> dict:
    try:
        new_id = get_next_id("task_schedules")
        name = _escape_sql(schedule.get("name", ""))
        desc = _escape_sql(schedule.get("description"))
        sched_type = _escape_sql(schedule.get("schedule_type", "immediate"))
        cron = schedule.get("cron_expression")
        creator = _escape_sql(schedule.get("creator", "admin"))
        desc_sql = f"'{desc}'" if desc else "NULL"
        cron_sql = f"'{_escape_sql(cron)}'" if cron else "NULL"
        db.execute(
            f"INSERT INTO task_schedules (id, name, description, schedule_type, cron_expression, status, creator, create_time) "
            f"VALUES ({new_id}, '{name}', {desc_sql}, '{sched_type}', {cron_sql}, 'active', '{creator}', SYSDATE)"
        )
        db.commit()
        return get_schedule(db, new_id)
    except Exception as e:
        db.rollback()
        print(f"Error creating schedule: {e}")
        raise


def update_schedule(db, schedule_id: int, schedule: dict) -> Optional[dict]:
    try:
        updates = []
        if "name" in schedule and schedule["name"] is not None:
            updates.append(f"name = '{_escape_sql(schedule['name'])}'")
        if "description" in schedule:
            v = schedule["description"]
            if v is not None:
                updates.append(f"description = '{_escape_sql(v)}'")
            else:
                updates.append("description = NULL")
        if "schedule_type" in schedule and schedule["schedule_type"] is not None:
            updates.append(f"schedule_type = '{_escape_sql(schedule['schedule_type'])}'")
        if "cron_expression" in schedule:
            v = schedule["cron_expression"]
            if v is not None:
                updates.append(f"cron_expression = '{_escape_sql(v)}'")
            else:
                updates.append("cron_expression = NULL")
        if "status" in schedule and schedule["status"] is not None:
            updates.append(f"status = '{_escape_sql(schedule['status'])}'")
        if not updates:
            return get_schedule(db, schedule_id)
        set_clause = ", ".join(updates)
        db.execute(f"UPDATE task_schedules SET {set_clause} WHERE id = {schedule_id}")
        db.commit()
        return get_schedule(db, schedule_id)
    except Exception as e:
        db.rollback()
        print(f"Error updating schedule: {e}")
        raise


def delete_schedule(db, schedule_id: int) -> bool:
    try:
        # items cascade delete via FK (if constraint exists) or manual delete
        db.execute(f"DELETE FROM task_schedule_items WHERE schedule_id = {schedule_id}")
        db.execute(f"DELETE FROM task_schedules WHERE id = {schedule_id}")
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        print(f"Error deleting schedule: {e}")
        return False


def add_schedule_item(db, schedule_id: int, template_id: int) -> dict:
    """给编排添加一个模板项（追加到最后）"""
    try:
        db.execute(f"SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM task_schedule_items WHERE schedule_id = {schedule_id}")
        r = db.fetchone_dict()
        vals = list(r.values())
        next_order = vals[0] if vals else 1
        new_id = get_next_id("task_schedule_items")
        db.execute(
            f"INSERT INTO task_schedule_items (id, schedule_id, template_id, sort_order) "
            f"VALUES ({new_id}, {schedule_id}, {template_id}, {next_order})"
        )
        db.commit()
        return {"id": new_id, "schedule_id": schedule_id, "template_id": template_id, "sort_order": next_order}
    except Exception as e:
        db.rollback()
        print(f"Error adding schedule item: {e}")
        raise


def remove_schedule_item(db, item_id: int) -> bool:
    try:
        db.execute(f"DELETE FROM task_schedule_items WHERE id = {item_id}")
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        print(f"Error removing schedule item: {e}")
        return False


def reorder_schedule_items(db, schedule_id: int, ordered_item_ids: List[int]) -> None:
    """重新排序：传入排好序的 item_id 列表，依次更新 sort_order"""
    try:
        for idx, item_id in enumerate(ordered_item_ids):
            db.execute(f"UPDATE task_schedule_items SET sort_order = {idx + 1} WHERE id = {item_id} AND schedule_id = {schedule_id}")
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error reordering items: {e}")
        raise


def update_schedule_execution_stats(db, schedule_id: int, success: bool) -> None:
    try:
        total_col = "total_executions = total_executions + 1"
        fail_col = f"failed_executions = failed_executions + 1" if not success else "failed_executions = failed_executions"
        db.execute(f"UPDATE task_schedules SET {total_col}, {fail_col}, last_execution_time = SYSDATE WHERE id = {schedule_id}")
        db.commit()
    except Exception as e:
        print(f"Error updating execution stats: {e}")
