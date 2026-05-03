-- ===== 巨浪平台完整 SQL =====
-- 在 Supabase SQL Editor 中一次执行全部
-- 执行顺序：基础表 → 扩展字段 → 索引 → RLS → 视图

-- =============================================
-- 第一部分：topics 表扩展（品牌推广字段）
-- =============================================

ALTER TABLE topics ADD COLUMN IF NOT EXISTS brand_name VARCHAR(200) DEFAULT '';
ALTER TABLE topics ADD COLUMN IF NOT EXISTS brand_logo VARCHAR(500) DEFAULT '';
ALTER TABLE topics ADD COLUMN IF NOT EXISTS brand_description TEXT DEFAULT '';
ALTER TABLE topics ADD COLUMN IF NOT EXISTS promote_reward INT DEFAULT 20;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS promote_target INT DEFAULT 100;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS promote_count INT DEFAULT 0;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS reward_type VARCHAR(20) DEFAULT 'points';
-- reward_type: 'points'=纯积分, 'physical'=纯实物, 'both'=积分+实物, 'coupon'=优惠券
ALTER TABLE topics ADD COLUMN IF NOT EXISTS reward_description TEXT DEFAULT '';
ALTER TABLE topics ADD COLUMN IF NOT EXISTS coupon_type VARCHAR(50) DEFAULT '';
ALTER TABLE topics ADD COLUMN IF NOT EXISTS coupon_value VARCHAR(100) DEFAULT '';
ALTER TABLE topics ADD COLUMN IF NOT EXISTS coupon_count INT DEFAULT 0;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS coupon_claimed INT DEFAULT 0;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS coupon_expire_days INT DEFAULT 30;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';

-- =============================================
-- 第二部分：topic_promotes 表（帮推记录）
-- =============================================

