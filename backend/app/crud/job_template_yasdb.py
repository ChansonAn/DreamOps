"""
Job Template CRUD - YashanDB
"""
from typing import List, Optional
import json
from app.db.yasdb_pool import get_db, get_next_id


def _serialize_template(s: dict) -> dict:
    script_ids = []
    if s.get('script_ids'):
        try:
            script_ids = json.loads(s['script_ids']) if isinstance(s['script_ids'], str) else s['script_ids']
        except (json.JSONDecodeError, TypeError):
            script_ids = []
    return {
        "id": s.get('id'),
        "name": s.get('name'),
        "description": s.get('description'),
        "script_ids": script_ids,
        "cron_expression": s.get('cron_expression'),
        "status": s.get('status') or "enabled",
        "creator": s.get('creator'),
        "create_time": s.get('create_time'),
    }


def get_job_templates(db, skip: int = 0, limit: int = 100) -> List[dict]:
    try:
        db.execute(
            f"SELECT id, name, description, script_ids, cron_expression, status, creator, create_time "
            f"FROM job_templates ORDER BY id DESC OFFSET {skip} ROWS FETCH NEXT {limit} ROWS ONLY"
        )
        rows = db.fetchall_dicts()
        return [_serialize_template(dict(row)) for row in rows]
    except Exception as e:
        print(f"Error getting job templates: {e}")
        return []


def get_job_template(db, template_id: int) -> Optional[dict]:
    try:
        db.execute(
            f"SELECT id, name, description, script_ids, cron_expression, status, creator, create_time "
            f"FROM job_templates WHERE id = {template_id}"
        )
        row = db.fetchone_dict()
        if not row:
            return None
        return _serialize_template(dict(row))
    except Exception as e:
        print(f"Error getting job template: {e}")
        return None


def _escape_sql(value: str) -> str:
    """转义 SQL 字符串值"""
    if value is None:
        return None
    # 转义单引号
    return value.replace("'", "''")


def create_job_template(db, template: dict) -> dict:
    try:
        new_id = get_next_id('job_templates')
        script_ids_json = json.dumps(template.get('script_ids', []))
        cron_expr = template.get('cron_expression')
        
        # 处理 NULL 值，转义字符串
        name = _escape_sql(template.get('name', ''))
        desc = _escape_sql(template.get('description'))
        status = _escape_sql(template.get('status', 'enabled'))
        creator = _escape_sql(template.get('creator', 'admin'))
        
        cron_sql = f"'{cron_expr}'" if cron_expr else "NULL"
        desc_sql = f"'{desc}'" if desc else "NULL"
        
        db.execute(
            f"INSERT INTO job_templates (id, name, description, script_ids, cron_expression, status, creator, create_time) "
            f"VALUES ({new_id}, '{name}', {desc_sql}, '{script_ids_json}', {cron_sql}, "
            f"'{status}', '{creator}', SYSDATE)"
        )
        db.commit()
        return get_job_template(db, new_id)
    except Exception as e:
        db.rollback()
        print(f"Error creating job template: {e}")
        raise


def update_job_template(db, template_id: int, template: dict) -> Optional[dict]:
    try:
        updates = []
        if 'name' in template and template['name'] is not None:
            updates.append(f"name = '{_escape_sql(template['name'])}'")
        if 'description' in template and template['description'] is not None:
            updates.append(f"description = '{_escape_sql(template['description'])}'")
        if 'script_ids' in template and template['script_ids'] is not None:
            updates.append(f"script_ids = '{json.dumps(template['script_ids'])}'")
        if 'cron_expression' in template:
            if template['cron_expression'] is not None:
                updates.append(f"cron_expression = '{_escape_sql(template['cron_expression'])}'")
            else:
                updates.append("cron_expression = NULL")
        if 'status' in template and template['status'] is not None:
            updates.append(f"status = '{_escape_sql(template['status'])}'")
        if not updates:
            return get_job_template(db, template_id)
        set_clause = ', '.join(updates)
        db.execute(f"UPDATE job_templates SET {set_clause} WHERE id = {template_id}")
        db.commit()
        return get_job_template(db, template_id)
    except Exception as e:
        db.rollback()
        print(f"Error updating job template: {e}")
        raise


def delete_job_template(db, template_id: int) -> bool:
    try:
        db.execute(f"DELETE FROM job_templates WHERE id = {template_id}")
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        print(f"Error deleting job template: {e}")
        return False
