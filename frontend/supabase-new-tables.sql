-- ===== 巨浪平台新表 SQL =====
-- 请在 Supabase Dashboard → SQL Editor 中执行

-- 1. 签到表
CREATE TABLE IF NOT EXISTS sign_ins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sign_date DATE NOT NULL DEFAULT CURRENT_DATE,
  consecutive_days INTEGER NOT NULL DEFAULT 1,
  points_earned INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, sign_date)
);

CREATE INDEX idx_sign_ins_user_date ON sign_ins(user_id, sign_date DESC);

-- 2. 帮推记录表
CREATE TABLE IF NOT EXISTS promotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  points_earned INTEGER NOT NULL DEFAULT 20,
  bonus_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_id)
);

CREATE INDEX idx_promotes_user ON promotes(user_id, created_at DESC);
CREATE INDEX idx_promotes_content ON promotes(content_id);

-- 3. 任务表
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('daily', 'promote', 'create', 'challenge')),
  category TEXT NOT NULL DEFAULT 'official',
  reward_points INTEGER NOT NULL DEFAULT 0,
  reward_type TEXT NOT NULL DEFAULT 'points',
  target_type TEXT,
  target_id UUID,
  max_participants INTEGER,
  current_participants INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'cancelled')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_type ON tasks(type, status);
CREATE INDEX idx_tasks_status ON tasks(status, end_date);

-- 4. 任务参与表
CREATE TABLE IF NOT EXISTS task_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'joined' CHECK (status IN ('joined', 'completed', 'cancelled')),
  progress INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, user_id)
);

CREATE INDEX idx_task_participants_user ON task_participants(user_id, status);

-- 5. 投票表
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  content_id UUID REFERENCES contents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  options JSONB NOT NULL DEFAULT '[]',
  vote_cost INTEGER NOT NULL DEFAULT 0,
  vote_reward INTEGER NOT NULL DEFAULT 5,
  max_votes_per_user INTEGER NOT NULL DEFAULT 1,
  total_votes INTEGER NOT NULL DEFAULT 0,
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'cancelled')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_votes_status ON votes(status, end_date);

-- 6. 投票记录表
CREATE TABLE IF NOT EXISTS vote_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vote_id UUID NOT NULL REFERENCES votes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  option_index INTEGER NOT NULL,
  points_spent INTEGER NOT NULL DEFAULT 0,
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(vote_id, user_id, option_index)
);

CREATE INDEX idx_vote_records_vote ON vote_records(vote_id);
CREATE INDEX idx_vote_records_user ON vote_records(user_id);

-- 7. 活动表
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('promote_challenge', 'create_challenge', 'vote_activity', 'other')),
  cover_url TEXT DEFAULT '',
  reward_points INTEGER NOT NULL DEFAULT 0,
  reward_type TEXT NOT NULL DEFAULT 'points',
  max_participants INTEGER,
  current_participants INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'cancelled')),
  rules JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activities_status ON activities(status, end_date);

-- 8. 活动参与表
CREATE TABLE IF NOT EXISTS activity_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'joined' CHECK (status IN ('joined', 'completed', 'cancelled')),
  progress INTEGER NOT NULL DEFAULT 0,
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(activity_id, user_id)
);

CREATE INDEX idx_activity_participants_user ON activity_participants(user_id, status);

-- 9. 成就表（如果不存在则创建，存在则添加新字段）
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);

-- 10. 积分防刷：每日积分上限表
CREATE TABLE IF NOT EXISTS daily_point_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  limit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_earned INTEGER NOT NULL DEFAULT 0,
  breakdown JSONB NOT NULL DEFAULT '{}',
  UNIQUE(user_id, limit_date)
);

CREATE INDEX idx_daily_point_limits_user ON daily_point_limits(user_id, limit_date);

-- 11. 插入默认任务数据
INSERT INTO tasks (title, description, type, category, reward_points, status) VALUES
  ('每日签到', '每日签到获得10积分', 'daily', 'official', 10, 'active'),
  ('发布内容', '发布任意一条内容', 'daily', 'official', 10, 'active'),
  ('点赞互动', '点赞5个内容', 'daily', 'official', 25, 'active'),
  ('帮推内容', '帮推1个内容', 'daily', 'official', 20, 'active'),
  ('评论互动', '评论3个内容', 'daily', 'official', 15, 'active'),
  ('帮推挑战', '帮推指定内容获得额外积分', 'promote', 'official', 50, 'active'),
  ('创作挑战', '发布指定类型内容', 'create', 'official', 100, 'active')
ON CONFLICT DO NOTHING;

-- 12. 插入默认活动数据
INSERT INTO activities (title, description, type, reward_points, start_date, end_date, status) VALUES
  ('帮推冲浪赛', '帮推最多内容赢取大奖', 'promote_challenge', 1000, now(), now() + interval '7 days', 'active'),
  ('创作马拉松', '7天内发布最多优质内容', 'create_challenge', 2000, now(), now() + interval '7 days', 'active'),
  ('全民投票周', '参与投票赢取积分', 'vote_activity', 500, now(), now() + interval '7 days', 'active')
ON CONFLICT DO NOTHING;
