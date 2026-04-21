import sys
sys.path.insert(0, '.')
from app.db.database import SessionLocal
from app.models.script import Script
from app.schemas.script import Script as ScriptSchema
import json
import traceback

db = SessionLocal()
try:
    scripts = db.query(Script).all()
    print(f'Total scripts: {len(scripts)}')
    for s in scripts:
        print(f'--- Script ID={s.id} ---')
        print(f'  tags type={type(s.tags)}')
        print(f'  params type={type(s.parameters)}')
        try:
            if s.tags:
                parsed_tags = json.loads(s.tags)
                print(f'  tags OK: {parsed_tags}')
            if s.parameters:
                parsed_params = json.loads(s.parameters)
                print(f'  params OK: {parsed_params}')
        except Exception as e:
            print(f'  JSON parse error: {e}')
        
        try:
            sc = ScriptSchema.model_validate(s)
            print(f'  Pydantic OK: id={sc.id} name={sc.name}')
        except Exception as e:
            print(f'  Pydantic error: {e}')
            traceback.print_exc()
except Exception as e:
    traceback.print_exc()
finally:
    db.close()
