// ===== 璇濋骞垮満 =====

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTopics } from '../lib/api/client'

const TOPIC_TYPES = [
  { key: 'all', label: '鍏ㄩ儴', icon: '馃敟' },
  { key: 'product-review', label: '浜у搧娴嬭瘎', icon: '馃摫' },
  { key: 'movie-discussion', label: '褰辫璁ㄨ', icon: '馃幀' },
  { key: 'person-topic', label: '浜虹墿璇濋', icon: '馃懁' },
  { key: 'open-discussion', label: '寮€鏀捐璁?, icon: '馃挕' },
  { key: 'challenge', label: '鎸戞垬璧?, icon: '馃弳' },
]

const TOPICS_CACHE_KEY = 'julang_topics_cache'

function getCachedTopics(filter: string): any[] | null {
  try {
    const cached = localStorage.getItem(`${TOPICS_CACHE_KEY}_${filter}`)
    if (!cached) return null
    const { data, time } = JSON.parse(cached)
    if (Date.now() - time > 10 * 60 * 1000) return null // 10 鍒嗛挓缂撳瓨
    return data
  } catch { return null }
}

function setCachedTopics(filter: string, data: any[]) {
  try {
    localStorage.setItem(`${TOPICS_CACHE_KEY}_${filter}`, JSON.stringify({ data, time: Date.now() }))
  } catch {}
}

export default function Topics() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [topics, setTopics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 鍏堟樉绀虹紦瀛?
    const cached = getCachedTopics(filter)
    if (cached) {
      setTopics(cached)
      setLoading(false)
      // 鍚庡彴鍒锋柊
      fetchTopics(true)
    } else {
      fetchTopics()
    }
  }, [filter])

  const fetchTopics = async (silent = false) => {
    if (!silent) setLoading(true)
    let data = filter === 'all'
      ? await getTopics().catch(() => [])
      : await getTopics(filter).catch(() => [])
    if (!Array.isArray(data)) data = []
    setTopics(data || [])
    setCachedTopics(filter, data || [])
    if (!silent) setLoading(false)
  }

  const formatNum = (n: number) => n >= 10000 ? (n / 10000).toFixed(1) + '涓? : n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)

  const getTypeConfig = (type: string) => TOPIC_TYPES.find(t => t.key === type) || TOPIC_TYPES[0]

  const getDaysLeft = (endDate: string) => {
    if (!endDate) return '鏃犻檺鏈?
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000)
    return days > 0 ? `杩樺墿 ${days} 澶ー : '宸茬粨鏉?
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="bg-white px-5 pt-12 pb-5">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">璇濋骞垮満</h1>
        <p className="text-sm text-gray-400 mb-4">閫犳鎺ㄥ箍锛岃濂戒笢瑗胯鐪嬭</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-gray-900">{topics.length}</div>
            <div className="text-[10px] text-gray-400">娲昏穬璇濋</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-gray-900">{topics.reduce((s, t) => s + (t.meme_count || 0), 0)}</div>
            <div className="text-[10px] text-gray-400">鎬绘鏁?/div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-gray-900">{formatNum(topics.reduce((s, t) => s + (t.total_views || 0), 0))}</div>
            <div className="text-[10px] text-gray-400">鎬绘洕鍏?/div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 px-5 py-4 overflow-x-auto">
        {TOPIC_TYPES.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === t.key ? 'bg-black text-white' : 'bg-white text-gray-600'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="px-5 space-y-4">
        {loading && topics.length === 0 ? (
          <div className="text-center py-10 text-gray-400">鍔犺浇涓?..</div>
        ) : topics.length === 0 ? (
          <div className="text-center py-10 text-gray-400">鏆傛棤璇濋</div>
        ) : topics.map(topic => (
          <div key={topic.id} onClick={() => navigate(`/topic/${topic.id}`)} className="bg-white rounded-2xl p-5 shadow-sm active:scale-[0.99] transition-transform cursor-pointer">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-gray-100 text-gray-600">
                {getTypeConfig(topic.type).icon} {getTypeConfig(topic.type).label}
              </span>
              {topic.hot_score >= 80 && <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-red-50 text-red-500">馃敟 鐑棬</span>}
              <span className="text-[11px] text-gray-400 ml-auto">{getDaysLeft(topic.end_date)}</span>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">{topic.title}</h3>
            {/* 鍝佺墝鍚?*/}
            {topic.brand_name && (
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs text-blue-600 font-medium">馃彿锔?{topic.brand_name}</span>
                {topic.promote_reward > 0 && <span className="text-xs text-gray-400">路 甯帹 +{topic.promote_reward}绉垎</span>}
              </div>
            )}
            <p className="text-sm text-gray-500 mb-3 line-clamp-2">{topic.description}</p>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs">{topic.creator_avatar}</div>
              <span className="text-xs text-gray-400">{topic.brand_name || topic.creator_name}</span>
              {topic.creator_type === 'brand' && <span className="px-1.5 py-0.5 text-[9px] bg-blue-50 text-blue-500 rounded">鍝佺墝</span>}
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center"><div className="text-sm font-bold text-gray-900">{topic.meme_count}</div><div className="text-[10px] text-gray-400">姊?/div></div>
              <div className="text-center"><div className="text-sm font-bold text-gray-900">{formatNum(topic.total_views)}</div><div className="text-[10px] text-gray-400">鏇濆厜</div></div>
              <div className="text-center"><div className="text-sm font-bold text-gray-900">{topic.participant_count}</div><div className="text-[10px] text-gray-400">鍙備笌</div></div>
              <div className="text-center"><div className="text-sm font-bold text-orange-500">{topic.promote_count || topic.hot_score}</div><div className="text-[10px] text-gray-400">{topic.brand_name ? '甯帹' : '鐑害'}</div></div>
            </div>
            {(topic.reward_pool > 0 || topic.brand_name) && (
              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                {topic.reward_pool > 0 && <span className="text-xs text-gray-400">馃挵 {topic.reward_pool} 绉垎</span>}
                {topic.brand_name && topic.promote_reward > 0 && <span className="text-xs text-blue-500">馃敟 甯帹 +{topic.promote_reward}绉垎</span>}
                <span className="text-xs text-gray-400">{topic.creator_type === 'brand' ? '鍝佺墝鍙戣捣' : '涓汉鍙戣捣'}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

