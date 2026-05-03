-- ===== 品牌推广增强 SQL =====
-- 在 Supabase SQL Editor 中执行

-- 1. topics 表加奖励类型
ALTER TABLE topics ADD COLUMN IF NOT EXISTS reward_type VARCHAR(20) DEFAULT 'points';
-- reward_type: 'points'=纯积分, 'physical'=纯实物, 'both'=积分+实物

-- 2. topics 表加实物奖励描述
ALTER TABLE topics ADD COLUMN IF NOT EXISTS reward_description TEXT DEFAULT '';
-- 如："限量版耳机 x10"、"新品试用装 x50"

-- 3. topic_promotes 表加地址和状态字段
ALTER TABLE topic_promotes ADD COLUMN IF NOT EXISTS receiver_name VARCHAR(100) DEFAULT '';
ALTER TABLE topic_promotes ADD COLUMN IF NOT EXISTS receiver_phone VARCHAR(20) DEFAULT '';
ALTER TABLE topic_promotes ADD COLUMN IF NOT EXISTS receiver_address TEXT DEFAULT '';
ALTER TABLE topic_promotes ADD COLUMN IF NOT EXISTS reward_shipped BOOLEAN DEFAULT FALSE;
ALTER TABLE topic_promotes ADD COLUMN IF NOT EXISTS feedback TEXT DEFAULT '';
ALTER TABLE topic_promotes ADD COLUMN IF NOT EXISTS feedback_rating INT DEFAULT 0;

-- 4. topic_promotes 状态说明
-- accepted: 已接受
-- address_submitted: 已提交地址
-- completed: 已完成（商家确认）
-- shipped: 已发货
-- received: 已收货
