// ===== 等级系统 =====
// 指数增长，100级 = 不可能完成的任务

// 每级所需经验：base * multiplier^(level-1)
// 1级→2级：10 XP
// 10级：~26 XP（累计 ~160）
// 25级：~92 XP（累计 ~1,600）
// 50级：~2,890 XP（累计 ~90,000）
// 75级：~90,900 XP（累计 ~5,700,000）
// 90级：~1,070,000 XP（累计 ~120,000,000）
// 99级：~31,500,000 XP（累计 ~7,000,000,000）
// 100级：不可达

const BASE_XP = 10
const MULTIPLIER = 1.15

// 升到指定级需要的总经验
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  let total = 0
  for (let i = 1; i < level; i++) {
    total += Math.floor(BASE_XP * Math.pow(MULTIPLIER, i - 1))
  }
  return total
}

// 升一级需要的经验
export function xpForNextLevel(currentLevel: number): number {
  return Math.floor(BASE_XP * Math.pow(MULTIPLIER, currentLevel - 1))
}

// 根据总经验算等级
export function levelFromXP(experience: number): number {
  let level = 1
  let totalRequired = 0
  for (let i = 1; i <= 100; i++) {
    const needed = Math.floor(BASE_XP * Math.pow(MULTIPLIER, i - 1))
    totalRequired += needed
    if (experience >= totalRequired) {
      level = i
    } else {
      break
    }
  }
  return Math.min(level, 100)
}

// 当前等级进度（0~1）
export function levelProgress(experience: number, currentLevel: number): number {
  if (currentLevel >= 100) return 1
  const currentTotal = xpForLevel(currentLevel)
  const nextTotal = xpForLevel(currentLevel + 1)
  const progress = (experience - currentTotal) / (nextTotal - currentTotal)
  return Math.max(0, Math.min(1, progress))
}

// 等级称号
export function levelTitle(level: number): string {
  if (level >= 90) return '🌊 传奇'
  if (level >= 75) return '⭐ 大师'
  if (level >= 60) return '💎 精英'
  if (level >= 45) return '🏆 高手'
  if (level >= 30) return '🔥 达人'
  if (level >= 20) return '🚀 活跃'
  if (level >= 10) return '🌱 成长'
  if (level >= 5) return '✨ 新星'
  return '👤 新手'
}

// 等级颜色（Tailwind class）
export function levelColor(level: number): string {
  if (level >= 90) return 'text-yellow-400'
  if (level >= 75) return 'text-purple-400'
  if (level >= 60) return 'text-blue-400'
  if (level >= 45) return 'text-cyan-400'
  if (level >= 30) return 'text-orange-400'
  if (level >= 20) return 'text-green-400'
  if (level >= 10) return 'text-emerald-400'
  return 'text-gray-400'
}

// 等级进度条颜色
export function levelBarColor(level: number): string {
  if (level >= 90) return 'bg-gradient-to-r from-yellow-500 to-amber-400'
  if (level >= 75) return 'bg-gradient-to-r from-purple-500 to-pink-400'
  if (level >= 60) return 'bg-gradient-to-r from-blue-500 to-cyan-400'
  if (level >= 45) return 'bg-gradient-to-r from-cyan-500 to-teal-400'
  if (level >= 30) return 'bg-gradient-to-r from-orange-500 to-yellow-400'
  if (level >= 20) return 'bg-gradient-to-r from-green-500 to-emerald-400'
  if (level >= 10) return 'bg-gradient-to-r from-emerald-500 to-green-400'
  return 'bg-gradient-to-r from-gray-500 to-gray-400'
}

// 格式化 XP 数字
export function formatXP(xp: number): string {
  if (xp >= 1000000000) return (xp / 1000000000).toFixed(1) + 'B'
  if (xp >= 1000000) return (xp / 1000000).toFixed(1) + 'M'
  if (xp >= 1000) return (xp / 1000).toFixed(1) + 'K'
  return xp.toString()
}

// 升级奖励积分
export function levelUpReward(newLevel: number): number {
  if (newLevel >= 90) return 5000
  if (newLevel >= 75) return 2000
  if (newLevel >= 60) return 1000
  if (newLevel >= 45) return 500
  if (newLevel >= 30) return 300
  if (newLevel >= 20) return 200
  if (newLevel >= 10) return 100
  if (newLevel >= 5) return 50
  return 20
}

// 生成等级预览表（用于展示）
export function generateLevelTable(): { level: number; xpNeeded: number; totalXP: number; title: string }[] {
  const table = []
  const milestones = [1, 2, 3, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 85, 90, 95, 99, 100]
  for (const level of milestones) {
    table.push({
      level,
      xpNeeded: xpForNextLevel(level),
      totalXP: xpForLevel(level),
      title: levelTitle(level),
    })
  }
  return table
}
