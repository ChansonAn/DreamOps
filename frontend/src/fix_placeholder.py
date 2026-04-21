import sys

def fix_file(filepath, old_bytes, new_bytes):
    with open(filepath, 'rb') as f:
        raw = f.read()
    if old_bytes in raw:
        raw = raw.replace(old_bytes, new_bytes, 1)
        with open(filepath, 'wb') as f:
            f.write(raw)
        print(f'Fixed {filepath}')
    else:
        print(f'Not found in {filepath}')
        pos = raw.find(b'placeholder=')
        if pos >= 0:
            print('Actual:', list(raw[pos:pos+60]))

new_p = b'\xe5\x90\x8d\xe7\xa7\xb0/\xe4\xb8\x9a\xe5\x8a\xa1\xe7\xba\xbf/\xe8\xb4\x9f\xe8\xb4\xa3\xe4\xba\xba/\xe6\xa0\x87\xe7\xad\xbe'

fix_file(r'I:\APP\dreamops\frontend\src\pages\automation\TaskSchedules.tsx', b'\xe5\x90\x8d\xe7\xa7\xb0/IP/\xe4\xb8\xbb\xe6\x9c\xba\xe5\x90\x8d', new_p)

# ScriptLibrary has different text order
fix_file(r'I:\APP\dreamops\frontend\src\pages\automation\ScriptLibrary.tsx', b'\xe4\xb8\xbb\xe6\x9c\xba\xe5\x90\x8d/IP/\xe5\x90\x8d\xe7\xa7\xb0', new_p)
