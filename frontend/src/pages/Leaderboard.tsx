import { useState, useEffect } from 'react'

export default function Leaderboard() {
  const [tab, setTab] = useState<'hot' | 'promoters' | 'points'>('hot')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const API_BASE = (import.meta as any).env?.VITE_API_URL || 'https://corporate-prints-anti-replacing.trycloudflare.com'

  useEffect(() => {
    fetchData()
  }, [tab])

  const fetchData = async () => {
    setLoading(true)
    const endpoints: Record<string, string> = {
      hot: '/api/leaderboard/hot',
      promoters: '/api/leaderboard/promoters',
      points: '/api/leaderboard/points',
    }
    try {
      const res = await fetch(`${API_BASE}${endpoints[tab]}`)
      const d = await res.json()
      setData(Array.isArray(d) ? d : [])
    } catch {}
    setLoading(false)
  }

  const tabs = [
    { key: 'hot', label: '🔥 今日最热', emoji: '🔥' },
    { key: 'promoters', label: '🚀 最强推广', emoji: '🚀' },
    { key: 'points', label: '💰 积分富豪', emoji: '💰' },
  ]

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur border-b border-white/10 px-5 py-4">
        <h1 className="text-xl font-bold mb-3">🏆 热门排行</h1>
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${tab === t.key ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/60'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="px-5 py-4 space-y-2">
          {data.length === 0 && (
            <div className="text-center py-12 text-white/30">
              <div className="text-4xl mb-2">📭</div>
              <p>今天还没有数据，快去发梗吧！</p>
            </div>
          )}
          {data.map((item: any, i: number) => (
            <div key={item.id || i} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                i === 0 ? 'bg-yellow-500 text-black' :
                i === 1 ? 'bg-gray-300 text-black' :
                i === 2 ? 'bg-amber-600 text-white' :
                'bg-white/10 text-white/50'
              }`}>
                {i + 1}
              </div>
              {item.avatar_url ? (
                <img src={item.avatar_url} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 bg-purple-600 rounded-full flex items-center justify-center text-sm">{(item.name || '?')[0]}</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.name || item.title || '未知'}</p>
                {tab === 'hot' && item.content && (
                  <p className="text-white/40 text-xs truncate">{item.content?.slice(0, 40)}</p>
                )}
              </div>
              <div className="text-right">
                {tab === 'hot' && <span className="text-pink-400 text-sm font-bold">{item.hot_score || 0}</span>}
                {tab === 'promoters' && <span className="text-purple-400 text-sm font-bold">{item.promote_count || 0}次</span>}
                {tab === 'points' && <span className="text-yellow-400 text-sm font-bold">💰 {item.points || 0}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
