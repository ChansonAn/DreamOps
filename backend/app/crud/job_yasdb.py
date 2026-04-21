"""
Job CRUD - YashanDB
"""
from typing import List, Optional
import json
from app.db.yasdb_pool import get_db, get_next_id


def _serialize_job(s: dict) -> dict:
    return {
        "id": s.get('id'),
        "name": s.get('name'),
        "template_id": s.get('template_id'),
        "template_name": s.get('template_name'),
        "job_type": s.get('job_type') or "immediate",
        "cron_expression": s.get('cron_expression'),
        "status": s.get('status') or "pending",
        "creator": s.get('creator'),
        "create_time": s.get('create_time'),
        "last_execution": s.get('last_execution'),
        "next_execution": s.get('next_execution'),
    }


def get_jobs(db, skip: int = 0, limit: int = 100) -> List[dict]:
    try:
        db.execute(
            f"SELECT j.id, j.name, j.template_id, COALESCE(t.name,'') as template_name, j.job_type, "
            f"j.cron_expression, j.status, j.creator, j.create_time, "
            f"j.last_execution, j.next_execution "
            f"FROM jobs j LEFT JOIN job_templates t ON j.template_id = t.id "
            f"ORDER BY j.id DESC OFFSET {skip} ROWS FETCH NEXT {limit} ROWS ONLY"
        )
        rows = db.fetchall_dicts()
        return [_serialize_job(dict(row)) for row in rows]
    except Exception as e:
        print(f"Error getting jobs: {e}")
        return []


def get_job(db, job_id: int) -> Optional[dict]:
    try:
        db.execute(
            f"SELECT j.id, j.name, j.template_id, COALESCE(t.name,'') as template_name, j.job_type, "
            f"j.cron_expression, j.status, j.creator, j.create_time, "
            f"j.last_execution, j.next_execution "
            f"FROM jobs j LEFT JOIN job_templates t ON j.template_id = t.id "
            f"WHERE j.id = {job_id}"
        )
        row = db.fetchone_dict()
        if not row:
            return None
        return _serialize_job(dict(row))
    except Exception as e:
        print(f"Error getting job: {e}")
        return None


def _escape_sql(value: str) -> str:
    """转义 SQL 字符串值"""
    if value is None:
        return None
    return value.replace("'", "''")


def create_job(db, job: dict) -> dict:
    try:
        new_id = get_next_id('jobs')
        cron = job.get('cron_expression')
        if job.get('job_type') == 'scheduled' and not cron:
            cron = '0 0 * * *'
        
        # 处理 NULL 值，转义字符串
        name = _escape_sql(job.get('name', ''))
        job_type = _escape_sql(job.get('job_type', 'immediate'))
        status = _escape_sql(job.get('status', 'pending'))
        creator = _escape_sql(job.get('creator', 'admin'))
        cron_sql = f"'{cron}'" if cron else "NULL"
        
        db.execute(
            f"INSERT INTO jobs (id, name, template_id, job_type, cron_expression, status, creator, create_time) "
            f"VALUES ({new_id}, '{name}', {job.get('template_id')}, '{job_type}', "
            f"{cron_sql}, '{status}', '{creator}', SYSDATE)"
        )
        db.commit()
        return get_job(db, new_id)
    except Exception as e:
        db.rollback()
        print(f"Error creating job: {e}")
        raise


def update_job(db, job_id: int, job: dict) -> Optional[dict]:
    try:
        updates = []
        if 'name' in job and job['name'] is not None:
            updates.append(f"name = '{_escape_sql(job['name'])}'")
        if 'template_id' in job and job['template_id'] is not None:
            updates.append(f"template_id = {job['template_id']}")
        if 'job_type' in job and job['job_type'] is not None:
            updates.append(f"job_type = '{_escape_sql(job['job_type'])}'")
        if 'cron_expression' in job:
            if job['cron_expression'] is not None:
                updates.append(f"cron_expression = '{_escape_sql(job['cron_expression'])}'")
            else:
                updates.append("cron_expression = NULL")
        if 'status' in job and job['status'] is not None:
            updates.append(f"status = '{_escape_sql(job['status'])}'")
        if not updates:
            return get_job(db, job_id)
        set_clause = ', '.join(updates)
        db.execute(f"UPDATE jobs SET {set_clause} WHERE id = {job_id}")
        db.commit()
        return get_job(db, job_id)
    except Exception as e:
        db.rollback()
        print(f"Error updating job: {e}")
        raise


def delete_job(db, job_id: int) -> bool:
    try:
        db.execute(f"DELETE FROM jobs WHERE id = {job_id}")
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        print(f"Error deleting job: {e}")
        return False


def execute_job(db, job_id: int) -> dict:
    try:
        db.execute(f"UPDATE jobs SET status = 'running', last_execution = SYSDATE WHERE id = {job_id}")
        db.commit()
        return get_job(db, job_id)
    except Exception as e:
        db.rollback()
        print(f"Error executing job: {e}")
        raise
