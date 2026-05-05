import io, sys, re, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Step 1: Get clean Chinese from c98460a via git
os.chdir(r'C:\Users\a1478\.openclaw-autoclaw\workspace\promotion-mvp')
os.system('git show c98460a:frontend/src/pages/Profile.tsx > C:\\Users\\a1478\\AppData\\Local\\Temp\\pc.bin')

with open(r'C:\Users\a1478\AppData\Local\Temp\pc.bin', 'rb') as f:
    cr = f.read()
if cr[:2] == b'\xff\xfe':
    clean = cr[2:].decode('utf-16-le')
elif cr[:3] == b'\xef\xbb\xbf':
    clean = cr[3:].decode('utf-8')
else:
    clean = cr.decode('utf-8')

# Step 2: Read corrupted file  
fp = r'C:\Users\a1478\.openclaw-autoclaw\workspace\promotion-mvp\frontend\src\pages\Profile.tsx'
with open(fp, 'rb') as f:
    cx = f.read()
if cx[:3] == b'\xef\xbb\xbf':
    cx = cx[3:]
corrupt = cx.decode('utf-8')

print('Clean length:', len(clean), 'Corrupt length:', len(corrupt))

# Step 3: Extract Chinese segments with surrounding context
CN = re.compile(r'[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]')

def extract_with_context(text):
    segments = []
    for m in re.finditer(r'[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+', text):
        start = m.start()
        end = m.end()
        cn_text = m.group()
        # Get context: 40 chars before and after
        ctx_start = max(0, start - 40)
        ctx_end = min(len(text), end + 40)
        before = text[ctx_start:start]
        after = text[end:ctx_end]
        # Normalize context (strip Chinese)
        before_key = re.sub(CN, '', before).strip()
        after_key = re.sub(CN, '', after).strip()
        segments.append({
            'text': cn_text,
            'start': start,
            'end': end,
            'before': before_key,
            'after': after_key,
            'ctx': before_key[-10:] + '|||' + after_key[:10]
        })
    return segments

clean_segs = extract_with_context(clean)
corrupt_segs = extract_with_context(corrupt)

print('Clean segments:', len(clean_segs), 'Corrupt segments:', len(corrupt_segs))

# Step 4: Match segments by context
replacements = []
used = set()

for cs in corrupt_segs:
    if cs['text'] == '':
        continue
    # First try exact context match
    best = None
    best_score = 0
    for i, cl in enumerate(clean_segs):
        if i in used:
            continue
        if cl['text'] == cs['text']:
            # Already same, skip
            best = None
            break
        # Score by context similarity
        score = 0
        if cl['ctx'] == cs['ctx']:
            score = 100
        elif cl['after'] == cs['after'] and cl['before'] == cs['before']:
            score = 90
        elif cl['after'][:5] == cs['after'][:5]:
            score = 50
        elif cl['before'][-5:] == cs['before'][-5:]:
            score = 40
        
        if score > best_score:
            best_score = score
            best = i
    
    if best is not None and best_score >= 40:
        used.add(best)
        cl = clean_segs[best]
        if cl['text'] != cs['text']:
            replacements.append((cs['text'], cl['text']))
            print('  MATCH[%d]: [%d]%s -> [%d]%s' % (best_score, len(cs['text']), cs['text'][:30], len(cl['text']), cl['text'][:30]))

# Deduplicate and sort
rep_map = {}
for corr, cln in sorted(set(replacements), key=lambda x: -len(x[0])):
    rep_map[corr] = cln

print('\nTotal unique replacements:', len(rep_map))

# Step 5: Apply replacements
fixed = corrupt
for corr, cln in rep_map.items():
    fixed = fixed.replace(corr, cln)

# Write back
with open(fp, 'wb') as f:
    f.write(fixed.encode('utf-8'))

# Verify
with open(fp, 'rb') as f:
    v = f.read()
v_text = v.decode('utf-8')
print('First line:', v_text.split('\n')[0][:100])

# Check remaining garbled
remaining = set()
for m in re.finditer(CN, v_text):
    # Check if this Chinese char appears in the clean file
    remaining.add(m.group())
print('Unique Chinese chars after fix:', len(remaining))
