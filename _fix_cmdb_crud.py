# -*- coding: utf-8 -*-
with open(r'I:\APP\dreamops\backend\app\crud\cmdb_yasdb.py', 'rb') as f:
    raw = f.read()
if raw.startswith(b'\xef\xbb\xbf'):
    raw = raw[3:]
content = raw.decode('utf-8')

old_params = """    params = {
        'id': item_in.id,"""

new_params = """    # Auto-generate id if None
    import time
    item_id = item_in.id
    if not item_id:
        item_id = f"new-{int(time.time() * 1000)}"
    
    params = {
        'id': item_id,"""

assert old_params in content, 'params block not found'
content = content.replace(old_params, new_params, 1)

# Also fix: return get_config_item(db, item_in.id) -> use item_id
old_return = "    return get_config_item(db, item_in.id)"
new_return = "    return get_config_item(db, item_id)"
assert old_return in content, 'return statement not found'
content = content.replace(old_return, new_return, 1)

with open(r'I:\APP\dreamops\backend\app\crud\cmdb_yasdb.py', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print('crud fixed: auto-generate id when None')
