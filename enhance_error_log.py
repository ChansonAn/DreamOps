import re

with open(r'I:\APP\dreamops\frontend\src\pages\asset\AssetManagement.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 找 handleSaveItem 函数
idx = content.find('const handleSaveItem = async')
if idx >= 0:
    # 找函数结束
    brace_count = 0
    end = idx
    in_func = False
    for i, c in enumerate(content[idx:], idx):
        if c == '{':
            brace_count += 1
            in_func = True
        elif c == '}':
            brace_count -= 1
            if in_func and brace_count == 0:
                end = i + 1
                break
    
    old_func = content[idx:end]
    
    # 增强错误日志
    new_func = old_func.replace(
        "} catch (error) {",
        '''} catch (error: any) {
      console.error('保存资产失败:', error);
      console.error('错误详情:', error?.response?.data || error?.message);
      const errMsg = error?.response?.data?.detail || error?.message || '未知错误';'''
    )
    
    new_func = new_func.replace(
        "alert('保存资产失败，请重试');",
        "alert(`保存资产失败: ${errMsg}`);"
    )
    
    if old_func != new_func:
        content = content[:idx] + new_func + content[end:]
        with open(r'I:\APP\dreamops\frontend\src\pages\asset\AssetManagement.tsx', 'w', encoding='utf-8') as f:
            f.write(content)
        print("已增强错误日志")
    else:
        print("无需修改")
