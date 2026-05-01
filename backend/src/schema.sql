-- ===== 巨浪 全品类内容平台数据库 Schema =====

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  username        VARCHAR(50) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  name            VARCHAR(100) NOT NULL,
  avatar          VARCHAR(500) DEFAULT '👤',
  bio             TEXT,
  tags            JSON,
  
  -- 积分和等级
  points          INT DEFAULT 0,
  level           INT DEFAULT 1,
  experience      INT DEFAULT 0,
  
  -- 统计
  follower_count  INT DEFAULT 0,
  following_count INT DEFAULT 0,
  published_count INT DEFAULT 0,
  total_likes     INT DEFAULT 0,
  total_promotes  INT DEFAULT 0,
  
  -- 时间
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_username (username),
  INDEX idx_level (level DESC)
);

-- 内容表（通用）
CREATE TABLE IF NOT EXISTS contents (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  type            VARCHAR(20) NOT NULL,
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  cover_url       VARCHAR(500),
  tags            JSON,
  
  -- 创作者
  creator_id      BIGINT NOT NULL,
  
  -- 渲染配置
  render_mode     VARCHAR(20) NOT NULL,
  render_src      VARCHAR(500),
  render_config   JSON,
  
  -- 交互配置
  interaction     JSON,
  
  -- 统计
  view_count      INT DEFAULT 0,
  like_count      INT DEFAULT 0,
  promote_count   INT DEFAULT 0,
  share_count     INT DEFAULT 0,
  comment_count   INT DEFAULT 0,
  favorite_count  INT DEFAULT 0,
  completion_count INT DEFAULT 0,
  
  -- 类型特有统计
  install_count   INT DEFAULT 0,
  trial_count     INT DEFAULT 0,
  purchase_count  INT DEFAULT 0,
  play_count      INT DEFAULT 0,
  watch_time      BIGINT DEFAULT 0,
  
  -- 推广
  is_promoted     BOOLEAN DEFAULT FALSE,
  promo_config    JSON,
  
  -- 盲盒
  is_blind_box    BOOLEAN DEFAULT FALSE,
  rarity          VARCHAR(20) DEFAULT 'common',
  
  -- 状态
  status          VARCHAR(20) DEFAULT 'published',
  visibility      VARCHAR(20) DEFAULT 'public',
  
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (creator_id) REFERENCES users(id),
  INDEX idx_type (type),
  INDEX idx_creator (creator_id),
  INDEX idx_status_created (status, created_at DESC),
  INDEX idx_type_status (type, status),
  INDEX idx_promoted (is_promoted, promote_count DESC)
);

-- 游戏内容表
CREATE TABLE IF NOT EXISTS content_games (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  content_id      BIGINT NOT NULL UNIQUE,
  game_url        VARCHAR(500) NOT NULL,
  game_type       VARCHAR(50),
  control_type    VARCHAR(50),
  difficulty      VARCHAR(20),
  avg_play_time   INT,
  max_score       INT,
  
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
);

-- 软件内容表
CREATE TABLE IF NOT EXISTS content_software (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  content_id      BIGINT NOT NULL UNIQUE,
  demo_url        VARCHAR(500),
  install_url     VARCHAR(500),
  website_url     VARCHAR(500),
  platforms       JSON,
  version         VARCHAR(50),
  price           DECIMAL(10,2),
  trial_duration  INT,
  trial_features  JSON,
  category        VARCHAR(50),
  
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
);

-- Skill 内容表
CREATE TABLE IF NOT EXISTS content_skills (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  content_id      BIGINT NOT NULL UNIQUE,
  skill_id        VARCHAR(100) NOT NULL,
  skill_version   VARCHAR(20),
  install_url     VARCHAR(500),
  registry        VARCHAR(100),
  capabilities    JSON,
  permissions     JSON,
  demo_config     JSON,
  
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
);

-- 电影/剧集内容表
CREATE TABLE IF NOT EXISTS content_media (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  content_id      BIGINT NOT NULL UNIQUE,
  media_type      VARCHAR(20) NOT NULL,
  trailer_url     VARCHAR(500),
  watch_url       VARCHAR(500),
  duration        INT,
  episodes        INT,
  year            INT,
  genre           JSON,
  cast_info       JSON,
  rating          DECIMAL(3,1),
  platform        VARCHAR(100),
  
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
);

-- 产品内容表
CREATE TABLE IF NOT EXISTS content_products (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  content_id      BIGINT NOT NULL UNIQUE,
  price           DECIMAL(10,2),
  currency        VARCHAR(10) DEFAULT 'CNY',
  purchase_url    VARCHAR(500),
  brand           VARCHAR(100),
  category        VARCHAR(50),
  specs           JSON,
  images          JSON,
  
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
);

-- 文章内容表
CREATE TABLE IF NOT EXISTS content_articles (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  content_id      BIGINT NOT NULL UNIQUE,
  body            LONGTEXT NOT NULL,
  word_count      INT,
  read_time       INT,
  format          VARCHAR(20) DEFAULT 'markdown',
  
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
);

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  content_id      BIGINT NOT NULL,
  user_id         BIGINT NOT NULL,
  parent_id       BIGINT,
  body            TEXT NOT NULL,
  like_count      INT DEFAULT 0,
  
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_content (content_id, created_at DESC)
);

-- 点赞表
CREATE TABLE IF NOT EXISTS likes (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  content_id      BIGINT NOT NULL,
  user_id         BIGINT NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY uk_like (content_id, user_id),
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 收藏表
CREATE TABLE IF NOT EXISTS favorites (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  content_id      BIGINT NOT NULL,
  user_id         BIGINT NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY uk_favorite (content_id, user_id),
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 关注表
CREATE TABLE IF NOT EXISTS follows (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  follower_id     BIGINT NOT NULL,
  following_id    BIGINT NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY uk_follow (follower_id, following_id),
  FOREIGN KEY (follower_id) REFERENCES users(id),
  FOREIGN KEY (following_id) REFERENCES users(id)
);

-- 积分记录表
CREATE TABLE IF NOT EXISTS point_logs (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id         BIGINT NOT NULL,
  type            VARCHAR(20) NOT NULL,
  amount          INT NOT NULL,
  reason          VARCHAR(200),
  related_id      BIGINT,
  
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user (user_id, created_at DESC)
);

-- 任务表
CREATE TABLE IF NOT EXISTS tasks (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  creator_id      BIGINT NOT NULL,
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  category        VARCHAR(20),
  reward_type     VARCHAR(20),
  reward_amount   INT,
  reward_pool     INT DEFAULT 0,
  participant_count INT DEFAULT 0,
  deadline        TIMESTAMP,
  
  status          VARCHAR(20) DEFAULT 'active',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (creator_id) REFERENCES users(id),
  INDEX idx_status (status, deadline)
);

-- 任务参与表
CREATE TABLE IF NOT EXISTS task_participants (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  task_id         BIGINT NOT NULL,
  user_id         BIGINT NOT NULL,
  content_id      BIGINT,
  status          VARCHAR(20) DEFAULT 'pending',
  reward_amount   INT DEFAULT 0,
  
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY uk_participant (task_id, user_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
