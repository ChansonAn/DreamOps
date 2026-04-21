import re

with open(r'I:\APP\dreamops\frontend\src\pages\asset\AssetManagement.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find SSH fields in the form
ssh_section = re.search(r'sshPort|sshUsername|sshPassword|IP地址|端口', content)
if ssh_section:
    idx = ssh_section.start()
    # Get context around it
    print(content[max(0, idx-100):idx+500])
