import os, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

src_root = r'C:\Users\a1478\.openclaw-autoclaw\workspace\promotion-mvp\frontend\src'

# All .tsx files that had BOM (are corrupted)
corrupted = []

for root, dirs, files in os.walk(src_root):
    for f in files:
        if not f.endswith('.tsx'):
            continue
        fp = os.path.join(root, f)
        with open(fp, 'rb') as fh:
            raw = fh.read()
        has_bom = raw[:3] == b'\xef\xbb\xbf'
        if has_bom:
            corrupted.append(fp)

print(f'Found {len(corrupted)} files with BOM:')
for fp in corrupted:
    print(f'  {os.path.relpath(fp, src_root)}')

fixed = 0
for fp in corrupted:
    with open(fp, 'rb') as fh:
        raw = fh.read()
    # Strip BOM
    raw = raw[3:]
    garbled = raw.decode('utf-8')
    
    # Method 1: latin-1 reversal (most common double-encoding)
    try:
        recovered = garbled.encode('latin-1').decode('utf-8')
        # Check if we got actual Chinese back
        chinese_count = sum(1 for c in recovered if '\u4e00' <= c <= '\u9fff')
        garbled_chinese = sum(1 for c in garbled if '\u4e00' <= c <= '\u9fff')
        if chinese_count > garbled_chinese or chinese_count > 0:
            with open(fp, 'wb') as fh:
                fh.write(recovered.encode('utf-8'))
            print(f'  FIXED (latin1): {os.path.basename(fp)} (Chinese chars: {garbled_chinese} -> {chinese_count})')
            fixed += 1
            continue
    except:
        pass
    
    # Method 2: cp1252 reversal
    try:
        recovered = garbled.encode('cp1252').decode('utf-8')
        chinese_count = sum(1 for c in recovered if '\u4e00' <= c <= '\u9fff')
        garbled_chinese = sum(1 for c in garbled if '\u4e00' <= c <= '\u9fff')
        if chinese_count > garbled_chinese or chinese_count > 0:
            with open(fp, 'wb') as fh:
                fh.write(recovered.encode('utf-8'))
            print(f'  FIXED (cp1252): {os.path.basename(fp)} (Chinese chars: {garbled_chinese} -> {chinese_count})')
            fixed += 1
            continue
    except:
        pass
    
    # Method 3: latin-1 bytes -> GBK decode
    try:
        bytes_iso = garbled.encode('latin-1')
        recovered = bytes_iso.decode('gbk')
        chinese_count = sum(1 for c in recovered if '\u4e00' <= c <= '\u9fff')
        if chinese_count > 0:
            with open(fp, 'wb') as fh:
                fh.write(recovered.encode('utf-8'))
            print(f'  FIXED (gbk): {os.path.basename(fp)} (Chinese chars: -> {chinese_count})')
            fixed += 1
            continue
    except:
        pass
    
    print(f'  FAILED: {os.path.basename(fp)} - no method worked. First 100 chars: {garbled[:100]}')

print(f'\nFixed: {fixed}/{len(corrupted)} files')
