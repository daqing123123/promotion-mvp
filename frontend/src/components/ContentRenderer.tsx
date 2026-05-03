// ===== 内容渲染器 =====

import { type Content } from '../lib/contentData'

export default function ContentRenderer({ content, isActive: _isActive }: { content: Content; isActive: boolean }) {
  const openLink = (url?: string) => {
    if (url) window.open(url, '_blank')
  }

  // 活动卡片
  const isActivity = content.renderConfig?.detail?.isActivity

  // 文字类内容
  if (content.type === 'article' || content.type === 'content') {
    return (
      <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black flex items-center justify-center px-8">
        <div className="text-center max-w-lg">
          <div className="text-5xl mb-6">{isActivity ? '🎯' : content.type === 'article' ? '📝' : '💭'}</div>
          <h2 className="text-white text-2xl font-bold mb-4 leading-relaxed">{content.title}</h2>
          <p className="text-white/70 text-base leading-relaxed whitespace-pre-line">{content.description}</p>
          {content.tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {content.tags.map(tag => (
                <span key={tag} className="text-white/40 text-sm">#{tag}</span>
              ))}
            </div>
          )}
          {isActivity && (
            <button onClick={() => window.location.href = '/activities'} className="mt-6 px-8 py-3 bg-orange-500 text-white rounded-2xl font-bold text-sm">
              🎯 去参与活动
            </button>
          )}
        </div>
      </div>
    )
  }

  // 软件/Skill/Agent
  if (content.type === 'software' || content.type === 'skill' || content.type === 'agent') {
    return (
      <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black flex items-center justify-center px-8">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full text-center">
          <div className="text-6xl mb-4">{content.type === 'skill' ? '🧠' : content.type === 'agent' ? '🤖' : '💻'}</div>
          <h2 className="text-white text-xl font-bold mb-2">{content.title}</h2>
          <p className="text-white/60 text-sm mb-6">{content.description}</p>
          <button onClick={() => openLink(content.renderConfig?.detail?.link)} className="w-full py-3 bg-white text-black rounded-2xl font-bold text-sm">
            {content.type === 'skill' ? '安装 Skill' : content.type === 'agent' ? '开始对话' : '免费试用'}
          </button>
          <div className="flex justify-center gap-6 mt-4 text-white/40 text-xs">
            <span>❤️ {formatNum(content.stats.likes)}</span>
            <span>👁 {formatNum(content.stats.views)}</span>
          </div>
        </div>
      </div>
    )
  }

  // 产品
  if (content.type === 'product') {
    return (
      <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black flex items-center justify-center px-8">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full text-center">
          {content.cover && content.cover !== '/placeholder-1.svg' ? (
            <img src={content.cover} alt={content.title} className="w-32 h-32 mx-auto mb-4 rounded-2xl object-cover" />
          ) : (
            <div className="w-32 h-32 mx-auto mb-4 bg-white/10 rounded-2xl flex items-center justify-center text-6xl">📦</div>
          )}
          <h2 className="text-white text-xl font-bold mb-2">{content.title}</h2>
          <p className="text-white/60 text-sm mb-4">{content.description}</p>
          {content.renderConfig?.detail?.price && (
            <span className="text-orange-400 text-lg font-bold mb-4 block">{content.renderConfig.detail.price}</span>
          )}
          <button onClick={() => openLink(content.renderConfig?.detail?.link)} className="w-full py-3 bg-orange-500 text-white rounded-2xl font-bold text-sm">
            {content.renderConfig?.detail?.link ? '去看看' : '了解更多'}
          </button>
        </div>
      </div>
    )
  }

  // 游戏
  if (content.type === 'game') {
    return (
      <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black flex items-center justify-center px-8">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full text-center">
          <div className="text-6xl mb-4">🎮</div>
          <h2 className="text-white text-xl font-bold mb-2">{content.title}</h2>
          <p className="text-white/60 text-sm mb-6">{content.description}</p>
          <button onClick={() => openLink(content.renderConfig?.detail?.link)} className="w-full py-3 bg-purple-600 text-white rounded-2xl font-bold text-sm">开始玩</button>
          <div className="flex justify-center gap-6 mt-4 text-white/40 text-xs">
            <span>❤️ {formatNum(content.stats.likes)}</span>
            <span>👁 {formatNum(content.stats.views)}</span>
          </div>
        </div>
      </div>
    )
  }

  // 影视/音乐/短剧
  if (content.type === 'movie' || content.type === 'music' || content.type === 'drama') {
    return (
      <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black flex items-center justify-center px-8">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">{content.type === 'music' ? '🎵' : content.type === 'movie' ? '🎬' : '🎭'}</div>
          <h2 className="text-white text-xl font-bold mb-2">{content.title}</h2>
          <p className="text-white/60 text-sm mb-6">{content.description}</p>
          <button onClick={() => openLink(content.renderConfig?.detail?.link)} className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
            <div className="w-0 h-0 border-l-[20px] border-l-white border-y-[12px] border-y-transparent ml-2" />
          </button>
          <div className="flex justify-center gap-6 text-white/40 text-xs">
            <span>❤️ {formatNum(content.stats.likes)}</span>
            <span>👁 {formatNum(content.stats.views)}</span>
          </div>
        </div>
      </div>
    )
  }

  // 默认：图片/视频
  return (
    <div className="w-full h-full relative bg-black">
      {content.cover && content.cover !== '/placeholder-1.svg' ? (
        <img
          src={content.cover}
          alt={content.title}
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      {content.type === 'video' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm">
            <div className="w-0 h-0 border-l-[28px] border-l-white border-y-[16px] border-y-transparent ml-2" />
          </div>
        </div>
      )}
    </div>
  )
}

function formatNum(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}
