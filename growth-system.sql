-- ===== 用户增长系统 SQL =====
-- 在 Supabase SQL Editor 中执行

-- 1. 邀请码表
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL UNIQUE,
  uses_count INT DEFAULT 0,
  max_uses INT DEFAULT 0, -- 0=无限
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON referral_codes(user_id);
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read referral_codes" ON referral_codes FOR SELECT USING (true);
CREATE POLICY "Auth insert own referral_codes" ON referral_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth update own referral_codes" ON referral_codes FOR UPDATE USING (auth.uid() = user_id);

-- 2. 邀请记录表
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referral_code VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'registered', -- registered / active / rewarded
  referrer_reward INT DEFAULT 100,
  referred_reward INT DEFAULT 50,
  bonus_type VARCHAR(30) DEFAULT '', -- promote_boost / lottery_boost
  bonus_value DECIMAL(3,1) DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referred_id) -- 每个被邀请人只能被邀请一次
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read referrals" ON referrals FOR SELECT USING (true);
CREATE POLICY "Auth insert referrals" ON referrals FOR INSERT WITH CHECK (auth.uid() = referred_id);

-- 3. 用户增长统计视图（方便查询）
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
