import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface ChallengeProps {
  user: any
}

export default function DailyChallenge({ user }: ChallengeProps) {
  const [challenge, setChallenge] = useState<any>(null)
  const [entries, setEntries] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [tab, setTab] = useState<'today' | 'history'>('today')
  const navigate = useNavigate()

  useEffect(() => {
    if (tab === 'today') fetchToday()
    else fetchHistory()
  }, [tab])

  const fetchToday = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers: any = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/api/challenges/today`, { headers })
      const data = await res.json()
      setChallenge(data)
      if (data.id) {
        const er = await fetch(`${API_BASE}/api/challenges/${data.id}/entries`, { headers })
        setEntries(await er.json())
      }
    } catch {}
    setLoading(false)
  }

  const [history, setHistory] = useState<any[]>([])
  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/challenges/history`)
      setHistory(await res.json())
    } catch {}
    setLoading(false)
  }

  const API_BASE = (import.meta as any).env?.VITE_API_URL || 'https://corporate-prints-anti-replacing.trycloudflare.com'

  const submitEntry = async () => {
    if (!input.trim()) return
    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/challenges/${challenge.id}/enter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: input })
      })
      const data = await res.json()
      if (res.ok) {
        setInput('')
        fetchToday()
      }
    } catch {}
    setSubmitting(false)
  }

  const voteEntry = async (entryId: string) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/challenges/entries/${entryId}/vote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) fetchToday()
    } catch {}
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <p className="text-white/50 mb-4">请先登录</p>
          <button onClick={() => navigate('/login')} className="bg-purple-600 text-white px-6 py-2 rounded-full">登录</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur border-b border-white/10 px-5 py-4">
        <h1 className="text-xl font-bold">每日造梗挑战</h1>
        <div className="flex gap-4 mt-3">
          {['today', 'history'].map(t => (
            <button key={t} onClick={() => setTab(t as any)}
              className={`px-4 py-1.5 rounded-full text-sm ${tab === t ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/60'}`}>
              {t === 'today' ? '🔥 今日挑战' : '📋 往期回顾'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
        </div>
      ) : tab === 'today' && challenge ? (
        <div className="px-5 py-4 space-y-4">
          {/* Challenge card */}
          <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/30 rounded-2xl p-5 border border-purple-500/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-purple-600/30 text-purple-300 text-xs px-2 py-0.5 rounded">{challenge.topic_tag}</span>
              <span className="text-white/40 text-xs">🏆 {challenge.reward_points}积分奖励</span>
            </div>
            <h2 className="text-2xl font-bold mb-1">{challenge.title}</h2>
            <p className="text-white/60 text-sm mb-3">{challenge.description}</p>
            <div className="flex items-center gap-4 text-white/40 text-xs">
              <span>📝 {challenge.entry_count || 0}人参与</span>
              {challenge.my_entry && <span className="text-green-400">✅ 已参与</span>}
            </div>
          </div>

          {/* Submit entry */}
          {!challenge.my_entry && (
            <div className="bg-white/5 rounded-2xl p-4">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="写下你的神回复...（最少10个字）"
                rows={3}
                className="w-full bg-white/10 rounded-xl p-3 text-white placeholder-white/30 resize-none outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={submitEntry}
                disabled={submitting || input.trim().length < 10}
                className="mt-3 w-full py-2.5 bg-purple-600 text-white rounded-xl font-medium disabled:opacity-40"
              >
                {submitting ? '提交中...' : '🚀 提交参与 (+10积分)'}
              </button>
            </div>
          )}

          {/* Entries list */}
          <div>
            <h3 className="font-bold mb-3">📋 参赛作品 ({entries.length})</h3>
            <div className="space-y-3">
              {entries.map((entry: any, i: number) => (
                <div key={entry.id} className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</div>
                    <span className="text-sm font-medium">{entry.name || '匿名'}</span>
                    <span className="text-white/30 text-xs ml-auto">{new Date(entry.created_at).toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'})}</span>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">{entry.content}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => voteEntry(entry.id)}
                      disabled={entry.i_voted || entry.user_id === user.id}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
                        entry.i_voted ? 'bg-pink-600/30 text-pink-400' :
                        entry.user_id === user.id ? 'bg-white/5 text-white/20' :
                        'bg-white/10 hover:bg-pink-600/30 text-white/70 hover:text-pink-300'
                      }`}
                    >
                      {entry.i_voted ? '❤️' : '🤍'} {entry.vote_count || 0}
                    </button>
                    {entry.vote_count > 0 && (
                      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-pink-500 rounded-full" style={{ width: `${Math.min(100, (entry.vote_count / Math.max(1, ...entries.map(e => e.vote_count || 0))) * 100)}%` }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {entries.length === 0 && (
                <div className="text-center py-8 text-white/30">
                  <div className="text-4xl mb-2">🏃</div>
                  <p>还没有人参与，来做第一个吧！</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : tab === 'history' ? (
        <div className="px-5 py-4 space-y-3">
          {history.map((h: any) => (
            <div key={h.id} className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white/30 text-xs">{h.date}</span>
                <span className="bg-green-600/20 text-green-400 text-xs px-2 py-0.5 rounded">已结束</span>
              </div>
              <h3 className="font-bold">{h.title}</h3>
              <p className="text-white/40 text-sm">🏆 {h.reward_points}积分 · 📝 {h.entry_count || 0}人参与</p>
            </div>
          ))}
          {history.length === 0 && <p className="text-center py-8 text-white/30">暂无历史记录</p>}
        </div>
      ) : null}
    </div>
  )
}
