// ===== 鎼滅储椤甸潰锛堢湡瀹炴暟鎹増锛?=====

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { search, getTopics } from '../lib/api/client'

type SearchTab = 'all' | 'content' | 'topic' | 'meme'

export default function Search() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<SearchTab>('all')
  const [searched, setSearched] = useState(false)
  const [contentResults, setContentResults] = useState<any[]>([])
  const [topicResults, setTopicResults] = useState<any[]>([])
  const [memeResults, setMemeResults] = useState<any[]>([])
  const [hotTopics, setHotTopics] = useState<any[]>([])
  const [hotTags, setHotTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadHotTopics()
  }, [])

  const loadHotTopics = async () => {
    const data = await getTopics().catch(() => [])
    if (Array.isArray(data)) setHotTopics(data)

    // 浠庤瘽棰樻爣棰樻彁鍙栫儹闂ㄦ爣绛?
    const tags = (data || []).map(t => t.title).slice(0, 6)
    if (tags.length < 6) {
      // 琛ュ厖涓€浜涢粯璁ゆ爣绛?
      const defaults = ['鍥戒骇骞虫浛', '鐙珛闊充箰', '鍙よ鍓?, '10鍏冩寫鎴?, '绀惧尯鑻遍泟', '瀹囧畽鎺㈢储']
      while (tags.length < 6 && defaults.length > 0) {
        const tag = defaults.shift()!
        if (!tags.includes(tag)) tags.push(tag)
      }
    }
    setHotTags(tags)
  }

  const doSearch = async () => {
    if (!query.trim()) return
    setSearched(true)
    setLoading(true)
    const q = `%${query.trim()}%`
    const [cRes, tRes, mRes] = await Promise.all([
      search(query.trim()).catch(() => ({})),
      search(query.trim()).catch(() => ({})),
      search(query.trim()).catch(() => ({})),
    ])
    setContentResults(Array.isArray(cRes?.contents) ? cRes.contents : [])
    setTopicResults(Array.isArray(tRes?.topics) ? tRes.topics : [])
    setMemeResults(Array.isArray(mRes?.memes) ? mRes.memes : [])
    setLoading(false)
  }

  const hasResults = contentResults.length > 0 || topicResults.length > 0 || memeResults.length > 0

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* 鎼滅储鏍?*/}
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder="鎼滅储璇濋銆佸唴瀹广€佹..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button onClick={doSearch} className="px-4 py-3 bg-black text-white text-sm rounded-xl">
            鎼滅储
          </button>
        </div>
      </div>

      {/* 绛涢€?*/}
      {searched && (
        <div className="bg-white px-5 py-3 border-b border-gray-100">
          <div className="flex gap-2">
            {[
              { key: 'all' as SearchTab, label: '鍏ㄩ儴' },
              { key: 'content' as SearchTab, label: '鍐呭' },
              { key: 'topic' as SearchTab, label: '璇濋' },
              { key: 'meme' as SearchTab, label: '姊? },
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

      {/* 缁撴灉 */}
      <div className="p-5">
        {!searched ? (
          // 鐑棬鎼滅储
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-3">馃敟 鐑棬鎼滅储</h2>
            <div className="flex flex-wrap gap-2">
              {hotTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => { setQuery(tag); doSearch() }}
                  className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs rounded-full"
                >
                  {tag}
                </button>
              ))}
            </div>

            {hotTopics.length > 0 && (
              <>
                <h2 className="text-sm font-bold text-gray-900 mb-3 mt-6">馃摙 鐑棬璇濋</h2>
                <div className="space-y-2">
                  {hotTopics.map(topic => (
                    <div
                      key={topic.id}
                      onClick={() => navigate(`/topic/${topic.id}`)}
                      className="bg-white rounded-xl p-3 border border-gray-100 active:bg-gray-50"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-600">
                          {topic.type}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900">{topic.title}</h3>
                      <div className="text-[11px] text-gray-400 mt-1">
                        馃挕 {topic.meme_count || 0} 姊?路 馃懃 {topic.participant_count || 0} 鍙備笌
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">鎼滅储涓?..</div>
        ) : !hasResults ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">馃攳</div>
            <p className="text-gray-400 text-sm">娌℃湁鎵惧埌銆寋query}銆嶇浉鍏冲唴瀹?/p>
            <p className="text-gray-300 text-xs mt-1">鎹釜鍏抽敭璇嶈瘯璇?/p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 鍐呭缁撴灉 */}
            {(tab === 'all' || tab === 'content') && contentResults.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">馃摝 鍐呭 ({contentResults.length})</h3>
                <div className="space-y-2">
                  {contentResults.map(c => (
                    <div key={c.id} onClick={() => navigate(`/content/${c.id}`)} className="bg-white rounded-xl p-3 border border-gray-100 active:bg-gray-50">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{c.type === 'video' ? '馃幀' : c.type === 'product' ? '馃摝' : '馃挕'}</span>
                        <h4 className="text-sm font-bold text-gray-900">{c.title}</h4>
                      </div>
                      {c.description && <p className="text-xs text-gray-500 line-clamp-1">{c.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 璇濋缁撴灉 */}
            {(tab === 'all' || tab === 'topic') && topicResults.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">馃摙 璇濋 ({topicResults.length})</h3>
                <div className="space-y-2">
                  {topicResults.map(t => (
                    <div key={t.id} onClick={() => navigate(`/topic/${t.id}`)} className="bg-white rounded-xl p-3 border border-gray-100 active:bg-gray-50">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-600">{t.type}</span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900">{t.title}</h4>
                      <div className="text-[11px] text-gray-400 mt-1">
                        馃挕 {t.meme_count || 0} 姊?路 馃懃 {t.participant_count || 0} 鍙備笌
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 姊楃粨鏋?*/}
            {(tab === 'all' || tab === 'meme') && memeResults.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">馃挕 姊?({memeResults.length})</h3>
                <div className="space-y-2">
                  {memeResults.map(m => (
                    <div key={m.id} onClick={() => navigate(`/content/${m.id}`)} className="bg-white rounded-xl p-3 border border-gray-100 active:bg-gray-50">
                      <h4 className="text-sm font-bold text-gray-900">{m.title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-1">{m.content}</p>
                      <div className="text-[11px] text-gray-400 mt-1">
                        馃憗 {m.view_count || 0} 路 鉂わ笍 {m.like_count || 0}
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

