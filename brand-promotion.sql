-- ===== 品牌推广系统 SQL =====
-- 在 Supabase SQL Editor 中执行

-- 1. topics 表加品牌字段
ALTER TABLE topics ADD COLUMN IF NOT EXISTS brand_name VARCHAR(200) DEFAULT '';
ALTER TABLE topics ADD COLUMN IF NOT EXISTS brand_logo VARCHAR(500) DEFAULT '';
ALTER TABLE topics ADD COLUMN IF NOT EXISTS brand_description TEXT DEFAULT '';
ALTER TABLE topics ADD COLUMN IF NOT EXISTS promote_reward INT DEFAULT 20;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS promote_target INT DEFAULT 100;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS promote_count INT DEFAULT 0;

-- 2. 推广接受记录表
CREATE TABLE IF NOT EXISTS topic_promotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'accepted',
  points_earned INT DEFAULT 0,
  shared_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(topic_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_topic_promotes_topic ON topic_promotes(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_promotes_user ON topic_promotes(user_id);
ALTER TABLE topic_promotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read topic_promotes" ON topic_promotes FOR SELECT USING (true);
CREATE POLICY "Auth insert topic_promotes" ON topic_promotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth update own topic_promotes" ON topic_promotes FOR UPDATE USING (auth.uid() = user_id);
