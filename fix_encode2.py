import io, sys, re, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Read clean
with open(r'C:\Users\a1478\AppData\Local\Temp\profile_clean.bin', 'rb') as f:
    raw = f.read()
clean = raw[2:].decode('utf-16-le')

# Read corrupted
fp = r'C:\Users\a1478\.openclaw-autoclaw\workspace\promotion-mvp\frontend\src\pages\Profile.tsx'
with open(fp, 'rb') as f:
    raw2 = f.read()
bom_marker = b'\xef\xbb\xbf'
bom = raw2[:3] == bom_marker
if bom:
    raw2 = raw2[3:]
corrupt = raw2.decode('utf-8')

# Extract Chinese segments in order from both
cn_pat = re.compile(r'[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+')
clean_cn = [(m.group(), m.start(), m.end()) for m in cn_pat.finditer(clean)]
corrupt_cn = [(m.group(), m.start(), m.end()) for m in cn_pat.finditer(corrupt)]

print('Clean segments:', len(clean_cn), ', Corrupt segments:', len(corrupt_cn))

# Pair by position order
min_len = min(len(clean_cn), len(corrupt_cn))
pairs = []
for i in range(min_len):
    c_clean = clean_cn[i][0]
    c_corrupt = corrupt_cn[i][0]
    if c_clean != c_corrupt:
        pairs.append((c_corrupt, c_clean))

# Deduplicate and sort longest first
replace_map = {}
for corr, cln in sorted(set(pairs), key=lambda x: -len(x[0])):
    replace_map[corr] = cln

print('Unique replacements:', len(replace_map))
for corr, cln in sorted(replace_map.items(), key=lambda x: -len(x[0]))[:15]:
    print('  [%d->%d] %s -> %s' % (len(corr), len(cln), corr[:45], cln[:45]))

# Apply to fix the file
fixed = corrupt
for corr, cln in replace_map.items():
    fixed = fixed.replace(corr, cln)

# Write back UTF-8 no BOM
with open(fp, 'wb') as f:
    f.write(fixed.encode('utf-8'))

# Verify
with open(fp, 'rb') as f:
    v = f.read()
print()
print('Written:', len(v), 'bytes')
print('Has BOM:', v[:3] == bom_marker)
v_text = v.decode('utf-8')
first = v_text.split('\n')[0]
print('First line:', first[:100])

# Quick check
bad = re.findall(r'[\u4e00-\u9fff]{2,}', v_text)
print('Chinese segments after fix:', len(bad))
