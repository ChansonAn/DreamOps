@echo off
cd /d I:\APP\dreamops\backend
set YASDB_HOME=I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64
set PATH=I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64\lib;%PATH%
python -m uvicorn app.main_yasdb:app --host 0.0.0.0 --port 8000
