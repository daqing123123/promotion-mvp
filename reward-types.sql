-- ===== 多类型奖励 SQL =====
-- 在 Supabase SQL Editor 中执行

-- topics 表加优惠券相关字段
ALTER TABLE topics ADD COLUMN IF NOT EXISTS coupon_type VARCHAR(50) DEFAULT '';
-- 例如: 'discount'（折扣券）, 'cashback'（返现券）, 'freebie'（免单券）, 'points_boost'（积分加倍券）

ALTER TABLE topics ADD COLUMN IF NOT EXISTS coupon_value VARCHAR(100) DEFAULT '';
-- 例如: '8折', '满100减20', '免单', '双倍积分'

ALTER TABLE topics ADD COLUMN IF NOT EXISTS coupon_count INT DEFAULT 0;
-- 优惠券总数量

ALTER TABLE topics ADD COLUMN IF NOT EXISTS coupon_claimed INT DEFAULT 0;
-- 已领取数量

ALTER TABLE topics ADD COLUMN IF NOT EXISTS coupon_expire_days INT DEFAULT 30;
-- 领取后有效天数

-- 用户优惠券领取记录
CREATE TABLE IF NOT EXISTS user_coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  coupon_type VARCHAR(50) NOT NULL,
  coupon_value VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'unused', -- unused / used / expired
  expire_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_coupons_user ON user_coupons(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_coupons_topic ON user_coupons(topic_id);
ALTER TABLE user_coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own coupons" ON user_coupons FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own coupons" ON user_coupons FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own coupons" ON user_coupons FOR UPDATE USING (auth.uid() = user_id);
