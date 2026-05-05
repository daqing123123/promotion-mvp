import io, sys, re, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

os.chdir(r'C:\Users\a1478\.openclaw-autoclaw\workspace\promotion-mvp')
os.system('git show c98460a:frontend/src/pages/Profile.tsx > C:\\Users\\a1478\\AppData\\Local\\Temp\\pc4.bin')

with open(r'C:\Users\a1478\AppData\Local\Temp\pc4.bin', 'rb') as f:
    cr = f.read()
if cr[:2] == b'\xff\xfe':
    clean_text = cr[2:].decode('utf-16-le')
elif cr[:3] == b'\xef\xbb\xbf':
    clean_text = cr[3:].decode('utf-8')
else:
    clean_text = cr.decode('utf-8')

fp = r'C:\Users\a1478\.openclaw-autoclaw\workspace\promotion-mvp\frontend\src\pages\Profile.tsx'
with open(fp, 'rb') as f:
    cx = f.read()
if cx[:3] == b'\xef\xbb\xbf':
    cx = cx[3:]
corrupt_text = cx.decode('utf-8')

clean_lines = clean_text.split('\n')
corrupt_lines = corrupt_text.split('\n')

CNP = re.compile(r'[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]')

def make_key(line):
    return re.sub(CNP, '', line).strip()

# Build lookup from clean file
clean_lookup = {}
for l in clean_lines:
    k = make_key(l)
    if not k: continue
    cn = set(re.findall(CNP, l))
    if cn:
        clean_lookup[k] = l

# Fix corrupt lines
fixed_lines = []
fixed_count = 0
for cl in corrupt_lines:
    k = make_key(cl)
    if k in clean_lookup and re.search(CNP, cl):
        clean_match = clean_lookup[k]
        fixed_lines.append(clean_match)
        fixed_count += 1
    else:
        fixed_lines.append(cl)

fixed_text = '\n'.join(fixed_lines)
print('Fixed lines:', fixed_count, 'out of', len(corrupt_lines))

# Write back
with open(fp, 'wb') as f:
    f.write(fixed_text.encode('utf-8'))

# Verify
with open(fp, 'rb') as f:
    v = f.read()
print('Has BOM:', v[:3] == b'\xef\xbb\xbf')
print('First 3 lines:')
for l in v.decode('utf-8').split('\n')[:3]:
    print('  ', l[:120])
