-- ============================================
-- 巨浪 Julang - MySQL 建表语句
-- 从 Supabase (PostgreSQL) 迁移到 RDS MySQL DuckDB
-- ============================================

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,  -- UUID
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL DEFAULT '',
  `avatar` VARCHAR(20) NOT NULL DEFAULT '👤',
  `bio` TEXT,
  `tags` JSON,  -- ["标签1", "标签2"]
  `points` INT NOT NULL DEFAULT 0,
  `level` INT NOT NULL DEFAULT 1,
  `experience` INT NOT NULL DEFAULT 0,
  `email` VARCHAR(255),
  `password_hash` VARCHAR(255),  -- 自建认证用
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_username` (`username`),
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 内容表
CREATE TABLE IF NOT EXISTS `contents` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `type` VARCHAR(20) NOT NULL DEFAULT 'article',  -- article/video/image/link
  `title` VARCHAR(500) NOT NULL,
  `description` TEXT,
  `cover_url` VARCHAR(1000),
  `url` VARCHAR(1000),
  `tags` JSON,
  `render_mode` VARCHAR(20) NOT NULL DEFAULT 'card',  -- card/embed/inline
  `status` VARCHAR(20) NOT NULL DEFAULT 'published',  -- draft/published/archived
  `creator_id` CHAR(36) NOT NULL,
  `like_count` INT NOT NULL DEFAULT 0,
  `comment_count` INT NOT NULL DEFAULT 0,
  `view_count` INT NOT NULL DEFAULT 0,
  `promote_count` INT NOT NULL DEFAULT 0,
  `favorite_count` INT NOT NULL DEFAULT 0,
  `hot_score` INT NOT NULL DEFAULT 100,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_contents_creator` (`creator_id`),
  INDEX `idx_contents_status` (`status`),
  INDEX `idx_contents_type` (`type`),
  INDEX `idx_contents_hot` (`hot_score` DESC),
  INDEX `idx_contents_created` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 话题表
CREATE TABLE IF NOT EXISTS `topics` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `cover_url` VARCHAR(1000),
  `type` VARCHAR(50) NOT NULL DEFAULT 'general',  -- product-review/skill/tutorial/general
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',  -- active/archived
  `hot_score` INT NOT NULL DEFAULT 0,
  `content_count` INT NOT NULL DEFAULT 0,
  `participant_count` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_topics_status` (`status`),
  INDEX `idx_topics_type` (`type`),
  INDEX `idx_topics_hot` (`hot_score` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 梗/Meme 表
CREATE TABLE IF NOT EXISTS `memes` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `type` VARCHAR(20) NOT NULL DEFAULT 'text',  -- text/image/video
  `title` VARCHAR(500) NOT NULL,
  `content` TEXT,
  `cover_url` VARCHAR(1000),
  `topic_id` CHAR(36),
  `source_content_id` CHAR(36),
  `hashtags` JSON,
  `creator_id` CHAR(36) NOT NULL,
  `creator_name` VARCHAR(100) DEFAULT '',
  `creator_avatar` VARCHAR(20) DEFAULT '👤',
  `like_count` INT NOT NULL DEFAULT 0,
  `comment_count` INT NOT NULL DEFAULT 0,
  `hot_score` INT NOT NULL DEFAULT 0,
  `status` VARCHAR(20) NOT NULL DEFAULT 'published',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_memes_topic` (`topic_id`),
  INDEX `idx_memes_creator` (`creator_id`),
  INDEX `idx_memes_hot` (`hot_score` DESC),
  INDEX `idx_memes_created` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 互动表（点赞/收藏）
CREATE TABLE IF NOT EXISTS `interactions` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL,
  `target_type` VARCHAR(20) NOT NULL,  -- content/meme
  `target_id` CHAR(36) NOT NULL,
  `action` VARCHAR(20) NOT NULL,  -- like/favorite
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_interaction` (`user_id`, `target_type`, `target_id`, `action`),
  INDEX `idx_interactions_target` (`target_type`, `target_id`),
  INDEX `idx_interactions_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 评论表
CREATE TABLE IF NOT EXISTS `comments` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL,
  `target_type` VARCHAR(20) NOT NULL,  -- content/meme
  `target_id` CHAR(36) NOT NULL,
  `content` TEXT NOT NULL,
  `like_count` INT NOT NULL DEFAULT 0,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',  -- active/deleted
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_comments_target` (`target_type`, `target_id`),
  INDEX `idx_comments_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 通知表
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL,
  `type` VARCHAR(50) NOT NULL,  -- like/comment/follow/system/level_up
  `title` VARCHAR(200) NOT NULL,
  `content` TEXT,
  `related_id` VARCHAR(100) DEFAULT '',
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_notifications_user` (`user_id`, `is_read`, `created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 积分日志表
CREATE TABLE IF NOT EXISTS `point_logs` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL,
  `amount` INT NOT NULL,
  `type` VARCHAR(50) NOT NULL,  -- checkin/like/promote/comment/vote/task/level_up/share/achievement
  `description` VARCHAR(500) NOT NULL DEFAULT '',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_point_logs_user` (`user_id`, `created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 每日积分上限表
