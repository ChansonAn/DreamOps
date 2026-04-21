"""
Execution Log CRUD - YashanDB
"""
from typing import List, Optional
from app.db.yasdb_pool import get_db, get_next_id, get_next_task_id


def _serialize_log(s: dict) -> dict:
    return {
        "id": s.get('id'),
        "task_id": s.get('task_id'),
        "job_id": s.get('job_id'),
        "template_id": s.get('template_id'),
        "script_id": s.get('script_id'),
        "execution_type": s.get('execution_type'),
        "name": s.get('name'),
        "status": s.get('status') or "running",
        "output": s.get('output'),
        "error": s.get('error'),
        "creator": s.get('creator'),
        "start_time": s.get('start_time'),
        "end_time": s.get('end_time'),
    }


def _val(v):
    """将值转为SQL字符串，None用NULL表示"""
    if v is None:
        return "NULL"
    return f"'{str(v).replace("'", "''")}'"


def get_execution_logs(db, skip: int = 0, limit: int = 100, execution_type: str = None) -> List[dict]:
    try:
        if execution_type:
            db.execute(
                f"SELECT id, task_id, job_id, template_id, script_id, execution_type, name, status, "
                f"output, error, creator, start_time, end_time "
                f"FROM execution_logs WHERE execution_type = '{execution_type}' "
                f"ORDER BY id DESC OFFSET {skip} ROWS FETCH NEXT {limit} ROWS ONLY"
            )
        else:
            db.execute(
                f"SELECT id, task_id, job_id, template_id, script_id, execution_type, name, status, "
                f"output, error, creator, start_time, end_time "
                f"FROM execution_logs ORDER BY id DESC OFFSET {skip} ROWS FETCH NEXT {limit} ROWS ONLY"
            )
        rows = db.fetchall_dicts()
        return [_serialize_log(dict(row)) for row in rows]
    except Exception as e:
        print(f"Error getting execution logs: {e}")
        return []


def get_execution_log(db, log_id: int) -> Optional[dict]:
    try:
        db.execute(
            f"SELECT id, task_id, job_id, template_id, script_id, execution_type, name, status, "
            f"output, error, creator, start_time, end_time "
            f"FROM execution_logs WHERE id = {log_id}"
        )
        row = db.fetchone_dict()
        if not row:
            return None
        return _serialize_log(dict(row))
    except Exception as e:
        print(f"Error getting execution log: {e}")
        return None


def create_execution_log(db, log: dict, task_id: int = None) -> dict:
    """
    创建执行日志
    task_id: 全局任务ID（从 get_next_task_id() 获取）。
            作业执行时，所有脚本共用同一个 task_id；直接执行脚本时单独一个 task_id。
    """
    try:
        new_id = get_next_id('execution_logs')
        if task_id is None:
            task_id = get_next_task_id()

        # start_time 优先用传入值，否则用数据库时间
        start_time_val = _val(log.get('start_time')) if log.get('start_time') else "SYSDATE"

        db.execute(
            f"INSERT INTO execution_logs "
            f"(id, task_id, job_id, template_id, script_id, execution_type, name, status, output, error, creator, start_time) "
            f"VALUES ({new_id}, {task_id}, {_val(log.get('job_id'))}, {_val(log.get('template_id'))}, {_val(log.get('script_id'))}, "
            f"{_val(log.get('execution_type'))}, {_val(log.get('name'))}, {_val(log.get('status', 'running'))}, "
            f"{_val(log.get('output'))}, {_val(log.get('error'))}, {_val(log.get('creator', 'admin'))}, {start_time_val})"
        )
        db.commit()
        return get_execution_log(db, new_id)
    except Exception as e:
        db.rollback()
        print(f"Error creating execution log: {e}")
        raise


def update_execution_log(db, log_id: int, log: dict) -> Optional[dict]:
    try:
        # 用参数化查询，大 JSON 字符串自动走 CLOB 绑定，不受 SQL 字符串字面量长度限制
        params = {}
        sql_parts = []
        if 'status' in log and log['status'] is not None:
            sql_parts.append("status = :status")
            params['status'] = log['status']
        if 'output' in log and log['output'] is not None:
            sql_parts.append("output = :output")
            params['output'] = log['output']
        if 'error' in log and log['error'] is not None:
            sql_parts.append("error = :error")
            params['error'] = log['error']
        if 'end_time' in log and log['end_time'] is not None:
            sql_parts.append("end_time = :end_time")
            params['end_time'] = log['end_time']
        elif 'status' in log:
            sql_parts.append("end_time = SYSDATE")
        if not sql_parts:
            return get_execution_log(db, log_id)
        sql = f"UPDATE execution_logs SET {', '.join(sql_parts)} WHERE id = :log_id"
        params['log_id'] = log_id
        db.execute(sql, params)
        db.commit()
        return get_execution_log(db, log_id)
    except Exception as e:
        db.rollback()
        print(f"Error updating execution log: {e}")
        raise


def delete_execution_log(db, log_id: int) -> bool:
    try:
        db.execute(f"DELETE FROM execution_logs WHERE id = {log_id}")
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        print(f"Error deleting execution log: {e}")
        return False
