// ===== 搜索页面 =====

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { makeContentFeedBatch } from '../lib/mockDataV2'
import { MOCK_TOPICS, getTopicTypeConfig, getStatusConfig as _getStatusConfig, formatTopicStats } from '../lib/topicSystem'
import { MOCK_MEMES, formatStat, getStatusColor, getStatusLabel } from '../lib/memeSystem'

type SearchTab = 'all' | 'content' | 'topic' | 'meme'

export default function Search() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<SearchTab>('all')
  const [searched, setSearched] = useState(false)

  const doSearch = () => {
    if (!query.trim()) return
    setSearched(true)
  }

  // 模拟搜索结果
  const allContent = makeContentFeedBatch(10)
  const contentResults = allContent.filter((c: any) =>
    c.title.includes(query) || c.description.includes(query) || c.tags.some((t: string) => t.includes(query))
  )
  const topicResults = MOCK_TOPICS.filter((t: any) =>
    t.title.includes(query) || t.description.includes(query)
  )
  const memeResults = MOCK_MEMES.filter((m: any) =>
    m.title.includes(query) || m.content.includes(query) || m.hashtags.some((h: string) => h.includes(query))
  )

  const hasResults = contentResults.length > 0 || topicResults.length > 0 || memeResults.length > 0

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* 搜索栏 */}
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder="搜索话题、内容、梗..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button onClick={doSearch} className="px-4 py-3 bg-black text-white text-sm rounded-xl">
            搜索
          </button>
        </div>
      </div>

      {/* 筛选 */}
      {searched && (
        <div className="bg-white px-5 py-3 border-b border-gray-100">
          <div className="flex gap-2">
            {[
              { key: 'all' as SearchTab, label: '全部' },
              { key: 'content' as SearchTab, label: '内容' },
              { key: 'topic' as SearchTab, label: '话题' },
              { key: 'meme' as SearchTab, label: '梗' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  tab === t.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 结果 */}
      <div className="p-5">
        {!searched ? (
          // 热门搜索
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-3">🔥 热门搜索</h2>
            <div className="flex flex-wrap gap-2">
              {['国产平替', '独立音乐', '古装剧', '10元挑战', '社区英雄', '宇宙探索'].map(tag => (
                <button
                  key={tag}
                  onClick={() => { setQuery(tag); setSearched(true) }}
                  className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs rounded-full"
                >
                  {tag}
                </button>
              ))}
            </div>

            <h2 className="text-sm font-bold text-gray-900 mb-3 mt-6">📢 热门话题</h2>
            <div className="space-y-2">
              {MOCK_TOPICS.slice(0, 3).map(topic => {
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
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">{topic.title}</h3>
                    <div className="text-[11px] text-gray-400 mt-1">
                      💡 {topic.stats.memeCount} 梗 · 👁 {formatTopicStats(topic.stats.totalViews)} 曝光
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : !hasResults ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-400 text-sm">没有找到「{query}」相关内容</p>
            <p className="text-gray-300 text-xs mt-1">换个关键词试试</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 内容结果 */}
            {(tab === 'all' || tab === 'content') && contentResults.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">📦 内容 ({contentResults.length})</h3>
                <div className="space-y-2">
                  {contentResults.map((c: any) => (
                    <div key={c.id} onClick={() => navigate(`/content/${c.id}`)} className="bg-white rounded-xl p-3 border border-gray-100 active:bg-gray-50">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{c.type === 'video' ? '🎬' : c.type === 'product' ? '📦' : '💡'}</span>
                        <h4 className="text-sm font-bold text-gray-900">{c.title}</h4>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1">{c.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 话题结果 */}
            {(tab === 'all' || tab === 'topic') && topicResults.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">📢 话题 ({topicResults.length})</h3>
                <div className="space-y-2">
                  {topicResults.map(t => {
                    const typeConfig = getTopicTypeConfig(t.type)
                    return (
                      <div key={t.id} onClick={() => navigate(`/topic/${t.id}`)} className="bg-white rounded-xl p-3 border border-gray-100 active:bg-gray-50">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-[10px] rounded-full ${typeConfig.color}`}>
                            {typeConfig.icon} {typeConfig.label}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900">{t.title}</h4>
                        <div className="text-[11px] text-gray-400 mt-1">
                          💡 {t.stats.memeCount} 梗 · 💰 {t.rewardPool} 积分
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 梗结果 */}
            {(tab === 'all' || tab === 'meme') && memeResults.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">💡 梗 ({memeResults.length})</h3>
                <div className="space-y-2">
                  {memeResults.map(m => (
                    <div key={m.id} className="bg-white rounded-xl p-3 border border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-[10px] rounded-full ${getStatusColor(m.status)}`}>
                          {getStatusLabel(m.status)}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900">{m.title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-1">{m.content}</p>
                      <div className="text-[11px] text-gray-400 mt-1">
                        👁 {formatStat(m.stats.views)} · ❤️ {formatStat(m.stats.likes)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
