import sys
with open(sys.argv[1], 'rb') as f:
    raw = f.read()
if raw.startswith(b'\xef\xbb\xbf'):
    raw = raw[3:]

# Exact bytes from the file
old = b'if (!item.id) {\r\n          // \xe6\x96\xb0\xe5\xbb\xba\xe9\x85\x8d\xe7\xbd\xae\xe9\xa1\xb9'
new = b'if (!item.id || String(item.id).startsWith("new-")) {\r\n          // \xe6\x96\xb0\xe5\xbb\xba\xe9\x85\x8d\xe7\xbd\xae\xe9\xa1\xb9'

if old in raw:
    raw = raw.replace(old, new, 1)
    with open(sys.argv[1], 'wb') as f:
        f.write(raw)
    print('Fixed!')
else:
    print('Pattern not found')
    pos = raw.find(b'if (!item.id)')
    print(repr(raw[pos:pos+80]))