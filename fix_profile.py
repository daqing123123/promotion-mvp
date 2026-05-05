import sys, io, re, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

SRC = r'C:\Users\a1478\.openclaw-autoclaw\workspace\promotion-mvp\frontend\src'

# Build mapping from corrupted to clean Chinese strings
# Sorted by length (longest first) to avoid partial replacements
REPLACEMENTS = sorted([
    # Line 1: comment header
    ('涓汉涓婚〉锛堟敮鎸佹煡鐪嬩粬浜猴級', '个人主页（支持查看他人）'),
    # Line 32
    ('浠栦汉璧勬枡', '他人资料'),
    # Line 55
    ("'鐢ㄦ埛涓嶅瓨鍦?)", "'用户不存在')"),
    # Line 64
    ('妫€鏌ュ叧娉ㄧ姸鎬?', '检查关注状态'),
    # Line 118
    ('璇峰厛鐧诲綍', '请先登录'),
    # Line 128
    ("'宸插彇娑堝叧娉?'", "'已取消关注'"),
    ("'宸插叧娉?'", "'已关注'"),
    # Line 130
    ('鎿嶄綔澶辫触', '操作失败'),
    # Line 141-143
    ('鐧诲綍鍚庢煡鐪嬩釜浜轰富椤?', '登录后查看个人主页'),
    ('鍘荤櫥褰?', '去登录'),
    # Line 149
    ('鍔犺浇涓?', '加载中'),
    # Line 159
    ('澶撮儴', '头部'),
    # Line 161-163
    ('杩斿洖鎸夐挳锛堟煡鐪嬩粬浜烘椂鏄剧ず锛?', '返回按钮（查看他人时显示）'),
    ('杩斿洖', '返回'),
    # Line 173
    ('鉁忥笍', '✏️'),
    # Line 184
    ('鈿欙笍', '⚙️'),
    # Line 193
    ("'宸插叧娉?'", "'已关注'"),
    # Line 198: 关注数据
    ('鍏虫敞鏁版嵁', '关注数据'),
    # Line 202
    ('绮変笣', '粉丝'),
    # Line 206
    ('鍏虫敞', '关注'),
    # Line 210
    ('鍐呭', '内容'),
    # Line 214
    ('绛夌骇杩涘害鏉★紙浠呰嚜宸憋級', '等级进度条（仅自己）'),
    # Line 224
    ('涓嬬骇闇€瑕?', '下级需要'),
    # Line 230-233
    ('鐐硅禐', '点赞'),
    ('鏇濆厜', '曝光'),
    ('垎涓', '分中'),
    ('绉', '积'),
    # Line 237: 快捷入口
    ('蹇嵎鍏ュ彛锛堜粎鑷繁锛?', '快捷入口（仅自己）'),
    ('彛锛堜粎鑷', '口（仅自'),
    # Line 242
    ('绉垎涓績', '积分中心'),
    # Line 246
    ('閭璇峰ソ鍙?', '邀请好友'),
    # Line 250
    ('绛惧埌', '签到'),
    # Line 254
    ('鎴愬氨', '成就'),
    # Line 259
    ('閭璇风爜锛堜粎鑷繁锛?', '邀请码（仅自己）'),
    # Line 267
    ('鏂版墜', '新手'),
    # Line 269
    ('閭璇?', '邀请'),
    # Line 273
    ('閭璇峰ソ鍙?', '邀请好友'),
    # Line 277
    ('閭璇风爜', '邀请码'),
    # Line 279
    ("'宸插鍒?'", "'已复制'"),
    ('澶嶅埗', '复制'),
    # Line 288
    ('鏁版嵁', '数据'),
    ('鎴愬氨', '成就'),
    ('鍐呭', '内容'),
    # Line 293
    ('鍐呭', '内容'),
    # Line 296
    ('鍔犺浇涓?', '加载中'),
    # Line 297
    ('杩樻病鏈夊唴瀹癸紝鍘诲彂甯冧竴涓', '还没有内容，去发布一个'),
    ('杩樻病鏈夊彂甯冨唴瀹', '还没有发布内容'),
    # Line 303
    ('娈靛瓙', '段子'),
    # Line 306
    ('鐖嗘', '爆款'),
    # Line 306
    ('馃敟 鐖嗘', '🔥 爆款'),
    # Line 312-314
    ('鉂わ笍', '❤️'),
    ('馃攧', '💧'),
    ('馃憗', '👗'),
    # Line 323
    ('鍔犺浇涓?', '加载中'),
    # Line 331
    ('宸茶揪鎴?', '已达成'),
    # Line 344
    ('鏁版嵁姒傝', '数据概览'),
    # Line 346-350
    ('鎬诲唴瀹规暟', '总内容数'),
    ('鎬绘洕鍏?', '总曝光'),
    ('鎬荤偣璧?', '总点赞'),
    ('鎬诲垎浜?', '总分享'),
    ('浜?", '人?'),
    ('绱?', '级'),
    ('绱х揣', '紧紧'),
], key=lambda x: -len(x[0]))

def fix_file(filepath):
    with open(filepath, 'rb') as f:
        raw = f.read()
    has_bom = raw[:3] == b'\xef\xbb\xbf'
    if has_bom:
        raw = raw[3:]
    
    text = raw.decode('utf-8')
    original = text
    
    for corrupt, clean in REPLACEMENTS:
        text = text.replace(corrupt, clean)
    
    if text != original:
        # Write as UTF-8 without BOM
        out = text.encode('utf-8')
        with open(filepath, 'wb') as f:
            f.write(out)
        # Count fixes
        changes = sum(1 for c, cl in REPLACEMENTS if c in original)
        print(f'  Fixed: {os.path.basename(filepath)} (had BOM={has_bom}, applied ~{changes} replacements)')
        return True
    else:
        print(f'  No changes: {os.path.basename(filepath)}')
        return False

# Fix Profile.tsx
profile = os.path.join(SRC, 'pages', 'Profile.tsx')
fix_file(profile)
