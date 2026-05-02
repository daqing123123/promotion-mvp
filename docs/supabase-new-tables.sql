-- ===== 巨浪新增表 SQL =====
-- 在 Supabase SQL Editor 中执行
-- 前提：老表（users/contents/topics/memes/interactions/point_logs/achievements/comments/notifications/follows）已存在

-- ===== 1. 签到表 =====
CREATE TABLE IF NOT EXISTS sign_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sign_date DATE NOT NULL DEFAULT CURRENT_DATE,
  consecutive_days INT DEFAULT 1,
  points_earned INT DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sign_date)
);
CREATE INDEX IF NOT EXISTS idx_sign_ins_user ON sign_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_sign_ins_date ON sign_ins(sign_date DESC);
ALTER TABLE sign_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth insert sign_ins" ON sign_ins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth read own sign_ins" ON sign_ins FOR SELECT USING (auth.uid() = user_id);

-- ===== 2. 任务表 =====
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(30) NOT NULL DEFAULT 'daily',
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT '',
  reward INT DEFAULT 10,
  target_count INT DEFAULT 1,
  category VARCHAR(30) DEFAULT 'general',
  status VARCHAR(20) DEFAULT 'active',
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read tasks" ON tasks FOR SELECT USING (status = 'active');

-- ===== 3. 任务参与表 =====
CREATE TABLE IF NOT EXISTS task_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  progress INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'in_progress',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_task_participants_user ON task_participants(user_id);
ALTER TABLE task_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth insert task_participants" ON task_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth update own task_participants" ON task_participants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Auth read own task_participants" ON task_participants FOR SELECT USING (auth.uid() = user_id);

-- ===== 4. 帮推记录表 =====
CREATE TABLE IF NOT EXISTS promotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
  points_earned INT DEFAULT 20,
  bonus_earned INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);
CREATE INDEX IF NOT EXISTS idx_promotes_user ON promotes(user_id);
CREATE INDEX IF NOT EXISTS idx_promotes_content ON promotes(content_id);
ALTER TABLE promotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read promotes" ON promotes FOR SELECT USING (true);
CREATE POLICY "Auth insert promotes" ON promotes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===== 5. 投票表 =====
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT '',
  options JSONB NOT NULL DEFAULT '[]',
  vote_count INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_votes_topic ON votes(topic_id);
CREATE INDEX IF NOT EXISTS idx_votes_status ON votes(status);
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read votes" ON votes FOR SELECT USING (status = 'active');

-- ===== 6. 投票记录表 =====
CREATE TABLE IF NOT EXISTS vote_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vote_id UUID REFERENCES votes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  option_index INT NOT NULL,
  points_spent INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vote_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_vote_records_vote ON vote_records(vote_id);
CREATE INDEX IF NOT EXISTS idx_vote_records_user ON vote_records(user_id);
ALTER TABLE vote_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth insert vote_records" ON vote_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth read own vote_records" ON vote_records FOR SELECT USING (auth.uid() = user_id);

-- ===== 7. 活动表 =====
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(30) NOT NULL DEFAULT 'promote',
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT '',
  reward INT DEFAULT 100,
  participant_count INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read activities" ON activities FOR SELECT USING (status = 'active');

-- ===== 8. 活动参与表 =====
CREATE TABLE IF NOT EXISTS activity_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  progress INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'in_progress',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activity_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_activity_participants_user ON activity_participants(user_id);
ALTER TABLE activity_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth insert activity_participants" ON activity_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth read own activity_participants" ON activity_participants FOR SELECT USING (auth.uid() = user_id);

-- ===== 9. 用户成就表 =====
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT DEFAULT '',
  icon VARCHAR(10) DEFAULT '🏅',
  category VARCHAR(30) DEFAULT 'general',
  points_earned INT DEFAULT 0,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read own user_achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Auth insert user_achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===== 10. 每日积分上限表（防刷） =====
CREATE TABLE IF NOT EXISTS daily_point_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type VARCHAR(30) NOT NULL,
  total_earned INT DEFAULT 0,
  breakdown JSONB DEFAULT '{}',
  UNIQUE(user_id, date, type)
);
CREATE INDEX IF NOT EXISTS idx_daily_point_limits_user ON daily_point_limits(user_id, date);
ALTER TABLE daily_point_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read own daily_point_limits" ON daily_point_limits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Auth insert daily_point_limits" ON daily_point_limits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth update own daily_point_limits" ON daily_point_limits FOR UPDATE USING (auth.uid() = user_id);

-- ===== 11. 更新时间触发器 =====
CREATE TRIGGER trigger_tasks_updated BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_votes_updated BEFORE UPDATE ON votes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_activities_updated BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===== 12. 初始数据：每日任务 =====
INSERT INTO tasks (type, title, description, reward, target_count, category) VALUES
  ('daily', '每日签到', '打开App签到', 10, 1, 'checkin'),
  ('daily', '刷一刷', '浏览30条内容', 30, 30, 'browse'),
  ('daily', '帮一帮', '完成3次帮推', 50, 3, 'promote'),
  ('daily', '评一评', '写2条评论', 20, 2, 'comment'),
  ('daily', '全勤奖', '完成今日全部任务', 50, 1, 'bonus')
ON CONFLICT DO NOTHING;

-- ===== 13. 初始数据：示例活动 =====
INSERT INTO activities (type, title, description, reward, end_date) VALUES
  ('promote', '帮推挑战赛', '帮推任意内容满10次，瓜分1000积分', 100, NOW() + INTERVAL '7 days'),
  ('create', '创作马拉松', '发布5条优质内容，获得500积分奖励', 500, NOW() + INTERVAL '14 days'),
  ('vote', '最佳内容投票', '为你喜欢的内容投票，投票即得积分', 30, NOW() + INTERVAL '3 days')
ON CONFLICT DO NOTHING;
