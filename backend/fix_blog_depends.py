"""
批量修复 blog yasdb 文件：Depends(get_db) -> with get_db() as db:
"""
import re, os

files = [
    r"I:\APP\dreamops\backend\app\modules\blog\api\tags_yasdb.py",
    r"I:\APP\dreamops\backend\app\modules\blog\api\categories_yasdb.py",
    r"I:\APP\dreamops\backend\app\modules\blog\api\comments_yasdb.py",
    r"I:\APP\dreamops\backend\app\modules\blog\api\likes_yasdb.py",
    r"I:\APP\dreamops\backend\app\modules\blog\api\favorites_yasdb.py",
]

for path in files:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 找所有使用 Depends(get_db) 的函数，改为 with get_db() as db:
    # 策略：找到函数定义，把 db = Depends(get_db) 去掉，
    #       函数体内第一行插入 "with get_db() as db:"，
    #       并处理缩进
    
    # 更简单的方法：把 "db = Depends(get_db)\n" 替换为空，
    # 再在函数开始处（def 行之后的第一行非空缩进行前）插入 "    with get_db() as db:\n"
    
    new_content = content
    
    # 替换 "db = Depends(get_db),\n" 或 "db = Depends(get_db)\n"
    new_content = re.sub(r'    db = Depends\(get_db\),\n', '', new_content)
    new_content = re.sub(r'    db = Depends\(get_db\)\n', '\n', new_content)
    
    # 在函数体开始处注入 with get_db() as db:
    # 找到每个 def 行，其后第一个有缩进的行之前插入
    def inject_with_db(content):
        lines = content.split('\n')
        result = []
        i = 0
        while i < len(lines):
            line = lines[i]
            if line.startswith('def ') and 'db = Depends(get_db)' not in line:
                # 这是已经修改过的函数（不需要 auth），看看后面
                result.append(line)
                i += 1
                continue
            
            if line.startswith('def '):
                result.append(line)
                i += 1
                # 找函数体的第一行（有缩进的行）
                while i < len(lines) and not lines[i].strip():
                    result.append(lines[i])
                    i += 1
                # 在这里插入 with get_db() as db:
                result.append('    with get_db() as db:')
                continue
            else:
                result.append(line)
                i += 1
        return '\n'.join(result)
    
    new_content = inject_with_db(new_content)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f'Fixed: {os.path.basename(path)}')
