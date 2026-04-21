with open(r'I:\APP\dreamops\frontend\src\pages\asset\AssetManagement.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the exact location
start_marker = "setRelationships(relationships.filter(rel => rel.source !== item.id));"
end_marker = "} catch (error) {"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx < 0 or end_idx < 0:
    print('Markers not found')
    exit(1)

# Extract and modify
old_section = content[start_idx:end_idx]
print('Old section:')
print(repr(old_section[:200]))

# Build new section with proper indentation
new_section = """setRelationships(relationships.filter(rel => rel.source !== item.id));
          
          // 更新关系
          for (const rel of currentRelationships) {
            const createdRel = await createRelationship({
              source: item.id,
              target: rel.target,
              type: rel.type
            });
            setRelationships(prev => [...prev, createdRel]);
          }
          
          // 更新分页数据
          setPagination(prev => ({
            ...prev,
            total: updatedItems.filter(i => !activeType || i.type === activeType).length,
          }));
        }
    """

content = content[:start_idx] + new_section + content[end_idx:]

with open(r'I:\APP\dreamops\frontend\src\pages\asset\AssetManagement.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed!')
