"""
Job Execution Engine - 作业执行引擎
处理作业执行、脚本联动、日志记录

核心概念：
- TaskID（全局执行任务ID）：每次"发起执行"生成一个全局唯一的任务ID。
  作业执行时所有脚本共用一个TaskID，直接执行脚本时单独一个TaskID。
- 执行日志：一条 TaskID 对应一条执行日志记录。
"""
from typing import List, Dict, Optional, Tuple
import json
import time
from datetime import datetime

from app.db.yasdb_pool import get_db, get_next_task_id
from app.crud.job_yasdb import get_job, update_job, execute_job as update_job_status
from app.crud.job_template_yasdb import get_job_template
from app.crud.script_yasdb import get_script, update_script_last_used
from app.crud.execution_log_yasdb import create_execution_log, update_execution_log
from app.crud.cmdb_yasdb import get_host_by_ip
from app.utils.script_executor import ScriptExecutor


class JobExecutionEngine:

    @staticmethod
    def execute_job(job_id: int, target_host: Optional[str] = None, executor: str = "admin") -> Dict:
        """
        执行作业：一个作业生成一个全局 TaskID + 一条日志。
        日志 output 中记录每个脚本的开始/结束时间。
        """
        with get_db() as db:
            job = get_job(db, job_id)
            if not job:
                return {"success": False, "error": f"作业 {job_id} 不存在"}

            template = get_job_template(db, job["template_id"])
            if not template:
                return {"success": False, "error": f"模板 {job['template_id']} 不存在"}

            script_ids = template.get("script_ids", [])
            if not script_ids:
                return {"success": False, "error": "模板未关联任何脚本"}

            # 更新作业状态
            update_job_status(db, job_id)

            # 一个全局 TaskID
            task_id = get_next_task_id()
            job_start = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            # 创建一条日志（状态 running）
            log = create_execution_log(db, {
                "job_id": job_id,
                "template_id": job["template_id"],
                "script_id": None,
                "execution_type": "job",
                "name": job["name"],
                "status": "running",
                "output": "",
                "error": "",
                "creator": executor,
                "start_time": job_start,
            }, task_id=task_id)
            log_id = log["id"]

            # 逐个执行脚本，收集结果（每条记录自己的起止时间）
            results = []
            combined_output = []
            overall_success = True

            for i, script_id in enumerate(script_ids):
                script_start = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

                script_result = JobExecutionEngine._execute_script_in_job(
                    db=db,
                    script_id=script_id,
                    job_id=job_id,
                    template_id=job["template_id"],
                    script_index=i + 1,
                    script_total=len(script_ids),
                    target_host=target_host,
                    executor=executor,
                )

                script_end = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                exec_time = script_result.get("execution_time", 0)

                if not script_result.get("success"):
                    overall_success = False

                # 在 output 中记录每个脚本的开始/结束时间和耗时
                combined_output.append(
                    f"[{i+1}/{len(script_ids)}] {script_result.get('name', f'Script {script_id}')}\n"
                    f"  Started:  {script_start}\n"
                    f"  Finished: {script_end}\n"
                    f"  Duration: {exec_time:.2f}s\n"
                )

                if script_result.get("success"):
                    combined_output.append(f"  Status: SUCCESS")
                    if script_result.get("output"):
                        combined_output.append(f"  Output: {script_result['output']}")
                else:
                    combined_output.append(f"  Status: FAILED")
                    combined_output.append(f"  Error: {script_result.get('error', 'Unknown error')}")

                combined_output.append("")

                results.append({
                    **script_result,
                    "script_start": script_start,
                    "script_end": script_end,
                    "exec_time": exec_time,
                })

            # 汇总整体起止时间
            job_end = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            final_status = "success" if overall_success else "failed"
            update_execution_log(db, log_id, {
                "status": final_status,
                "output": "\n".join(combined_output)[:8000],
                "error": "",
                "end_time": job_end,
            })

            # 更新作业最终状态
            db.execute(f"UPDATE jobs SET status = '{final_status}' WHERE id = {job_id}")
            db.commit()

            return {
                "success": overall_success,
                "task_id": task_id,
                "log_id": log_id,
                "job_id": job_id,
                "job_name": job["name"],
                "template_name": template["name"],
                "scripts_executed": len(script_ids),
                "job_start": job_start,
                "job_end": job_end,
                "results": results,
            }

    @staticmethod
    def _execute_script_in_job(
        db, script_id: int, job_id: int, template_id: int,
        script_index: int, script_total: int,
        target_host: Optional[str], executor: str
    ) -> Dict:
        """作业内执行单个脚本（不写日志，结果汇总到父级日志）"""
        script = get_script(db, script_id)
        if not script:
            return {"script_id": script_id, "name": f"未知脚本 (ID: {script_id})", "success": False, "error": f"脚本 {script_id} 不存在"}

        script_name = script.get("name", f"脚本_{script_id}")
        script_content = script.get("content", "")
        script_language = script.get("language", "Shell")

        update_script_last_used(db, script_id)

        try:
            if target_host:
                # 获取主机信息，然后立即释放数据库连接
                from app.crud.configuration_yasdb import get_host_by_ip
                host_info = get_host_by_ip(db, ip=target_host)
                if not host_info:
                    return {
                        "script_id": script_id,
                        "name": script_name,
                        "success": False,
                        "error": f"无法找到IP为 {target_host} 的主机信息",
                    }
                
                ssh_port = host_info.get("ssh_port") or 22
                ssh_username = host_info.get("ssh_username")
                ssh_password = host_info.get("ssh_password")
                ssh_private_key = host_info.get("ssh_private_key")
                
                if not ssh_username:
                    return {
                        "script_id": script_id,
                        "name": script_name,
                        "success": False,
                        "error": "主机没有配置SSH用户名",
                    }
                
                success, output, exec_time = ScriptExecutor.execute_script_ssh(
                    host=target_host,
                    script_content=script_content,
                    script_language=script_language,
                    ssh_port=ssh_port,
                    ssh_username=ssh_username,
                    ssh_password=ssh_password,
                    ssh_private_key=ssh_private_key
                )
            else:
                success, output, exec_time = ScriptExecutor.execute_script_local(
                    script_content, script_language
                )
            return {
                "script_id": script_id,
                "name": script_name,
                "success": success,
                "output": output or "",
                "error": "" if success else (output or "Unknown error"),
                "execution_time": exec_time,
            }
        except Exception as e:
            return {
                "script_id": script_id,
                "name": script_name,
                "success": False,
                "error": str(e),
            }

    @staticmethod
    def _execute_remote(db, host_ip: str, script_content: str, script_language: str) -> Tuple[bool, str, float]:
        """在远程主机执行脚本（已弃用，使用_do_execute_script中的新逻辑）"""
        # 这个方法已不再使用，保留只是为了兼容性
        from app.crud.configuration_yasdb import get_host_by_ip
        host_item = get_host_by_ip(db, ip=host_ip)
        if not host_item:
            return False, f"无法找到IP为 {host_ip} 的主机信息", 0

        ssh_port = host_item.get("ssh_port") or 22
        ssh_username = host_item.get("ssh_username")
        ssh_password = host_item.get("ssh_password")
        ssh_private_key = host_item.get("ssh_private_key")

        if not ssh_username:
            return False, "主机没有配置SSH用户名", 0

        return ScriptExecutor.execute_script_ssh(
            host=host_ip,
            script_content=script_content,
            script_language=script_language,
            ssh_port=ssh_port,
            ssh_username=ssh_username,
            ssh_password=ssh_password,
            ssh_private_key=ssh_private_key
        )

    @staticmethod
    def _do_execute_script(
        db,
        script_id: int,
        script_name: str,
        script_content: str,
        script_language: str,
        target_host: Optional[str],
    ) -> Dict:
        """
        执行单个脚本的底层逻辑（不写日志，由调用方决定）。
        返回结构化结果。
        """
        start_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        try:
            # 在执行脚本之前获取所有需要的数据库数据
            host_info = None
            if target_host:
                # 获取主机信息，然后立即释放数据库连接
                from app.crud.configuration_yasdb import get_host_by_ip
                host_info = get_host_by_ip(db, ip=target_host)
                if not host_info:
                    return {
                        "script_id": script_id,
                        "script_name": script_name,
                        "start_time": start_time,
                        "end_time": start_time,
                        "duration_seconds": 0,
                        "success": False,
                        "output": "",
                        "error": f"无法找到IP为 {target_host} 的主机信息",
                    }
            
            # 现在执行脚本（不持有数据库连接）
            if target_host and host_info:
                ssh_port = host_info.get("ssh_port") or 22
                ssh_username = host_info.get("ssh_username")
                ssh_password = host_info.get("ssh_password")
                ssh_private_key = host_info.get("ssh_private_key")
                
                if not ssh_username:
                    return {
                        "script_id": script_id,
                        "script_name": script_name,
                        "start_time": start_time,
                        "end_time": start_time,
                        "duration_seconds": 0,
                        "success": False,
                        "output": "",
                        "error": "主机没有配置SSH用户名",
                    }
                
                success, output, exec_time = ScriptExecutor.execute_script_ssh(
                    host=target_host,
                    script_content=script_content,
                    script_language=script_language,
                    ssh_port=ssh_port,
                    ssh_username=ssh_username,
                    ssh_password=ssh_password,
                    ssh_private_key=ssh_private_key
                )
            else:
                success, output, exec_time = ScriptExecutor.execute_script_local(
                    script_content, script_language
                )
            end_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            return {
                "script_id": script_id,
                "script_name": script_name,
                "start_time": start_time,
                "end_time": end_time,
                "duration_seconds": round(exec_time, 2),
                "success": success,
                "output": output or "",
                "error": "" if success else (output or "Unknown error"),
            }
        except Exception as e:
            end_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            return {
                "script_id": script_id,
                "script_name": script_name,
                "start_time": start_time,
                "end_time": end_time,
                "duration_seconds": 0,
                "success": False,
                "output": "",
                "error": str(e),
            }

    @staticmethod
    def execute_script_no_log(
        db,
        script_id: int,
        target_host: Optional[str],
    ) -> Dict:
        """执行脚本（不写日志，不管理连接）。返回结构化结果。"""
        script = get_script(db, script_id)
        if not script:
            return {
                "script_id": script_id,
                "script_name": f"未知脚本 (ID:{script_id})",
                "start_time": "", "end_time": "", "duration_seconds": 0,
                "success": False, "output": "", "error": f"脚本 {script_id} 不存在"
            }
        update_script_last_used(db, script_id)
        return JobExecutionEngine._do_execute_script(
            db, script_id,
            script.get("name", f"脚本_{script_id}"),
            script.get("content", ""),
            script.get("language", "Shell"),
            target_host,
        )

    @staticmethod
    def execute_script_direct(
        script_id: int,
        target_host: Optional[str] = None,
        parameters: Optional[Dict] = None,
        executor: str = "admin"
    ) -> Dict:
        """
        直接执行脚本（不通过作业模板），生成独立的全局 TaskID。
        """
        with get_db() as db:
            script = get_script(db, script_id)
            if not script:
                return {"success": False, "error": f"脚本 {script_id} 不存在"}

            script_name = script.get("name", f"脚本_{script_id}")
            script_content = script.get("content", "")
            script_language = script.get("language", "Shell")

            if parameters and script_language.lower() == "shell":
                script_content = JobExecutionEngine._inject_parameters(
                    script_content, parameters, script.get("parameters", [])
                )

            task_id = get_next_task_id()
            start_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            log = create_execution_log(db, {
                "job_id": None,
                "template_id": None,
                "script_id": script_id,
                "execution_type": "script",
                "name": script_name,
                "status": "running",
                "output": "",
                "error": "",
                "creator": executor,
                "start_time": start_time,
            }, task_id=task_id)
            log_id = log["id"]

            update_script_last_used(db, script_id)

            result = JobExecutionEngine._do_execute_script(
                db, script_id, script_name, script_content, script_language, target_host
            )

            update_execution_log(db, log_id, {
                "status": "success" if result["success"] else "failed",
                "output": result["output"],
                "error": result["error"],
                "end_time": result["end_time"],
            })

            return {
                "success": result["success"],
                "task_id": task_id,
                "log_id": log_id,
                "script_id": script_id,
                "script_name": script_name,
                "output": result["output"],
                "execution_time": result["duration_seconds"],
            }

    @staticmethod
    def _inject_parameters(
        script_content: str,
        parameters: Dict,
        param_definitions: List[Dict]
    ) -> str:
        """注入参数到脚本"""
        param_lines = []
        for param_def in param_definitions:
            param_name = param_def.get("name", "")
            param_default = param_def.get("default", "")
            user_value = parameters.get(param_name)
            value = user_value if user_value is not None else param_default
            if isinstance(value, bool):
                value_str = "true" if value else "false"
            elif value is None:
                value_str = ""
            else:
                value_str = str(value)
            param_lines.append(f'{param_name}="{value_str}"')
        if param_lines:
            return "\n".join(param_lines) + "\n" + script_content
        return script_content


# 便捷函数
def run_job(job_id: int, target_host: Optional[str] = None, executor: str = "admin") -> Dict:
    return JobExecutionEngine.execute_job(job_id, target_host, executor)


def run_script(script_id: int, target_host: Optional[str] = None,
               parameters: Optional[Dict] = None, executor: str = "admin") -> Dict:
    return JobExecutionEngine.execute_script_direct(script_id, target_host, parameters, executor)
