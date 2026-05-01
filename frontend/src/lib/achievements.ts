// ===== 成就系统 =====

export interface Achievement {
  id: string
  name: string
  icon: string
  desc: string
  category: 'discover' | 'promote' | 'create' | 'wave' | 'fan' | 'special'
  condition: string
  check: (stats: UserStats) => boolean
}

export interface UserStats {
  totalOpens: number
  totalPromotes: number
  totalPromoteHits: number
  promoteHitRate: number
  rareFinds: number
  epicFinds: number
  legendaryFinds: number
  contentPublished: number
  wavesCreated: { tsunami: number; big: number; medium: number; small: number }
  wavesParticipated: number
  totalExposureContributed: number
  streak: number
  fanPromotes: number  // 为偶像发起的推广次数
  fanBoosts: number    // 带动的帮推人数
}

export const ACHIEVEMENTS: Achievement[] = [
  // 发现类
  { id: 'first_open', name: '初来乍到', icon: '📦', desc: '第一次拆盲盒', category: 'discover', condition: '拆开1个盲盒', check: s => s.totalOpens >= 1 },
  { id: 'open_10', name: '盲盒爱好者', icon: '🎁', desc: '累计拆开10个盲盒', category: 'discover', condition: '拆开10个盲盒', check: s => s.totalOpens >= 10 },
  { id: 'open_100', name: '盲盒大师', icon: '🏆', desc: '累计拆开100个盲盒', category: 'discover', condition: '拆开100个盲盒', check: s => s.totalOpens >= 100 },
  { id: 'rare_hunter', name: '稀有猎手', icon: '💙', desc: '发现5个稀有内容', category: 'discover', condition: '发现5个稀有', check: s => s.rareFinds >= 5 },
  { id: 'epic_hunter', name: '史诗猎手', icon: '💜', desc: '发现3个史诗内容', category: 'discover', condition: '发现3个史诗', check: s => s.epicFinds >= 3 },
  { id: 'legend_hunter', name: '传说猎手', icon: '👑', desc: '发现1个传说内容', category: 'discover', condition: '发现1个传说', check: s => s.legendaryFinds >= 1 },

  // 推广类
  { id: 'first_promote', name: '初试身手', icon: '🌱', desc: '第一次帮推', category: 'promote', condition: '帮推1次', check: s => s.totalPromotes >= 1 },
  { id: 'promote_10', name: '推广达人', icon: '🔥', desc: '累计帮推10次', category: 'promote', condition: '帮推10次', check: s => s.totalPromotes >= 10 },
  { id: 'promote_50', name: '推广大师', icon: '🏅', desc: '累计帮推50次', category: 'promote', condition: '帮推50次', check: s => s.totalPromotes >= 50 },
  { id: 'promote_hit', name: '星探之眼', icon: '🔭', desc: '帮推命中率超过60%', category: 'promote', condition: '命中率>60%', check: s => s.promoteHitRate >= 0.6 },
  { id: 'viral', name: '病毒传播', icon: '⚡', desc: '帮推的话题达到100+曝光', category: 'promote', condition: '100+曝光', check: s => s.totalExposureContributed >= 100 },

  // 造浪类
  { id: 'first_wave', name: '试水者', icon: '🌊', desc: '第一次发起推广', category: 'wave', condition: '发起1次推广', check: s => (s.wavesCreated.small + s.wavesCreated.medium + s.wavesCreated.big + s.wavesCreated.tsunami) >= 1 },
  { id: 'medium_wave', name: '中浪操盘', icon: '🌊🌊', desc: '发起的推广达到中浪', category: 'wave', condition: '中浪1次', check: s => s.wavesCreated.medium >= 1 },
  { id: 'big_wave', name: '巨浪制造者', icon: '🌊🌊🌊', desc: '发起的推广达到巨浪', category: 'wave', condition: '巨浪1次', check: s => s.wavesCreated.big >= 1 },
  { id: 'tsunami', name: '浪潮之王', icon: '🌊🌊🌊🌊', desc: '发起的推广达到海啸', category: 'wave', condition: '海啸1次', check: s => s.wavesCreated.tsunami >= 1 },
  { id: 'wave_master', name: '连续造浪', icon: '🔥', desc: '发起3个中浪以上推广', category: 'wave', condition: '3个中浪+', check: s => (s.wavesCreated.medium + s.wavesCreated.big + s.wavesCreated.tsunami) >= 3 },

  // 创作类
  { id: 'first_content', name: '创作者', icon: '✍️', desc: '第一次发布内容', category: 'create', condition: '发布1条', check: s => s.contentPublished >= 1 },
  { id: 'content_10', name: '内容达人', icon: '📝', desc: '发布10条内容', category: 'create', condition: '发布10条', check: s => s.contentPublished >= 10 },
  { id: 'content_50', name: '内容大师', icon: '📚', desc: '发布50条内容', category: 'create', condition: '发布50条', check: s => s.contentPublished >= 50 },

  // 粉丝类
  { id: 'first_fan_promote', name: '路人粉', icon: '👋', desc: '第一次为偶像发起推广', category: 'fan', condition: '为偶像推广1次', check: s => s.fanPromotes >= 1 },
  { id: 'fan_10', name: '忠实粉', icon: '❤️', desc: '为偶像发起10次推广', category: 'fan', condition: '为偶像推广10次', check: s => s.fanPromotes >= 10 },
  { id: 'fan_leader', name: '粉丝团长', icon: '👑', desc: '带动100人帮推', category: 'fan', condition: '带动100人帮推', check: s => s.fanBoosts >= 100 },

  // 特殊
  { id: 'streak_7', name: '坚持不懈', icon: '🔥', desc: '连续活跃7天', category: 'special', condition: '连续7天', check: s => s.streak >= 7 },
  { id: 'streak_30', name: '铁杆用户', icon: '💎', desc: '连续活跃30天', category: 'special', condition: '连续30天', check: s => s.streak >= 30 },
  { id: 'wave_participant_10', name: '造浪参与者', icon: '🏄', desc: '参与10次巨浪/中浪推广', category: 'special', condition: '参与10次浪潮', check: s => s.wavesParticipated >= 10 },
]

