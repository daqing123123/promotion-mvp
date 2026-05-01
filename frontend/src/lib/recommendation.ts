// ===== 品类定义 =====
export type Category = 'movie' | 'tvshow' | 'book' | 'game' | 'music' | 'concert' | 'product' | 'person' | 'content'

export const CATEGORY_INFO: Record<Category, { label: string; icon: string }> = {
  movie:   { label: '电影', icon: '🎬' },
  tvshow:  { label: '电视剧', icon: '📺' },
  book:    { label: '书籍', icon: '📖' },
  game:    { label: '游戏', icon: '🎮' },
  music:   { label: '音乐', icon: '🎵' },
  concert: { label: '演唱会', icon: '🎤' },
  product: { label: '产品', icon: '📦' },
  person:  { label: '人物', icon: '👤' },
  content: { label: '内容', icon: '📝' },
}

// ===== 推荐内容 =====
export interface RecommendableItem {
  id: string
  category: Category
  title: string
  description: string
  tags: string[]
  creator: { id: string; name: string; avatar: string; level: number; followerCount: number }
  rarity: 'common' | 'rare' | 'epic' | 'legendary'

  // 通用互动数据
  stats: {
    views: number
    likes: number
    promotes: number
    shares: number
    comments: number
    favorites: number
    completions: number  // 完播/完读次数
  }

  // 推广相关
  isBlindBox?: boolean
  promoTopic?: {
    category: Category
    targetName: string
    targetDesc: string
    rewardPool: number
    promoterCount: number
    totalExposure: number
    waveLevel: number  // 浪级 0-4
    daysLeft: number
    createdBy: string
  }

  // 时间
  createdAt: number  // timestamp
}

// ===== 用户行为 =====
export interface UserProfile {
  id: string
  name: string
  avatar: string

  // 价值体系
  valueScore: number
  discoverScore: number   // 发现分
  promoteScore: number    // 推广分
  createScore: number     // 创作分
  influenceScore: number  // 影响分

  // 浪统计
  wavesCreated: { tsunami: number; big: number; medium: number; small: number }
  wavesParticipated: number
  totalExposureContributed: number

  // 推广命中
  promoteHitRate: number  // 0-1
  rareFinds: number

  // 等级
  title: { name: string; icon: string; level: number }
  levelPath: 'scout' | 'creator' | 'wavemaker' | 'fanleader'
  levelProgress: number

  // 偏好
  categoryPreference: Record<Category, number>
  tagPreference: string[]

  // 成就
  achievements: string[]

  // 收藏
  favorites: { category: Category; itemId: string; title: string }[]

  // 统计
  totalOpens: number
  streak: number
  followers: number
  following: number
}

// ===== 推荐算法 =====

/**
 * 计算内容质量分 (0-100)
 */
export function calcQualityScore(item: RecommendableItem): number {
  const { stats } = item
  const totalViews = Math.max(stats.views, 1)

  // 互动率
  const likeRate = stats.likes / totalViews
  const promoteRate = stats.promotes / totalViews
  const shareRate = stats.shares / totalViews
  const favoriteRate = stats.favorites / totalViews
  const commentRate = stats.comments / totalViews
  const completionRate = stats.completions / totalViews

  // 加权质量分
  const score =
    completionRate * 30 +
    likeRate * 25 +
    promoteRate * 25 +
    favoriteRate * 10 +
    shareRate * 5 +
    commentRate * 5

  return Math.min(100, score * 1000)  // 归一化到 0-100
}

/**
 * 计算用户匹配分 (0-100)
 */
export function calcUserMatch(item: RecommendableItem, user: UserProfile | null): number {
  if (!user) return 50  // 未登录给默认分

  // 品类偏好匹配
  const catPref = user.categoryPreference[item.category] || 0
  const catScore = catPref * 40

  // 标签匹配
  const itemTags = new Set(item.tags)
  const matchedTags = user.tagPreference.filter(t => itemTags.has(t))
  const tagScore = (matchedTags.length / Math.max(user.tagPreference.length, 1)) * 40

  // 创作者等级匹配（普通用户偏好同等级创作者）
  const levelDiff = Math.abs(item.creator.level - (user.title?.level || 1))
  const levelScore = Math.max(0, 20 - levelDiff * 5)

  return Math.min(100, catScore + tagScore + levelScore)
}

/**
 * 计算帮推热度分 (0-100)
 */
export function calcPromoteScore(item: RecommendableItem): number {
  if (!item.promoTopic) return 0

  const p = item.promoTopic
  const waveScore = p.waveLevel * 20  // 浪级 0-4 → 0-80
  const exposureScore = Math.min(20, p.totalExposure / 500)  // 曝光封顶20

  return Math.min(100, waveScore + exposureScore)
}

/**
 * 计算新鲜度分 (0-100)
 */
export function calcFreshnessScore(item: RecommendableItem): number {
  const ageHours = (Date.now() - item.createdAt) / (1000 * 60 * 60)

  if (ageHours < 24) return 100      // 24小时内：满分
  if (ageHours < 72) return 80       // 3天内：80分
  if (ageHours < 168) return 60      // 7天内：60分
  if (ageHours < 720) return 40      // 30天内：40分
  return 20                           // 30天后：20分
}

/**
 * 计算新创作者加权 (0-20 额外加分)
 */
export function calcNewCreatorBonus(item: RecommendableItem): number {
  const followers = item.creator.followerCount

  // 粉丝 < 100 的创作者获得加权
  if (followers < 100) return 20
  if (followers < 1000) return 15
  if (followers < 10000) return 10
  if (followers < 100000) return 5
  return 0  // 大V不额外加权（反马太效应）
}

/**
 * 综合推荐分
 * 推荐分 = 内容质量 × 40% + 用户匹配 × 30% + 帮推热度 × 20% + 新鲜度 × 10% + 新创作者加权
 */
export function calcRecommendScore(item: RecommendableItem, user: UserProfile | null): number {
  const quality = calcQualityScore(item) * 0.4
  const match = calcUserMatch(item, user) * 0.3
  const promote = calcPromoteScore(item) * 0.2
  const freshness = calcFreshnessScore(item) * 0.1
  const newBonus = calcNewCreatorBonus(item)

  return quality + match + promote + freshness + newBonus
}

/**
 * 推荐排序
 */
export function recommendSort(items: RecommendableItem[], user: UserProfile | null): RecommendableItem[] {
  return [...items].sort((a, b) => calcRecommendScore(b, user) - calcRecommendScore(a, user))
}
