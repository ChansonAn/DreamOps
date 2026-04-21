with open(r'I:\APP\dreamops\backend\app\crud\cmdb_yasdb.py', 'r', encoding='utf-8') as f:
    content = f.read()

old = 'conditions.append("(name LIKE :kw OR ip LIKE :kw OR hostname LIKE :kw OR business_line LIKE :kw)")'
new = 'conditions.append("(name LIKE :kw OR ip LIKE :kw OR hostname LIKE :kw OR business_line LIKE :kw OR owner LIKE :kw OR tags LIKE :kw)")'

if old in content:
    content = content.replace(old, new)
    with open(r'I:\APP\dreamops\backend\app\crud\cmdb_yasdb.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Backend CRUD fixed!')
else:
    print('Not found')
    idx = content.find('conditions.append')
    print(repr(content[idx:idx+150]))
