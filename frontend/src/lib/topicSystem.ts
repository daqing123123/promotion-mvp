// ===== 话题系统 =====

export type TopicType = 'product-review' | 'movie-discussion' | 'person-topic' | 'open-discussion' | 'challenge'
export type TopicStatus = 'active' | 'hot' | 'ending-soon' | 'ended'

export interface Topic {
  id: string; type: TopicType; title: string; description: string
  creatorId: string; creatorName: string; creatorAvatar: string; creatorType: 'brand' | 'individual'
  status: TopicStatus; deadline?: number; rewardPool: number; rewards?: { rank: number; reward: string }[]
  stats: { memeCount: number; totalViews: number; participantCount: number; hotScore: number }
  createdAt: number
}

export const TOPIC_TYPES: Record<TopicType, { type: TopicType; label: string; icon: string; color: string }> = {
  'product-review': { type: 'product-review', label: '产品测评', icon: '📱', color: 'bg-blue-100 text-blue-600' },
  'movie-discussion': { type: 'movie-discussion', label: '影视讨论', icon: '🎬', color: 'bg-purple-100 text-purple-600' },
  'person-topic': { type: 'person-topic', label: '人物话题', icon: '👤', color: 'bg-green-100 text-green-600' },
  'open-discussion': { type: 'open-discussion', label: '开放讨论', icon: '💡', color: 'bg-amber-100 text-amber-600' },
  'challenge': { type: 'challenge', label: '挑战赛', icon: '🏆', color: 'bg-red-100 text-red-600' },
}

export const TOPIC_STATUS_CONFIG: Record<TopicStatus, { label: string; color: string }> = {
  active: { label: '进行中', color: 'bg-green-100 text-green-600' },
  hot: { label: '热门', color: 'bg-red-100 text-red-600' },
  'ending-soon': { label: '即将截止', color: 'bg-yellow-100 text-yellow-600' },
  ended: { label: '已结束', color: 'bg-gray-100 text-gray-500' },
}

export function getTopicTypeConfig(type: TopicType) { return TOPIC_TYPES[type] }
export function getStatusConfig(status: TopicStatus) { return TOPIC_STATUS_CONFIG[status] }
export function formatTopicStats(num: number): string {
  if (num >= 10000) return (num / 10000).toFixed(1) + '万'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}
export function getHotScoreColor(score: number): string {
  if (score >= 90) return 'text-red-500'; if (score >= 70) return 'text-orange-500'; if (score >= 50) return 'text-yellow-500'; return 'text-gray-500'
}

export const MOCK_TOPICS: Topic[] = [
  { id: 'topic-001', type: 'person-topic', title: '街头歌手老张：唱了20年，为什么没人知道？', description: '在天桥下唱了20年，路人以为是原唱。这样的人该不该被看见？', creatorId: 'u001', creatorName: '音乐拾荒者', creatorAvatar: '🎵', creatorType: 'individual', status: 'hot', deadline: Date.now() + 7 * 86400000, rewardPool: 500, stats: { memeCount: 67, totalViews: 230000, participantCount: 52, hotScore: 95 }, createdAt: Date.now() - 86400000 },
  { id: 'topic-002', type: 'product-review', title: '这款耳机200块，真的能吊打千元大牌吗？', description: '最近很多人说国产平替耳机音质吊打大牌，是真的吗？', creatorId: 'u002', creatorName: '效率达人', creatorAvatar: '🎧', creatorType: 'individual', status: 'active', deadline: Date.now() + 5 * 86400000, rewardPool: 200, stats: { memeCount: 23, totalViews: 56000, participantCount: 18, hotScore: 72 }, createdAt: Date.now() - 172800000 },
  { id: 'topic-003', type: 'movie-discussion', title: '如果这个演员演古装剧，会是什么效果？', description: '最近他在现代剧里演技炸裂，如果给他一个古装角色，你觉得会怎样？', creatorId: 'u003', creatorName: '影视观察', creatorAvatar: '🎬', creatorType: 'individual', status: 'hot', deadline: Date.now() + 10 * 86400000, rewardPool: 300, stats: { memeCount: 45, totalViews: 120000, participantCount: 35, hotScore: 88 }, createdAt: Date.now() - 259200000 },
  { id: 'topic-004', type: 'challenge', title: '#10元挑战：10块钱在城中村能吃什么？', description: '挑战用10块钱在城中村吃撑，拍下你的成果！', creatorId: 'u001', creatorName: '摆摊青年', creatorAvatar: '🏪', creatorType: 'individual', status: 'active', deadline: Date.now() + 3 * 86400000, rewardPool: 150, stats: { memeCount: 31, totalViews: 89000, participantCount: 24, hotScore: 78 }, createdAt: Date.now() - 345600000 },
  { id: 'topic-005', type: 'open-discussion', title: '国产平替时代：你用过哪些真香的国产替代？', description: '从耳机到护肤品，国产平替越来越多。分享你用过最真香的国产替代！', creatorId: 'u005', creatorName: '好物发现', creatorAvatar: '📦', creatorType: 'brand', status: 'hot', deadline: Date.now() + 14 * 86400000, rewardPool: 400, stats: { memeCount: 56, totalViews: 180000, participantCount: 42, hotScore: 82 }, createdAt: Date.now() - 432000000 },
]
