// ===== 内容详情页 =====

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { type Content as _Content } from '../lib/contentData'
import { makeContentFeedBatch } from '../lib/mockDataV2'
import { MOCK_MEMES, formatStat, getStatusColor, getStatusLabel, type Meme } from '../lib/memeSystem'
import { MOCK_TOPICS, type Topic as _Topic, getStatusConfig, getTopicTypeConfig, formatTopicStats } from '../lib/topicSystem'
import _ContentRenderer from '../components/ContentRenderer'

export default function ContentDetail() {
  const navigate = useNavigate()
  const [showMemeCreate, setShowMemeCreate] = useState(false)
  const [memeType, setMemeType] = useState<'text' | 'image' | 'hashtag'>('text')
  const [memeTitle, setMemeTitle] = useState('')
  const [memeContent, setMemeContent] = useState('')
  const [memeHashtags, setMemeHashtags] = useState('')
  const [liked, setLiked] = useState(false)
  const [favorited, setFavorited] = useState(false)

  // 使用第一个内容作为示例
  const content = makeContentFeedBatch(1)[0]
  const relatedMemes = MOCK_MEMES.slice(0, 3)
  const relatedTopics = MOCK_TOPICS.slice(0, 2)

  const handleCreateMeme = () => {
    setShowMemeCreate(false)
    setMemeTitle('')
    setMemeContent('')
    setMemeHashtags('')
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* 内容预览 */}
      <div className="relative h-64 bg-black">
        <img src={content.cover} alt={content.title} className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

        {/* 返回 */}
        <button onClick={() => navigate(-1)} className="absolute top-12 left-4 text-white/80">
          ← 返回
        </button>

        {/* 类型标签 */}
        <div className="absolute top-12 right-4">
          <span className="px-2.5 py-1 bg-white/20 text-white text-xs rounded-full">
            {content.type === 'video' ? '🎬 视频' :
             content.type === 'product' ? '📦 产品' :
             content.type === 'software' ? '💻 软件' :
             content.type === 'skill' ? '🧠 Skill' :
             content.type}
          </span>
        </div>

        {/* 底部信息 */}
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-white text-xl font-bold mb-1">{content.title}</h1>
          <p className="text-white/70 text-sm line-clamp-2">{content.description}</p>
        </div>
      </div>

      {/* 互动栏 */}
      <div className="bg-white px-5 py-3 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={() => setLiked(!liked)} className="flex items-center gap-1.5">
            <span className="text-xl">{liked ? '❤️' : '🤍'}</span>
            <span className="text-sm text-gray-600">{formatStat(content.stats.likes + (liked ? 1 : 0))}</span>
          </button>
          <button className="flex items-center gap-1.5">
            <span className="text-xl">💬</span>
            <span className="text-sm text-gray-600">{formatStat(content.stats.comments)}</span>
          </button>
          <button className="flex items-center gap-1.5">
            <span className="text-xl">🔄</span>
            <span className="text-sm text-gray-600">{formatStat(content.stats.shares)}</span>
          </button>
        </div>
        <button onClick={() => setFavorited(!favorited)} className="text-xl">
          {favorited ? '⭐' : '☆'}
        </button>
      </div>

      {/* 创作者信息 */}
      <div className="bg-white px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
            {content.creator.avatar}
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-gray-900">@{content.creator.name}</div>
            <div className="text-xs text-gray-400">Lv.{content.creator.level}</div>
          </div>
          <button className="px-4 py-1.5 bg-black text-white text-xs rounded-full">
            关注
          </button>
        </div>
      </div>

      {/* 造梗入口 */}
      <div className="px-5 py-4">
        <button
          onClick={() => setShowMemeCreate(true)}
          className="w-full py-3.5 bg-black text-white rounded-2xl font-bold text-base active:scale-[0.98] transition-transform"
        >
          🔥 为这个内容造梗
        </button>
      </div>

      {/* 相关话题 */}
      {relatedTopics.length > 0 && (
        <div className="px-5 pb-4">
          <h2 className="text-sm font-bold text-gray-900 mb-3">📢 相关话题</h2>
          <div className="space-y-2">
            {relatedTopics.map(topic => {
              const statusConfig = getStatusConfig(topic.status)
              const typeConfig = getTopicTypeConfig(topic.type)
              return (
                <div
                  key={topic.id}
                  onClick={() => navigate(`/topic/${topic.id}`)}
                  className="bg-white rounded-xl p-3 border border-gray-100 active:bg-gray-50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-[10px] rounded-full ${typeConfig.color}`}>
                      {typeConfig.icon} {typeConfig.label}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] rounded-full ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">{topic.title}</h3>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
                    <span>💡 {topic.stats.memeCount} 梗</span>
                    <span>👁 {formatTopicStats(topic.stats.totalViews)} 曝光</span>
                    <span>💰 {topic.rewardPool} 积分</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 相关梗 */}
      <div className="px-5 pb-5">
        <h2 className="text-sm font-bold text-gray-900 mb-3">🔥 相关梗</h2>
        <div className="space-y-3">
          {relatedMemes.map(meme => (
            <MemeCard key={meme.id} meme={meme} />
          ))}
        </div>
      </div>

      {/* 造梗弹窗 */}
      {showMemeCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowMemeCreate(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[85vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white px-5 pt-5 pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">💡 造梗</h2>
                <button onClick={() => setShowMemeCreate(false)} className="text-gray-400 text-xl">✕</button>
              </div>
              <p className="text-xs text-gray-400 mt-1">为「{content.title}」造一个梗</p>
            </div>

            <div className="p-5 overflow-y-auto max-h-[60vh] space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">梗类型</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'text' as const, icon: '📝', label: '文案梗' },
                    { type: 'image' as const, icon: '🖼️', label: '图片梗' },
                    { type: 'hashtag' as const, icon: '🏷️', label: '话题梗' },
                  ].map(t => (
                    <button
                      key={t.type}
                      onClick={() => setMemeType(t.type)}
                      className={`p-3 rounded-xl text-center transition-all ${
                        memeType === t.type ? 'bg-black text-white' : 'bg-gray-50 text-gray-600'
                      }`}
                    >
                      <div className="text-xl mb-1">{t.icon}</div>
                      <div className="text-xs">{t.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">梗标题</label>
                <input
                  type="text"
                  value={memeTitle}
                  onChange={e => setMemeTitle(e.target.value)}
                  placeholder="给你的梗起个标题"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  {memeType === 'text' ? '文案内容' : memeType === 'image' ? '图片链接' : '话题标签'}
                </label>
                <textarea
                  value={memeContent}
                  onChange={e => setMemeContent(e.target.value)}
                  placeholder={
                    memeType === 'text' ? '写下你的梗...' :
                    memeType === 'image' ? '输入图片URL...' :
                    '输入话题标签，如 #国产片之光'
                  }
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">话题标签</label>
                <input
                  type="text"
                  value={memeHashtags}
                  onChange={e => setMemeHashtags(e.target.value)}
                  placeholder="用逗号分隔，如：国产片之光,年度最佳"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-xs font-bold text-gray-500 mb-2">💡 参考梗</h3>
                <div className="space-y-2">
                  {relatedMemes.slice(0, 2).map(m => (
                    <div key={m.id} className="text-sm text-gray-600">"{m.title}" - {formatStat(m.stats.views)}曝光</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white px-5 py-4 border-t border-gray-100">
              <button
                onClick={handleCreateMeme}
                disabled={!memeTitle.trim() || !memeContent.trim()}
                className={`w-full py-3 rounded-2xl font-bold text-base transition-all ${
                  memeTitle.trim() && memeContent.trim()
                    ? 'bg-black text-white active:scale-[0.98]'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                发布梗
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MemeCard({ meme }: { meme: Meme }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100">
      <div className="flex items-center gap-2 mb-2">
        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${getStatusColor(meme.status)}`}>
          {getStatusLabel(meme.status)}
        </span>
      </div>
      <h3 className="text-sm font-bold text-gray-900 mb-1">{meme.title}</h3>
      <p className="text-xs text-gray-500 line-clamp-2 mb-2">{meme.content}</p>
      <div className="flex flex-wrap gap-1 mb-2">
        {meme.hashtags.slice(0, 3).map(tag => (
          <span key={tag} className="text-[10px] text-blue-500">#{tag}</span>
        ))}
      </div>
      <div className="flex items-center gap-4 text-[11px] text-gray-400">
        <span>👁 {formatStat(meme.stats.views)}</span>
        <span>❤️ {formatStat(meme.stats.likes)}</span>
        <span>🔄 {formatStat(meme.stats.shares)}</span>
      </div>
    </div>
  )
}
