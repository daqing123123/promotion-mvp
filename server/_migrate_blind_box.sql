-- 盲盒系统建表
-- 在阿里云 RDS julang 库执行

-- 盲盒定义表
CREATE TABLE IF NOT EXISTS blind_boxes (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL COMMENT '盲盒名称',
  type ENUM('points','coupon','badge','effect','boost','fragment','surprise') NOT NULL COMMENT '奖品类型',
  rarity ENUM('common','uncommon','rare','epic','legendary') DEFAULT 'common' COMMENT '稀有度',
  value INT DEFAULT 0 COMMENT '积分值(type=points时)',
  coupon_id VARCHAR(36) DEFAULT NULL COMMENT '关联优惠券ID',
  title VARCHAR(100) DEFAULT NULL COMMENT '奖品展示名',
  description TEXT COMMENT '奖品描述',
  icon VARCHAR(50) DEFAULT '🎁' COMMENT '图标emoji',
  weight INT DEFAULT 100 COMMENT '抽中权重，越大越容易中',
  is_active TINYINT(1) DEFAULT 1 COMMENT '是否启用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='盲盒奖品池';

-- 用户开盒记录
CREATE TABLE IF NOT EXISTS blind_box_records (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL COMMENT '用户ID',
  box_id VARCHAR(36) NOT NULL COMMENT '盲盒ID',
  box_name VARCHAR(100) DEFAULT NULL,
  box_type VARCHAR(20) DEFAULT NULL,
  box_rarity VARCHAR(20) DEFAULT NULL,
  box_icon VARCHAR(50) DEFAULT '🎁',
  box_title VARCHAR(100) DEFAULT NULL,
  points_earned INT DEFAULT 0 COMMENT '获得积分',
  effect_type VARCHAR(50) DEFAULT NULL COMMENT '特效类型(彩色昵称等)',
  effect_expires_at TIMESTAMP NULL COMMENT '特效过期时间',
  fragment_type VARCHAR(50) DEFAULT NULL COMMENT '碎片类型',
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_opened (opened_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='盲盒开启记录';

-- 用户当前生效的特效
CREATE TABLE IF NOT EXISTS user_effects (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  effect_type VARCHAR(50) NOT NULL COMMENT 'color_nickname/glow_avatar/fortune_badge等',
  effect_data JSON COMMENT '特效参数',
  expires_at TIMESTAMP NOT NULL COMMENT '过期时间',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_active (user_id, is_active),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户特效';

-- 碎片收集表
CREATE TABLE IF NOT EXISTS user_fragments (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  fragment_type VARCHAR(50) NOT NULL COMMENT '碎片类型: star/moon/sun/diamond',
  quantity INT DEFAULT 1 COMMENT '持有数量',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_fragment (user_id, fragment_type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户碎片';

-- 插入盲盒奖品数据
INSERT INTO blind_boxes (id, name, type, rarity, value, title, description, icon, weight) VALUES
-- 积分类
(UUID(), '小额积分', 'points', 'common', 50, '50积分', '获得50点积分，不错的小幸运', '🪙', 300),
(UUID(), '中额积分', 'points', 'uncommon', 100, '100积分', '获得100点积分，运气不错！', '💰', 200),
(UUID(), '大额积分', 'points', 'rare', 200, '200积分', '获得200点积分，今天走运了！', '💎', 80),
(UUID(), '巨额积分', 'points', 'epic', 500, '500积分', '获得500积分，欧皇降临！', '👑', 20),

-- 特效类
(UUID(), '彩色昵称', 'effect', 'rare', 0, '🌈彩色昵称(24h)', '你的昵称会变成彩虹色，持续24小时', '🌈', 50),
(UUID(), '金色头像框', 'effect', 'epic', 0, '✨金色头像框(48h)', '头像外圈闪耀金光，持续48小时', '✨', 30),
(UUID(), '锦鲤称号', 'effect', 'legendary', 0, '🐟锦鲤称号(7天)', '昵称旁显示"锦鲤"标签，持续7天', '🐟', 10),

-- 道具类
(UUID(), '曝光加速卡', 'boost', 'uncommon', 0, '🚀曝光加速卡', '使用后让你的一条内容获得额外曝光', '🚀', 60),
(UUID(), '双倍积分卡', 'boost', 'rare', 0, '⚡双倍积分卡(1h)', '接下来1小时内所有积分获取翻倍', '⚡', 40),

-- 碎片类（集齐可换大奖）
(UUID(), '星星碎片', 'fragment', 'common', 0, '⭐星星碎片', '集齐3个星星碎片可合成稀有盲盒', '⭐', 250),
(UUID(), '月亮碎片', 'fragment', 'uncommon', 0, '🌙月亮碎片', '集齐3个月亮碎片可合成稀有盲盒', '🌙', 120),
(UUID(), '太阳碎片', 'fragment', 'rare', 0, '☀️太阳碎片', '集齐3个太阳碎片可合成史诗盲盒', '☀️', 50),
(UUID(), '钻石碎片', 'fragment', 'epic', 0, '💠钻石碎片', '集齐3个钻石碎片可合成传说盲盒', '💠', 15),

-- 趣味类
(UUID(), '踩狗屎', 'surprise', 'common', 0, '💩踩到狗屎', '哎呀！踩到狗屎了……不过俗话说踩狗屎走运，下次一定中大奖！', '💩', 100),
(UUID(), '空盒子', 'surprise', 'common', 0, '📦空盒子', '打开盒子发现是空的……别灰心，再来一次！', '📦', 150),
(UUID(), '再来一次', 'surprise', 'uncommon', 0, '🔄再来一次', '免费再开一次盲盒！', '🔄', 80),
(UUID(), '神秘礼盒', 'surprise', 'legendary', 0, '🎪神秘礼盒', '打开后随机获得一项超稀有奖励', '🎪', 5);
