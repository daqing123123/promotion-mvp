// ===== 梗系统 =====

export type MemeStatus = 'draft' | 'reviewing' | 'published' | 'viral' | 'archived'

export interface Meme {
  id: string
  type: 'text' | 'image' | 'hashtag'
  title: string
  content: string
  hashtags: string[]
  status: MemeStatus
  stats: { views: number; likes: number; comments: number; shares: number; remixes: number; viralScore: number }
  createdAt: number
  creatorId: string
  creatorName: string
  topicId?: string
  parentId?: string
}

export const STATUS_COLORS: Record<MemeStatus, string> = {
  draft: 'bg-gray-100 text-gray-500', reviewing: 'bg-yellow-100 text-yellow-600', published: 'bg-green-100 text-green-600', viral: 'bg-red-100 text-red-600', archived: 'bg-gray-100 text-gray-400',
}

export const STATUS_LABELS: Record<MemeStatus, string> = {
  draft: '草稿', reviewing: '审核中', published: '已发布', viral: '爆款', archived: '已归档',
}

export function getStatusColor(status: MemeStatus): string { return STATUS_COLORS[status] }
export function getStatusLabel(status: MemeStatus): string { return STATUS_LABELS[status] }
export function formatStat(num: number): string {
  if (num >= 10000) return (num / 10000).toFixed(1) + '万'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}

export const MOCK_MEMES: Meme[] = [
  { id: 'meme-001', type: 'text', title: '老张唱歌，路人以为是原唱', content: '在天桥下唱了20年，路人以为是原唱。这样的人该不该被看见？', hashtags: ['街头歌手', '被低估', '音乐梦想'], status: 'viral', stats: { views: 150000, likes: 12000, comments: 800, shares: 3000, remixes: 45, viralScore: 95 }, createdAt: Date.now() - 86400000, creatorId: 'u001', creatorName: '摆摊青年', topicId: 'topic-001' },
  { id: 'meme-002', type: 'image', title: '天桥歌神の日常', content: '一张老张在天桥下唱歌的照片', hashtags: ['天桥歌神', '坚持'], status: 'published', stats: { views: 50000, likes: 4500, comments: 300, shares: 1200, remixes: 20, viralScore: 78 }, createdAt: Date.now() - 172800000, creatorId: 'u002', creatorName: '效率达人', topicId: 'topic-001' },
  { id: 'meme-003', type: 'hashtag', title: '#街头歌手老张', content: '老张的故事值得被看见', hashtags: ['街头歌手老张', '被低估的才华'], status: 'published', stats: { views: 80000, likes: 6000, comments: 500, shares: 2000, remixes: 30, viralScore: 82 }, createdAt: Date.now() - 259200000, creatorId: 'u003', creatorName: '影视观察', topicId: 'topic-001' },
  { id: 'meme-004', type: 'text', title: '国产耳机吊打大牌？', content: '200块的耳机，音质真的能吊打千元大牌？', hashtags: ['国产平替', '耳机评测'], status: 'published', stats: { views: 30000, likes: 2500, comments: 200, shares: 800, remixes: 15, viralScore: 65 }, createdAt: Date.now() - 345600000, creatorId: 'u004', creatorName: '音乐拾荒者', topicId: 'topic-002' },
  { id: 'meme-005', type: 'text', title: '10元挑战成果', content: '在城中村花了10块钱，吃了三样东西，还打包了！', hashtags: ['10元挑战', '城中村美食'], status: 'viral', stats: { views: 200000, likes: 15000, comments: 1200, shares: 5000, remixes: 60, viralScore: 98 }, createdAt: Date.now() - 432000000, creatorId: 'u005', creatorName: '好物发现', topicId: 'topic-004' },
]
