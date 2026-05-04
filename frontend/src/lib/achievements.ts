// ===== 成就系统（真实逻辑） =====

import { getUserAchievements, unlockAchievement, getUserById, getContents, getUserTasks } from './api/client'

export interface AchievementDef {
  id: string
  name: string
  icon: string
  desc: string
  category: 'discover' | 'promote' | 'create' | 'social' | 'checkin' | 'special'
  condition: string
  rewardPoints: number
  check: (stats: UserStats) => boolean
  getProgress: (stats: UserStats) => { current: number; max: number }
}

export interface UserStats {
  totalPromotes: number
  contentPublished: number
  totalLikes: number
  totalComments: number
  consecutiveCheckInDays: number
  totalCheckInDays: number
  followers: number
  totalPoints: number
  tasksCompleted: number
  votesParticipated: number
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // 帮推类
  {
    id: 'first_promote',
    name: '初出茅庐',
    icon: '🌱',
    desc: '第一次帮推内容',
    category: 'promote',
    condition: '帮推1次',
    rewardPoints: 20,
    check: s => s.totalPromotes >= 1,
    getProgress: s => ({ current: Math.min(s.totalPromotes, 1), max: 1 }),
  },
  {
    id: 'promote_10',
    name: '热心肠',
    icon: '🔥',
    desc: '累计帮推10次',
    category: 'promote',
    condition: '帮推10次',
    rewardPoints: 50,
    check: s => s.totalPromotes >= 10,
    getProgress: s => ({ current: Math.min(s.totalPromotes, 10), max: 10 }),
  },
  {
    id: 'promote_100',
    name: '帮推达人',
    icon: '🏅',
    desc: '累计帮推100次',
    category: 'promote',
    condition: '帮推100次',
    rewardPoints: 200,
    check: s => s.totalPromotes >= 100,
    getProgress: s => ({ current: Math.min(s.totalPromotes, 100), max: 100 }),
  },

  // 创作类
  {
    id: 'first_content',
    name: '内容新星',
    icon: '⭐',
    desc: '发布第一条内容',
    category: 'create',
    condition: '发布1条内容',
    rewardPoints: 10,
    check: s => s.contentPublished >= 1,
    getProgress: s => ({ current: Math.min(s.contentPublished, 1), max: 1 }),
  },
  {
    id: 'content_10',
    name: '创作达人',
    icon: '✍️',
    desc: '发布10条内容',
    category: 'create',
    condition: '发布10条内容',
    rewardPoints: 50,
    check: s => s.contentPublished >= 10,
    getProgress: s => ({ current: Math.min(s.contentPublished, 10), max: 10 }),
  },
  {
    id: 'content_50',
    name: '创作大师',
    icon: '📚',
    desc: '发布50条内容',
    category: 'create',
    condition: '发布50条内容',
    rewardPoints: 200,
    check: s => s.contentPublished >= 50,
    getProgress: s => ({ current: Math.min(s.contentPublished, 50), max: 50 }),
  },

  // 签到类
  {
    id: 'checkin_7',
    name: '铁杆粉丝',
    icon: '🔥',
    desc: '连续签到7天',
    category: 'checkin',
    condition: '连续签到7天',
    rewardPoints: 50,
    check: s => s.consecutiveCheckInDays >= 7,
    getProgress: s => ({ current: Math.min(s.consecutiveCheckInDays, 7), max: 7 }),
  },
  {
    id: 'checkin_30',
    name: '签到达人',
    icon: '💎',
    desc: '连续签到30天',
    category: 'checkin',
    condition: '连续签到30天',
    rewardPoints: 200,
    check: s => s.consecutiveCheckInDays >= 30,
    getProgress: s => ({ current: Math.min(s.consecutiveCheckInDays, 30), max: 30 }),
  },

