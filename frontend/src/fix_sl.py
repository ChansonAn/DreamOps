with open(r'I:\APP\dreamops\frontend\src\pages\automation\ScriptLibrary.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: setHostFilters in handleRunScript (around line 294)
content = content.replace(
    """setHostFilters({
      environment: '',
      businessLine: '',
      keyword: '',
    });
  };
  
  // 重置主机过滤""",
    """setHostFilters({
      type: '',
      environment: '',
      businessLine: '',
      keyword: '',
    });
  };
  
  // 重置主机过滤"""
)

# Fix 2: setHostFilters in resetHostFilters (around line 381)
content = content.replace(
    """const resetHostFilters = () => {
    setHostFilters({
      environment: '',
      businessLine: '',
      keyword: '',
    });""",
    """const resetHostFilters = () => {
    setHostFilters({
      type: '',
      environment: '',
      businessLine: '',
      keyword: '',
    });"""
)

with open(r'I:\APP\dreamops\frontend\src\pages\automation\ScriptLibrary.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed ScriptLibrary.tsx')
