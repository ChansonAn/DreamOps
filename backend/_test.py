import os
os.environ['YASDB_HOME'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64'
os.environ['PATH'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64\lib;' + os.environ.get('PATH', '')

try:
    from app.main_yasdb import app
    print("main_yasdb OK")
    for route in app.routes:
        if hasattr(route, 'path') and 'job' in route.path:
            print(f"Route: {route.path}")
except Exception as e:
    import traceback
    traceback.print_exc()