CREATE TABLE IF NOT EXISTS `daily_point_limits` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL,
  `limit_date` DATE NOT NULL,
  `total_earned` INT NOT NULL DEFAULT 0,
  `breakdown` JSON,  -- {"checkin": 10, "like": 5, ...}
  UNIQUE KEY `uk_daily_limit` (`user_id`, `limit_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 帮推表
CREATE TABLE IF NOT EXISTS `promotes` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL,
  `content_id` CHAR(36) NOT NULL,
  `points_earned` INT NOT NULL DEFAULT 0,
  `bonus_earned` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_promote` (`user_id`, `content_id`),
  INDEX `idx_promotes_content` (`content_id`),
  INDEX `idx_promotes_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 签到表
CREATE TABLE IF NOT EXISTS `sign_ins` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL,
  `sign_date` DATE NOT NULL,
  `consecutive_days` INT NOT NULL DEFAULT 1,
  `points_earned` INT NOT NULL DEFAULT 10,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_signin` (`user_id`, `sign_date`),
  INDEX `idx_signins_user_date` (`user_id`, `sign_date` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 任务表
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `type` VARCHAR(50) NOT NULL DEFAULT 'daily',  -- daily/weekly/special
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `reward_points` INT NOT NULL DEFAULT 0,
  `max_participants` INT NOT NULL DEFAULT 0,
  `current_participants` INT NOT NULL DEFAULT 0,
  `start_date` TIMESTAMP NULL,
  `end_date` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_tasks_status` (`status`, `type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 任务参与表
CREATE TABLE IF NOT EXISTS `task_participants` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `task_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'joined',  -- joined/completed/failed
  `completed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_task_participant` (`task_id`, `user_id`),
  INDEX `idx_task_participants_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 投票表
CREATE TABLE IF NOT EXISTS `votes` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `title` VARCHAR(500) NOT NULL,
  `description` TEXT,
  `options` JSON,  -- [{"index":0,"text":"选项A","vote_count":0}, ...]
  `topic_id` CHAR(36),
  `content_id` CHAR(36),
  `vote_cost` INT NOT NULL DEFAULT 0,
  `vote_reward` INT NOT NULL DEFAULT 5,
  `total_votes` INT NOT NULL DEFAULT 0,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',  -- active/closed
  `end_date` TIMESTAMP NULL,
  `created_by` CHAR(36) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_votes_status` (`status`, `created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 投票记录表
CREATE TABLE IF NOT EXISTS `vote_records` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `vote_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `option_index` INT NOT NULL,
  `points_spent` INT NOT NULL DEFAULT 0,
  `points_earned` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_vote_record` (`vote_id`, `user_id`),
  INDEX `idx_vote_records_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 活动表
CREATE TABLE IF NOT EXISTS `activities` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `cover_url` VARCHAR(1000),
  `type` VARCHAR(50) NOT NULL DEFAULT 'event',
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `max_participants` INT NOT NULL DEFAULT 0,
  `current_participants` INT NOT NULL DEFAULT 0,
  `reward_points` INT NOT NULL DEFAULT 0,
  `start_date` TIMESTAMP NULL,
  `end_date` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_activities_status` (`status`, `created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 活动参与表
CREATE TABLE IF NOT EXISTS `activity_participants` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `activity_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'joined',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_activity_participant` (`activity_id`, `user_id`),
  INDEX `idx_activity_participants_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户成就表
CREATE TABLE IF NOT EXISTS `user_achievements` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL,
  `achievement_id` VARCHAR(50) NOT NULL,
  `reward_claimed` TINYINT(1) NOT NULL DEFAULT 0,
  `unlocked_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_achievement` (`user_id`, `achievement_id`),
  INDEX `idx_achievements_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 关注表
CREATE TABLE IF NOT EXISTS `follows` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `follower_id` CHAR(36) NOT NULL,
  `following_id` CHAR(36) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_follow` (`follower_id`, `following_id`),
  INDEX `idx_follows_following` (`following_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 邀请码表
CREATE TABLE IF NOT EXISTS `referral_codes` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL UNIQUE,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `uses_count` INT NOT NULL DEFAULT 0,
  `max_uses` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_referral_codes_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 邀请记录表
CREATE TABLE IF NOT EXISTS `referrals` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `referrer_id` CHAR(36) NOT NULL,
  `referred_id` CHAR(36) NOT NULL,
  `referral_code` VARCHAR(20) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'registered',  -- registered/activated
  `referrer_reward` INT NOT NULL DEFAULT 0,
  `referred_reward` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_referrals_referrer` (`referrer_id`),
  INDEX `idx_referrals_referred` (`referred_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
