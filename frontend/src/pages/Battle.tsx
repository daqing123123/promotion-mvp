import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface BattleProps {
  user: any
}

export default function Battle({ user }: BattleProps) {
  const [battle, setBattle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const navigate = useNavigate()

  const API_BASE = (import.meta as any).env?.VITE_API_URL || 'https://corporate-prints-anti-replacing.trycloudflare.com'

  useEffect(() => {
    fetchBattle()
  }, [])

  const fetchBattle = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers: any = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/api/battles/today`, { headers })
      setBattle(await res.json())
    } catch {}
    setLoading(false)
  }

  const vote = async (side: 'a' | 'b') => {
    if (!user) { navigate('/login'); return }
    if (battle?.my_vote) return
    setVoting(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/battles/${battle.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ side })
      })
      if (res.ok) fetchBattle()
    } catch {}
    setVoting(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
    </div>
  )

  if (!battle) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white/30">
      <p>今天没有PK，明天再来！</p>
    </div>
  )

  const totalVotes = (battle.side_a_votes || 0) + (battle.side_b_votes || 0)
  const aPercent = totalVotes > 0 ? ((battle.side_a_votes || 0) / totalVotes * 100) : 50
  const bPercent = totalVotes > 0 ? ((battle.side_b_votes || 0) / totalVotes * 100) : 50

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur border-b border-white/10 px-5 py-4">
        <h1 className="text-xl font-bold">⚔️ 每日PK大战</h1>
      </div>
      <div className="px-5 py-4 space-y-4">
        {/* Title */}
        <div className="text-center">
          <p className="text-white/40 text-sm mb-1">今日话题</p>
          <h2 className="text-xl font-bold">{battle.title}</h2>
          <p className="text-white/30 text-xs mt-1">⚡ 投票赢3积分</p>
        </div>

        {/* Battle cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Side A */}
          <button
            onClick={() => vote('a')}
            disabled={!!battle.my_vote || voting}
            className={`relative rounded-2xl p-4 text-center transition-all ${
              battle.my_vote === 'a' ? 'bg-purple-600/40 border-2 border-purple-500' :
              battle.my_vote ? 'opacity-50' :
              'bg-purple-900/20 border-2 border-purple-500/30 active:scale-95'
            }`}
          >
            {battle.my_vote === 'a' && <span className="absolute top-2 right-2 text-sm">✅</span>}
            <div className="text-4xl mb-2">🅰️</div>
            <h3 className="font-bold text-lg mb-1">{battle.side_a_title}</h3>
            <p className="text-2xl font-bold text-purple-400">{battle.side_a_votes || 0}</p>
            <p className="text-white/30 text-xs mt-1">票</p>
            {!battle.my_vote && <span className="block mt-2 text-xs text-purple-400">👆 点击投票</span>}
          </button>

          {/* Side B */}
          <button
            onClick={() => vote('b')}
            disabled={!!battle.my_vote || voting}
            className={`relative rounded-2xl p-4 text-center transition-all ${
              battle.my_vote === 'b' ? 'bg-pink-600/40 border-2 border-pink-500' :
              battle.my_vote ? 'opacity-50' :
              'bg-pink-900/20 border-2 border-pink-500/30 active:scale-95'
            }`}
          >
            {battle.my_vote === 'b' && <span className="absolute top-2 right-2 text-sm">✅</span>}
            <div className="text-4xl mb-2">🅱️</div>
            <h3 className="font-bold text-lg mb-1">{battle.side_b_title}</h3>
            <p className="text-2xl font-bold text-pink-400">{battle.side_b_votes || 0}</p>
            <p className="text-white/30 text-xs mt-1">票</p>
            {!battle.my_vote && <span className="block mt-2 text-xs text-pink-400">👆 点击投票</span>}
          </button>
        </div>

        {/* Progress bar */}
        {totalVotes > 0 && (
          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex justify-between text-xs text-white/40 mb-1">
              <span>{battle.side_a_title} {aPercent.toFixed(0)}%</span>
              <span>{battle.side_b_title} {bPercent.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
              <div className="h-full bg-purple-500 rounded-l-full transition-all" style={{ width: `${aPercent}%` }} />
              <div className="h-full bg-pink-500 rounded-r-full transition-all" style={{ width: `${bPercent}%` }} />
            </div>
            <p className="text-center text-white/30 text-xs mt-2">总投票数: {totalVotes}</p>
          </div>
        )}

        {/* VS decoration */}
        <div className="text-center text-white/10">
          <span className="text-3xl font-black">VS</span>
        </div>

        {battle.my_vote && (
          <div className="text-center py-2 px-4 bg-green-600/20 text-green-400 rounded-full text-sm inline-block mx-auto w-full">
            ✅ 你已投票，明天再来！
          </div>
        )}
      </div>
    </div>
  )
}
