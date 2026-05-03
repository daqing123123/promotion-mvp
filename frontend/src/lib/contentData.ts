// ===== 内容数据接口 =====

import { type ContentType } from './contentTypes'

export interface Content {
  id: string
  type: ContentType
  title: string
  description: string
  cover: string
  url?: string
  creator: { id: string; name: string; avatar: string; level: number }
  stats: { views: number; likes: number; comments: number; shares: number; favorites: number; promotes: number }
  tags: string[]
  createdAt: number
  renderConfig: { mode: 'card' | 'player' | 'reader' | 'embed' | 'trailer' | 'installable'; detail?: any }
  interactionConfig: { canLike: boolean; canComment: boolean; canShare: boolean; canFavorite: boolean; canPromote: boolean; canRemix: boolean }
}

export function formatStat(num: number): string {
  if (num >= 10000) return (num / 10000).toFixed(1) + '万'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}
