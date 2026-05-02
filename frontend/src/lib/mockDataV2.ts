// ===== Mock 数据 V2 =====

import { type Content } from './contentData'
import { type ContentType } from './contentTypes'

const COVERS = [
  '/placeholder-1.svg',
  '/placeholder-2.svg',
  '/placeholder-3.svg',
]

const CREATORS = [
  { id: 'u001', name: '摆摊青年', avatar: '🏪', level: 15 },
  { id: 'u002', name: '效率达人', avatar: '🎧', level: 22 },
  { id: 'u003', name: '影视观察', avatar: '🎬', level: 18 },
  { id: 'u004', name: '音乐拾荒者', avatar: '🎵', level: 25 },
  { id: 'u005', name: '好物发现', avatar: '📦', level: 20 },
]

function randomPick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function randomInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min }

export function makeContent(type?: ContentType): Content {
  const t = type || randomPick(['video', 'image', 'software', 'skill', 'agent', 'product'] as ContentType[])
  return {
    id: `content-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: t,
    title: `${t === 'video' ? '凌晨三点的城市' : t === 'product' ? '国产平替耳机' : t === 'software' ? '效率工具推荐' : '内容标题'}`,
    description: '用镜头讲述故事，记录城市的另一面',
    cover: randomPick(COVERS),
    creator: randomPick(CREATORS),
    stats: { views: randomInt(100, 100000), likes: randomInt(10, 10000), comments: randomInt(5, 5000), shares: randomInt(1, 2000), favorites: randomInt(10, 8000) },
    tags: ['生活', '记录', '城市'],
    createdAt: Date.now() - randomInt(0, 7 * 86400000),
    renderConfig: { mode: t === 'video' ? 'player' : t === 'software' ? 'installable' : 'card' },
    interactionConfig: { canLike: true, canComment: true, canShare: true, canFavorite: true, canPromote: true, canRemix: t === 'video' || t === 'image' },
  }
}

export function makeContentFeedBatch(count: number): Content[] {
  return Array.from({ length: count }, () => makeContent())
}
