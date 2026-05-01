// ===== 积分等级系统 =====

export function pointsForLevel(level: number): number { return Math.floor(10 * Math.pow(1.08, level - 1)) }

export const LEVEL_TITLES = [
  { min: 1, max: 4, title: '泡沫', color: 'text-gray-400' },
  { min: 5, max: 9, title: '水滴', color: 'text-blue-400' },
  { min: 10, max: 14, title: '小浪花', color: 'text-cyan-400' },
  { min: 15, max: 19, title: '浪里白条', color: 'text-teal-400' },
  { min: 20, max: 29, title: '中流击水', color: 'text-green-400' },
  { min: 30, max: 39, title: '乘风破浪', color: 'text-emerald-400' },
  { min: 40, max: 49, title: '浪尖舞者', color: 'text-amber-400' },
  { min: 50, max: 59, title: '巨浪行者', color: 'text-orange-400' },
  { min: 60, max: 69, title: '潮汐大师', color: 'text-red-400' },
  { min: 70, max: 79, title: '风暴领主', color: 'text-rose-400' },
  { min: 80, max: 89, title: '海洋之王', color: 'text-purple-400' },
  { min: 90, max: 100, title: '传奇巨浪', color: 'text-amber-500' },
]

export function getLevelTitle(level: number): string { return LEVEL_TITLES.find(t => level >= t.min && level <= t.max)?.title || '泡沫' }
export function getLevelColor(level: number): string { return LEVEL_TITLES.find(t => level >= t.min && level <= t.max)?.color || 'text-gray-400' }
export function getLevelBadge(level: number): string {
  if (level >= 90) return '🌊'; if (level >= 80) return '👑'; if (level >= 70) return '⚡'; if (level >= 60) return '🔥'
  if (level >= 50) return '💪'; if (level >= 40) return '✨'; if (level >= 30) return '🚀'; if (level >= 20) return '⭐'
  if (level >= 10) return '💎'; if (level >= 5) return '💧'; return '🫧'
}

export interface SpendAction { id: string; name: string; description: string; cost: number; icon: string; category: 'promote' | 'boost' | 'feature' }

export const SPEND_ACTIONS: SpendAction[] = [
  { id: 'wave-small', name: '发起小浪', description: '基础推广', cost: 100, icon: '🌊', category: 'promote' },
  { id: 'wave-medium', name: '发起中浪', description: '中等推广', cost: 300, icon: '🌊', category: 'promote' },
  { id: 'wave-large', name: '发起巨浪', description: '大规模推广', cost: 800, icon: '🌊', category: 'promote' },
  { id: 'boost-small', name: '曝光加速', description: '24h曝光翻倍', cost: 50, icon: '🚀', category: 'boost' },
  { id: 'boost-large', name: '强力曝光', description: '72h曝光x3', cost: 200, icon: '🚀', category: 'boost' },
  { id: 'double-points', name: '积分翻倍', description: '24h积分翻倍', cost: 80, icon: '✖️', category: 'boost' },
  { id: 'pin', name: '置顶', description: '置顶24小时', cost: 150, icon: '📌', category: 'feature' },
  { id: 'exclusive-tag', name: '专属标签', description: '专属标识', cost: 500, icon: '🏷️', category: 'feature' },
  { id: 'priority-review', name: '优先审核', description: '内容优先审核', cost: 60, icon: '⚡', category: 'feature' },
]

export interface EarnRule { id: string; name: string; points: number; icon: string; description: string }

export const EARN_RULES: EarnRule[] = [
  { id: 'promote', name: '推广内容', points: 10, icon: '📢', description: '每次推广获得10积分' },
  { id: 'exposure-bonus', name: '曝光奖励', points: 5, icon: '👁️', description: '每1000次曝光获得5积分' },
  { id: 'viral-bonus', name: '爆款奖励', points: 100, icon: '🔥', description: '内容成为爆款获得100积分' },
  { id: 'daily-checkin', name: '每日签到', points: 5, icon: '📅', description: '每天签到获得5积分' },
  { id: 'create-meme', name: '造梗', points: 15, icon: '💡', description: '每次造梗获得15积分' },
  { id: 'remix', name: '二创', points: 20, icon: '🔄', description: '每次二创获得20积分' },
]

export function getLevelProgress(currentPoints: number, currentLevel: number) {
  const nextLevelPoints = pointsForLevel(currentLevel + 1)
  return { currentLevelPoints: pointsForLevel(currentLevel), nextLevelPoints, progress: Math.min(100, (currentPoints / nextLevelPoints) * 100) }
}

export const MOCK_USER = { id: 'u001', name: '摆摊青年', avatar: '🏪', level: 15, points: 1250, totalPoints: 5000, title: getLevelTitle(15), badge: getLevelBadge(15) }
