import os
os.environ['YASDB_HOME'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64'
os.environ['PATH'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64\lib;' + os.environ.get('PATH', '')

try:
    from app.api import job_template_yasdb
    print("job_template_yasdb OK")
except Exception as e:
    print(f"job_template_yasdb ERROR: {e}")

try:
    from app.api import job_yasdb
    print("job_yasdb OK")
except Exception as e:
    print(f"job_yasdb ERROR: {e}")

try:
    from app.api import execution_log_yasdb
    print("execution_log_yasdb OK")
except Exception as e:
    print(f"execution_log_yasdb ERROR: {e}")
