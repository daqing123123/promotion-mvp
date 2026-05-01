// ===== 内容类型定义 =====

export type ContentType = 
  | 'video' 
  | 'image' 
  | 'article' 
  | 'content'
  | 'software' 
  | 'skill' 
  | 'agent' 
  | 'product' 
  | 'game' 
  | 'movie' 
  | 'music' 
  | 'drama' 
  | 'person' 
  | 'live' 
  | 'card' 
  | 'blindbox'

export interface ContentTypeConfig {
  type: ContentType
  label: string
  icon: string
  description: string
  color: string
  gradient: string
}

export const CONTENT_TYPES: Record<ContentType, ContentTypeConfig> = {
  video: { type: 'video', label: '视频', icon: '🎬', description: '短视频、Vlog、教程', color: 'text-red-500', gradient: 'from-red-500 to-orange-500' },
  image: { type: 'image', label: '图片', icon: '🖼️', description: '摄影作品、设计作品', color: 'text-blue-500', gradient: 'from-blue-500 to-cyan-500' },
  article: { type: 'article', label: '文章', icon: '📝', description: '深度文章、评测', color: 'text-green-500', gradient: 'from-green-500 to-emerald-500' },
  content: { type: 'content', label: '文字', icon: '💭', description: '想法、观点、日常', color: 'text-gray-500', gradient: 'from-gray-500 to-gray-400' },
  software: { type: 'software', label: '软件', icon: '💻', description: '工具、应用、插件', color: 'text-purple-500', gradient: 'from-purple-500 to-indigo-500' },
  skill: { type: 'skill', label: 'Skill', icon: '🧠', description: 'AI Skill、提示词', color: 'text-amber-500', gradient: 'from-amber-500 to-yellow-500' },
  agent: { type: 'agent', label: 'Agent', icon: '🤖', description: 'AI Agent、自动化', color: 'text-teal-500', gradient: 'from-teal-500 to-cyan-500' },
  product: { type: 'product', label: '产品', icon: '📦', description: '实物产品、好物推荐', color: 'text-orange-500', gradient: 'from-orange-500 to-red-500' },
  game: { type: 'game', label: '游戏', icon: '🎮', description: '游戏推荐、攻略', color: 'text-indigo-500', gradient: 'from-indigo-500 to-purple-500' },
  movie: { type: 'movie', label: '影视', icon: '🎬', description: '电影、电视剧、纪录片', color: 'text-pink-500', gradient: 'from-pink-500 to-rose-500' },
  music: { type: 'music', label: '音乐', icon: '🎵', description: '歌曲、专辑、MV', color: 'text-violet-500', gradient: 'from-violet-500 to-purple-500' },
  drama: { type: 'drama', label: '短剧', icon: '🎭', description: '短剧、微电影', color: 'text-rose-500', gradient: 'from-rose-500 to-pink-500' },
  person: { type: 'person', label: '人物', icon: '👤', description: '达人、创作者、专家', color: 'text-cyan-500', gradient: 'from-cyan-500 to-blue-500' },
  live: { type: 'live', label: '直播', icon: '📡', description: '直播回放、精彩片段', color: 'text-red-600', gradient: 'from-red-600 to-red-400' },
  card: { type: 'card', label: '名片', icon: '💳', description: '个人/品牌名片', color: 'text-gray-500', gradient: 'from-gray-500 to-gray-400' },
  blindbox: { type: 'blindbox', label: '盲盒', icon: '🎁', description: '随机内容、惊喜推荐', color: 'text-amber-400', gradient: 'from-amber-400 to-yellow-400' },
}

export function getContentTypeConfig(type: ContentType): ContentTypeConfig {
  return CONTENT_TYPES[type]
}