  // 社交类
  {
    id: 'first_like',
    name: '点赞新手',
    icon: '👍',
    desc: '第一次点赞',
    category: 'social',
    condition: '点赞1次',
    rewardPoints: 5,
    check: s => s.totalLikes >= 1,
    getProgress: s => ({ current: Math.min(s.totalLikes, 1), max: 1 }),
  },
  {
    id: 'first_comment',
    name: '评论新手',
    icon: '💬',
    desc: '第一次评论',
    category: 'social',
    condition: '评论1次',
    rewardPoints: 5,
    check: s => s.totalComments >= 1,
    getProgress: s => ({ current: Math.min(s.totalComments, 1), max: 1 }),
  },
  {
    id: 'followers_10',
    name: '小有人气',
    icon: '👥',
    desc: '获得10个粉丝',
    category: 'social',
    condition: '10个粉丝',
    rewardPoints: 30,
    check: s => s.followers >= 10,
    getProgress: s => ({ current: Math.min(s.followers, 10), max: 10 }),
  },

  // 特殊类
  {
    id: 'points_1000',
    name: '积分达人',
    icon: '💰',
    desc: '累计获得1000积分',
    category: 'special',
    condition: '累计1000积分',
    rewardPoints: 100,
    check: s => s.totalPoints >= 1000,
    getProgress: s => ({ current: Math.min(s.totalPoints, 1000), max: 1000 }),
  },
  {
    id: 'task_1',
    name: '任务新手',
    icon: '📋',
    desc: '完成第一个任务',
    category: 'special',
    condition: '完成1个任务',
    rewardPoints: 20,
    check: s => s.tasksCompleted >= 1,
    getProgress: s => ({ current: Math.min(s.tasksCompleted, 1), max: 1 }),
  },
  {
    id: 'seed-user',
    name: '种子用户',
    icon: '🌱',
    desc: '前10000名注册用户',
    category: 'special',
    condition: '前10000名注册',
    rewardPoints: 200,
    check: () => false, // 注册时自动授予，不在 check 中检测
    getProgress: () => ({ current: 1, max: 1 }),
  },
]

/**
 * 获取用户统计数据
 */
export async function fetchUserStats(userId: string): Promise<UserStats> {
  try {
    const [
      user,
      contents,
      tasks,
    ] = await Promise.all([
      getUserById(userId),
      getContents(1000, 0, undefined, userId),
      getUserTasks(),
    ])

    const completedTasks = (tasks || []).filter((t: any) => t.status === 'completed').length

    // 以下统计需要后端 /api/users/:id/stats 接口支持
    // 目前用可用数据填充，其余返回 0
    return {
      totalPromotes: 0,       // TODO: 后端需提供 /api/users/:id/stats
      contentPublished: (contents || []).length,
      totalLikes: 0,           // TODO
      totalComments: 0,        // TODO
      consecutiveCheckInDays: 0, // TODO: 后端需提供 /api/checkin/streak
      totalCheckInDays: 0,     // TODO
      followers: 0,            // TODO: 后端需提供 /api/follows/counts/:id
      totalPoints: (user as any)?.points || 0,
      tasksCompleted: completedTasks,
      votesParticipated: 0,    // TODO
    }
  } catch {
    return {
      totalPromotes: 0,
      contentPublished: 0,
      totalLikes: 0,
      totalComments: 0,
      consecutiveCheckInDays: 0,
      totalCheckInDays: 0,
      followers: 0,
      totalPoints: 0,
      tasksCompleted: 0,
      votesParticipated: 0,
    }
  }
}

/**
 * 检查并解锁成就
 */
export async function checkAndUnlockAchievements(userId: string): Promise<string[]> {
  const stats = await fetchUserStats(userId)
  const unlockedIds: string[] = []

  for (const achievement of ACHIEVEMENTS) {
    if (achievement.check(stats)) {
      try {
        const result = await unlockAchievement(userId, achievement.id, achievement.rewardPoints)
        if (result) {
          unlockedIds.push(achievement.id)
        }
      } catch {
        // 单个成就解锁失败不影响其他
      }
    }
  }

  return unlockedIds
}

/**
 * 获取成就进度列表
 */
export async function getAchievementProgressList(userId: string) {
  const stats = await fetchUserStats(userId)
  const unlocked = await getUserAchievements(userId)
  const unlockedSet = new Set(unlocked.map(a => a.achievement_id))

  return ACHIEVEMENTS.map(a => ({
    ...a,
    isUnlocked: unlockedSet.has(a.id),
    progress: a.getProgress(stats),
  }))
}
