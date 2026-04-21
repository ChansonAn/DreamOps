import paramiko
import time
from typing import Optional, Tuple
import io


class ScriptExecutor:
    """脚本执行器，用于在远程主机上执行脚本"""
    
    @staticmethod
    def execute_script_ssh(
        host: str,
        script_content: str,
        script_language: str,
        ssh_port: int = 22,
        ssh_username: Optional[str] = None,
        ssh_password: Optional[str] = None,
        ssh_private_key: Optional[str] = None,
        timeout: int = 300
    ) -> Tuple[bool, str, float]:
        """
        通过SSH在远程主机上执行脚本
        
        Args:
            host: 主机IP地址
            script_content: 脚本内容
            script_language: 脚本语言 (Shell, Python, JavaScript等)
            ssh_port: SSH端口
            ssh_username: SSH用户名
            ssh_password: SSH密码
            ssh_private_key: SSH私钥内容
            timeout: 超时时间（秒）
            
        Returns:
            (success, output, execution_time)
        """
        start_time = time.time()
        client = None
        
        try:
            client = paramiko.SSHClient()
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            
            # 连接SSH
            if ssh_private_key:
                # 使用私钥认证
                private_key = paramiko.RSAKey.from_private_key(io.StringIO(ssh_private_key))
                client.connect(
                    hostname=host,
                    port=ssh_port,
                    username=ssh_username,
                    pkey=private_key,
                    timeout=timeout
                )
            elif ssh_password:
                # 使用密码认证
                client.connect(
                    hostname=host,
                    port=ssh_port,
                    username=ssh_username,
                    password=ssh_password,
                    timeout=timeout
                )
            else:
                return False, "没有提供SSH认证信息（用户名/密码或私钥）", 0
            
            # 根据脚本语言选择执行方式
            if script_language.lower() == 'shell':
                command = ScriptExecutor._prepare_shell_script(script_content)
            elif script_language.lower() == 'python':
                command = ScriptExecutor._prepare_python_script(script_content)
            elif script_language.lower() == 'javascript':
                command = ScriptExecutor._prepare_javascript_script(script_content)
            else:
                # 默认使用Shell执行
                command = ScriptExecutor._prepare_shell_script(script_content)
            
            # 执行命令
            stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
            
            # 获取输出
            output = stdout.read().decode('utf-8', errors='replace')
            error_output = stderr.read().decode('utf-8', errors='replace')
            
            # 合并输出
            full_output = output
            if error_output:
                full_output += "\n=== 错误输出 ===\n" + error_output
            
            # 检查退出码
            exit_code = stdout.channel.recv_exit_status()
            success = exit_code == 0
            
            execution_time = time.time() - start_time
            
            return success, full_output, execution_time
            
        except Exception as e:
            execution_time = time.time() - start_time
            return False, f"SSH执行错误: {str(e)}", execution_time
        finally:
            if client:
                client.close()
    
    @staticmethod
    def _prepare_shell_script(script_content: str) -> str:
        """准备Shell脚本执行命令"""
        escaped_script = script_content.replace("'", "'\\''")
        return f"bash -c '{escaped_script}'"
    
    @staticmethod
    def _prepare_python_script(script_content: str) -> str:
        """准备Python脚本执行命令"""
        escaped_script = script_content.replace("'", "'\\''")
        return f"python3 -c '{escaped_script}'"
    
    @staticmethod
    def _prepare_javascript_script(script_content: str) -> str:
        """准备JavaScript脚本执行命令"""
        escaped_script = script_content.replace("'", "'\\''")
        return f"node -e '{escaped_script}'"
    
    @staticmethod
    def execute_script_local(
        script_content: str,
        script_language: str
    ) -> Tuple[bool, str, float]:
        """
        在本地执行脚本（用于测试）
        
        Args:
            script_content: 脚本内容
            script_language: 脚本语言
            
        Returns:
            (success, output, execution_time)
        """
        import subprocess
        import tempfile
        import os
        
        start_time = time.time()
        
        try:
            if script_language.lower() == 'shell':
                result = subprocess.run(
                    ['bash', '-c', script_content],
                    capture_output=True,
                    text=True,
                    timeout=300
                )
            elif script_language.lower() == 'python':
                result = subprocess.run(
                    ['python', '-c', script_content],
                    capture_output=True,
                    text=True,
                    timeout=300
                )
            else:
                result = subprocess.run(
                    ['bash', '-c', script_content],
                    capture_output=True,
                    text=True,
                    timeout=300
                )
            
            output = result.stdout
            if result.stderr:
                output += "\n=== 错误输出 ===\n" + result.stderr
            
            success = result.returncode == 0
            execution_time = time.time() - start_time
            
            return success, output, execution_time
            
        except Exception as e:
            execution_time = time.time() - start_time
            return False, f"本地执行错误: {str(e)}", execution_time
