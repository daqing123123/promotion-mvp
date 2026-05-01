// ===== 内容底部信息 =====

import { type Content } from '../lib/contentData'
import { getContentTypeConfig } from '../lib/contentTypes'

export default function ContentInfo({ content }: { content: Content }) {
  const typeConfig = getContentTypeConfig(content.type)
  return (
    <div className="absolute bottom-20 left-0 right-16 z-20 px-4 pb-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{content.creator.avatar}</span>
        <span className="text-white text-sm font-medium">@{content.creator.name}</span>
        <span className="text-white/50 text-xs">Lv.{content.creator.level}</span>
        <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] rounded-full">{typeConfig.icon} {typeConfig.label}</span>
      </div>
      <h3 className="text-white text-base font-bold mb-1 line-clamp-2">{content.title}</h3>
      <p className="text-white/70 text-xs mb-2 line-clamp-2">{content.description}</p>
      <div className="flex flex-wrap gap-1.5">{content.tags.slice(0, 4).map(tag => <span key={tag} className="text-white/50 text-[11px]">#{tag}</span>)}</div>
    </div>
  )
}
