// ===== 价值分 & 等级系统 =====

export interface ValueBreakdown {
  total: number
  discover: number   // 发现分
  promote: number    // 推广分
  create: number     // 创作分
  influence: number  // 影响分
}

export type LevelPath = 'scout' | 'creator' | 'wavemaker' | 'fanleader'

export interface Level {
  name: string
  icon: string
  min: number
  path: LevelPath
}

// 四条成长路径
export const LEVEL_PATHS: Record<LevelPath, { name: string; icon: string; levels: Level[] }> = {
  scout: {
    name: '星探之路',
    icon: '🔍',
    levels: [
      { name: '萌新探员', icon: '🔍', min: 0, path: 'scout' },
      { name: '初级星探', icon: '⭐', min: 10, path: 'scout' },
      { name: '内容猎手', icon: '🎯', min: 50, path: 'scout' },
      { name: '爆款推手', icon: '🔥', min: 100, path: 'scout' },
      { name: '发现大师', icon: '💎', min: 200, path: 'scout' },
      { name: '传奇星探', icon: '👑', min: 500, path: 'scout' },
    ],
  },
  creator: {
    name: '创作者之路',
    icon: '✍️',
    levels: [
      { name: '记录者', icon: '📝', min: 0, path: 'creator' },
      { name: '分享者', icon: '📖', min: 10, path: 'creator' },
      { name: '创意达人', icon: '🎨', min: 50, path: 'creator' },
      { name: '内容大师', icon: '📚', min: 200, path: 'creator' },
      { name: '创作传奇', icon: '👑', min: 500, path: 'creator' },
    ],
  },
  wavemaker: {
    name: '造浪者之路',
    icon: '🌊',
    levels: [
      { name: '试水者', icon: '💧', min: 0, path: 'wavemaker' },
      { name: '小浪推手', icon: '🌊', min: 3, path: 'wavemaker' },
      { name: '中浪操盘', icon: '🌊🌊', min: 10, path: 'wavemaker' },
      { name: '巨浪制造者', icon: '🌊🌊🌊', min: 30, path: 'wavemaker' },
      { name: '浪潮之王', icon: '🌊🌊🌊🌊', min: 100, path: 'wavemaker' },
    ],
  },
  fanleader: {
    name: '粉丝领袖之路',
    icon: '❤️',
    levels: [
      { name: '路人粉', icon: '👋', min: 0, path: 'fanleader' },
      { name: '忠实粉', icon: '❤️', min: 10, path: 'fanleader' },
      { name: '粉丝团长', icon: '⭐', min: 50, path: 'fanleader' },
      { name: '粉丝领袖', icon: '👑', min: 200, path: 'fanleader' },
      { name: '超级后援', icon: '💎', min: 500, path: 'fanleader' },
    ],
  },
}

/**
 * 计算价值分
 */
export function calcValueScore(data: {
  promoteHits: number
  wavesCreated: number
  wavesParticipated: number
  totalExposureContributed: number
  contentInteractions: number
  followers: number
  followerActivity: number
}): ValueBreakdown {
  const discover = data.promoteHits * 10
  const promote = data.wavesCreated * 100 + data.wavesParticipated * 5 + data.totalExposureContributed * 0.1
  const create = data.contentInteractions * 0.5
  const influence = data.followers * 2 + data.followerActivity * 10

  return {
    total: Math.round(discover + promote + create + influence),
    discover: Math.round(discover),
    promote: Math.round(promote),
    create: Math.round(create),
    influence: Math.round(influence),
  }
}

/**
 * 获取当前等级
 */
export function getLevel(path: LevelPath, progress: number): Level {
  const levels = LEVEL_PATHS[path].levels
  for (let i = levels.length - 1; i >= 0; i--) {
    if (progress >= levels[i].min) return levels[i]
  }
  return levels[0]
}

/**
 * 获取下一等级
 */
export function getNextLevel(path: LevelPath, progress: number): Level | null {
  const levels = LEVEL_PATHS[path].levels
  for (const level of levels) {
    if (progress < level.min) return level
  }
  return null  // 已满级
}

/**
 * 计算等级进度百分比
 */
export function getLevelProgress(path: LevelPath, progress: number): number {
  const current = getLevel(path, progress)
  const next = getNextLevel(path, progress)
  if (!next) return 100

  const range = next.min - current.min
  const done = progress - current.min
  return Math.min(100, Math.round((done / range) * 100))
}
