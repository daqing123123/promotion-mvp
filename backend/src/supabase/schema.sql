-- ===== 巨浪 Supabase Schema (PostgreSQL) =====
-- 在 Supabase SQL Editor 中执行

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== 用户表 =====
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username        VARCHAR(50) NOT NULL UNIQUE,
  name            VARCHAR(100) NOT NULL,
  avatar          VARCHAR(500) DEFAULT '👤',
  bio             TEXT DEFAULT '',
  tags            JSONB DEFAULT '[]',
  
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
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level DESC);

-- ===== 内容表 =====
CREATE TABLE IF NOT EXISTS contents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type            VARCHAR(20) NOT NULL,
  title           VARCHAR(200) NOT NULL,
  description     TEXT DEFAULT '',
  cover_url       VARCHAR(500) DEFAULT '',
  tags            JSONB DEFAULT '[]',
  
  -- 创作者
  creator_id      UUID REFERENCES users(id),
  
  -- 渲染配置
  render_mode     VARCHAR(20) NOT NULL DEFAULT 'card',
  render_src      VARCHAR(500) DEFAULT '',
  render_config   JSONB DEFAULT '{}',
  
  -- 交互配置
  interaction     JSONB DEFAULT '{}',
  
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
  promo_config    JSONB DEFAULT '{}',
  
  -- 状态
  status          VARCHAR(20) DEFAULT 'published',
  visibility      VARCHAR(20) DEFAULT 'public',
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contents_type ON contents(type);
CREATE INDEX IF NOT EXISTS idx_contents_creator ON contents(creator_id);
CREATE INDEX IF NOT EXISTS idx_contents_status ON contents(status);
CREATE INDEX IF NOT EXISTS idx_contents_created ON contents(created_at DESC);

-- ===== 话题表 =====
CREATE TABLE IF NOT EXISTS topics (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type            VARCHAR(30) NOT NULL DEFAULT 'open-discussion',
  title           VARCHAR(200) NOT NULL,
  description     TEXT DEFAULT '',
  
  -- 创作者
  creator_id      UUID REFERENCES users(id),
  creator_name    VARCHAR(100) DEFAULT '',
  creator_avatar  VARCHAR(500) DEFAULT '👤',
  creator_type    VARCHAR(20) DEFAULT 'personal',
  
  -- 话题配置
  config          JSONB DEFAULT '{}',
  
  -- 奖励
  reward_pool     INT DEFAULT 0,
  
  -- 统计
  meme_count      INT DEFAULT 0,
  total_views     BIGINT DEFAULT 0,
  participant_count INT DEFAULT 0,
  hot_score       INT DEFAULT 0,
  
  -- 状态
  status          VARCHAR(20) DEFAULT 'active',
  start_date      TIMESTAMPTZ DEFAULT NOW(),
  end_date        TIMESTAMPTZ,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_topics_type ON topics(type);
CREATE INDEX IF NOT EXISTS idx_topics_status ON topics(status);

-- ===== 梗表 =====
CREATE TABLE IF NOT EXISTS memes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type            VARCHAR(20) NOT NULL DEFAULT 'text',
  title           VARCHAR(200) NOT NULL,
  content         TEXT NOT NULL,
  media_url       VARCHAR(500) DEFAULT '',
  hashtags        JSONB DEFAULT '[]',
  
  -- 关联
  topic_id        UUID REFERENCES topics(id),
  source_content_id UUID REFERENCES contents(id),
  source_meme_id  UUID REFERENCES memes(id),
  
  -- 创作者
  creator_id      UUID REFERENCES users(id),
  creator_name    VARCHAR(100) DEFAULT '',
  creator_avatar  VARCHAR(500) DEFAULT '👤',
  
  -- 统计
  view_count      BIGINT DEFAULT 0,
  like_count      INT DEFAULT 0,
  share_count     INT DEFAULT 0,
  remix_count     INT DEFAULT 0,
  hot_score       INT DEFAULT 0,
  
  -- 状态
  status          VARCHAR(20) DEFAULT 'published',
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memes_topic ON memes(topic_id);
CREATE INDEX IF NOT EXISTS idx_memes_creator ON memes(creator_id);
CREATE INDEX IF NOT EXISTS idx_memes_status ON memes(status);
CREATE INDEX IF NOT EXISTS idx_memes_hot ON memes(hot_score DESC);

-- ===== 互动表（点赞/收藏/分享） =====
CREATE TABLE IF NOT EXISTS interactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id),
  target_type     VARCHAR(20) NOT NULL,
  target_id       UUID NOT NULL,
  action          VARCHAR(20) NOT NULL,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, target_type, target_id, action)
);

CREATE INDEX IF NOT EXISTS idx_interactions_target ON interactions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user ON interactions(user_id);

-- ===== 积分记录表 =====
CREATE TABLE IF NOT EXISTS point_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id),
  amount          INT NOT NULL,
  type            VARCHAR(20) NOT NULL,
  description     TEXT DEFAULT '',
  reference_type  VARCHAR(20) DEFAULT '',
  reference_id    UUID DEFAULT NULL,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_point_logs_user ON point_logs(user_id);

-- ===== 成就表 =====
CREATE TABLE IF NOT EXISTS achievements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id),
  type            VARCHAR(50) NOT NULL,
  name            VARCHAR(100) NOT NULL,
  description     TEXT DEFAULT '',
  icon            VARCHAR(10) DEFAULT '🏅',
  
  unlocked_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);

-- ===== 评论表 =====
CREATE TABLE IF NOT EXISTS comments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id),
  target_type     VARCHAR(20) NOT NULL,
  target_id       UUID NOT NULL,
  content         TEXT NOT NULL,
  parent_id       UUID REFERENCES comments(id),
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_type, target_id);

-- ===== 消息/通知表 =====
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id),
  type            VARCHAR(30) NOT NULL,
  title           VARCHAR(200) NOT NULL,
  content         TEXT DEFAULT '',
  reference_type  VARCHAR(20) DEFAULT '',
  reference_id    UUID DEFAULT NULL,
  is_read         BOOLEAN DEFAULT FALSE,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- ===== 关注表 =====
CREATE TABLE IF NOT EXISTS follows (
  follower_id     UUID REFERENCES users(id),
  following_id    UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY(follower_id, following_id)
);

-- ===== RLS 策略 =====
-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE memes ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- 匿名可读策略（所有人可查看公开内容）
CREATE POLICY "Public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Public read contents" ON contents FOR SELECT USING (status = 'published');
CREATE POLICY "Public read topics" ON topics FOR SELECT USING (status = 'active');
CREATE POLICY "Public read memes" ON memes FOR SELECT USING (status = 'published');
CREATE POLICY "Public read comments" ON comments FOR SELECT USING (true);

-- 认证用户可写策略
CREATE POLICY "Auth insert contents" ON contents FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Auth update own contents" ON contents FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Auth insert memes" ON memes FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Auth insert interactions" ON interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth delete own interactions" ON interactions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Auth insert comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Auth update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ===== 更新时间触发器 =====
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_contents_updated BEFORE UPDATE ON contents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_topics_updated BEFORE UPDATE ON topics FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_memes_updated BEFORE UPDATE ON memes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