CREATE TABLE IF NOT EXISTS topic_promotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'accepted',
  points_earned INT DEFAULT 0,
  shared_at TIMESTAMPTZ,
  receiver_name VARCHAR(100) DEFAULT '',
  receiver_phone VARCHAR(20) DEFAULT '',
  receiver_address TEXT DEFAULT '',
  reward_shipped BOOLEAN DEFAULT FALSE,
  feedback TEXT DEFAULT '',
  feedback_rating INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(topic_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_topic_promotes_topic ON topic_promotes(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_promotes_user ON topic_promotes(user_id);
ALTER TABLE topic_promotes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read topic_promotes') THEN
    CREATE POLICY "Public read topic_promotes" ON topic_promotes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth insert topic_promotes') THEN
    CREATE POLICY "Auth insert topic_promotes" ON topic_promotes FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth update own topic_promotes') THEN
    CREATE POLICY "Auth update own topic_promotes" ON topic_promotes FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- =============================================
-- 第三部分：referral_codes 表（邀请码）
-- =============================================

CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL UNIQUE,
  uses_count INT DEFAULT 0,
  max_uses INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON referral_codes(user_id);
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read referral_codes') THEN
    CREATE POLICY "Public read referral_codes" ON referral_codes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth insert own referral_codes') THEN
    CREATE POLICY "Auth insert own referral_codes" ON referral_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth update own referral_codes') THEN
    CREATE POLICY "Auth update own referral_codes" ON referral_codes FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- =============================================
-- 第四部分：referrals 表（邀请记录）
-- =============================================

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referral_code VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'registered',
  referrer_reward INT DEFAULT 100,
  referred_reward INT DEFAULT 50,
  bonus_type VARCHAR(30) DEFAULT '',
  bonus_value DECIMAL(3,1) DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referred_id)
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read referrals') THEN
    CREATE POLICY "Public read referrals" ON referrals FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth insert referrals') THEN
    CREATE POLICY "Auth insert referrals" ON referrals FOR INSERT WITH CHECK (auth.uid() = referred_id);
  END IF;
END $$;

-- =============================================
-- 第五部分：user_coupons 表（优惠券）
-- =============================================

CREATE TABLE IF NOT EXISTS user_coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  coupon_type VARCHAR(50) NOT NULL,
  coupon_value VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'unused',
  expire_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_coupons_user ON user_coupons(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_coupons_topic ON user_coupons(topic_id);
ALTER TABLE user_coupons ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own coupons') THEN
    CREATE POLICY "Users read own coupons" ON user_coupons FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users insert own coupons') THEN
    CREATE POLICY "Users insert own coupons" ON user_coupons FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users update own coupons') THEN
    CREATE POLICY "Users update own coupons" ON user_coupons FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- =============================================
-- 第六部分：point_records 表（积分记录）
-- =============================================

CREATE TABLE IF NOT EXISTS point_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  points INT NOT NULL,
  type VARCHAR(30) NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_point_records_user ON point_records(user_id, created_at DESC);
ALTER TABLE point_records ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own point_records') THEN
    CREATE POLICY "Users read own point_records" ON point_records FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth insert point_records') THEN
    CREATE POLICY "Auth insert point_records" ON point_records FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- =============================================
-- 第七部分：follows 表（关注）
-- =============================================

CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read follows') THEN
    CREATE POLICY "Public read follows" ON follows FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth insert follows') THEN
    CREATE POLICY "Auth insert follows" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth delete follows') THEN
    CREATE POLICY "Auth delete follows" ON follows FOR DELETE USING (auth.uid() = follower_id);
  END IF;
END $$;

-- =============================================
-- 第八部分：notifications 表（通知）
-- =============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL,
  title VARCHAR(200) DEFAULT '',
  content TEXT DEFAULT '',
  from_user_id UUID,
  target_id UUID,
  target_type VARCHAR(30) DEFAULT '',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own notifications') THEN
    CREATE POLICY "Users read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth insert notifications') THEN
    CREATE POLICY "Auth insert notifications" ON notifications FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users update own notifications') THEN
    CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- =============================================
-- 第九部分：user_achievements 表（成就）
-- =============================================

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(50) NOT NULL,
  reward_claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read user_achievements') THEN
    CREATE POLICY "Public read user_achievements" ON user_achievements FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth insert user_achievements') THEN
    CREATE POLICY "Auth insert user_achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- =============================================
-- 第十部分：user_growth_stats 视图
-- =============================================

CREATE OR REPLACE VIEW user_growth_stats AS
SELECT
  u.id as user_id,
  COALESCE(r.invite_count, 0) as invite_count,
  COALESCE(r.active_count, 0) as active_count,
  COALESCE(r.total_bonus, 0) as total_bonus,
  CASE
    WHEN COALESCE(r.invite_count, 0) >= 50 THEN 'legend'
    WHEN COALESCE(r.invite_count, 0) >= 20 THEN 'master'
    WHEN COALESCE(r.invite_count, 0) >= 10 THEN 'expert'
    WHEN COALESCE(r.invite_count, 0) >= 5 THEN 'promoter'
    WHEN COALESCE(r.invite_count, 0) >= 1 THEN 'starter'
    ELSE 'newbie'
  END as growth_level
FROM users u
LEFT JOIN (
  SELECT
    referrer_id,
    COUNT(*) as invite_count,
    COUNT(*) FILTER (WHERE status = 'active') as active_count,
    SUM(referrer_reward) as total_bonus
  FROM referrals
  GROUP BY referrer_id
) r ON r.referrer_id = u.id;

-- =============================================
-- 第十一部分：memes INSERT 策略
-- =============================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_insert_memes') THEN
    CREATE POLICY "allow_insert_memes" ON public.memes FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_select_memes') THEN
    CREATE POLICY "allow_select_memes" ON public.memes FOR SELECT USING (true);
  END IF;
END $$;

-- =============================================
-- 第十二部分：自动确认用户（绕过邮箱验证）
-- =============================================

CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS trigger AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = now(),
      confirmed_at = now()
  WHERE id = NEW.id
    AND email_confirmed_at IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_user();

-- =============================================
-- 完成！
-- =============================================