/**
 * 检查用户解锁了哪些成就
 */
export function checkAchievements(stats: UserStats): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.check(stats))
}

/**
 * 获取成就进度
 */
export function getAchievementProgress(id: string, stats: UserStats): number {
  const achievement = ACHIEVEMENTS.find(a => a.id === id)
  if (!achievement) return 0
  if (achievement.check(stats)) return 100

  // 根据不同成就计算进度
  switch (id) {
    case 'first_open': return Math.min(100, stats.totalOpens * 100)
    case 'open_10': return Math.min(100, (stats.totalOpens / 10) * 100)
    case 'open_100': return Math.min(100, (stats.totalOpens / 100) * 100)
    case 'rare_hunter': return Math.min(100, (stats.rareFinds / 5) * 100)
    case 'epic_hunter': return Math.min(100, (stats.epicFinds / 3) * 100)
    case 'legend_hunter': return Math.min(100, stats.legendaryFinds * 100)
    case 'first_promote': return Math.min(100, stats.totalPromotes * 100)
    case 'promote_10': return Math.min(100, (stats.totalPromotes / 10) * 100)
    case 'promote_50': return Math.min(100, (stats.totalPromotes / 50) * 100)
    case 'first_content': return Math.min(100, stats.contentPublished * 100)
    case 'content_10': return Math.min(100, (stats.contentPublished / 10) * 100)
    case 'content_50': return Math.min(100, (stats.contentPublished / 50) * 100)
    case 'streak_7': return Math.min(100, (stats.streak / 7) * 100)
    case 'streak_30': return Math.min(100, (stats.streak / 30) * 100)
    case 'wave_participant_10': return Math.min(100, (stats.wavesParticipated / 10) * 100)
    default: return 0
  }
}
