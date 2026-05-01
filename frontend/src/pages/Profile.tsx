// ===== 个人主页 =====

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase/client'
import { getLevelTitle, getLevelColor, getLevelProgress } from '../lib/rewardSystem'

export default function Profile({ user, setUser }: { user: any; setUser: (u: any) => void }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'memes' | 'achievements' | 'stats'>('memes')
  const [memes, setMemes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchMemes()
  }, [user])

  const fetchMemes = async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('memes')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })
    setMemes(data || [])
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    localStorage.removeItem('julang_user')
    navigate('/login')
  }

  const formatNum = (n: number) => n >= 10000 ? (n / 10000).toFixed(1) + '万' : n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)

  if (!user) {
    return (
      <div className="bg-white min-h-screen flex flex-col items-center justify-center pb-20">
        <div className="text-4xl mb-4">👤</div>
        <p className="text-gray-400 mb-4">登录后查看个人主页</p>
        <button onClick={() => navigate('/login')} className="px-6 py-2 bg-black text-white rounded-full text-sm font-medium">去登录</button>
      </div>
    )
  }

  const levelTitle = getLevelTitle(user.level || 1)
  const levelColor = getLevelColor(user.level || 1)
  const levelProgress = getLevelProgress(user.points || 0, user.level || 1)

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* 头部 */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-700 px-5 pt-12 pb-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-3xl">{user.avatar}</div>
            <div>
              <h1 className="text-xl font-bold">{user.name}</h1>
              <div className="flex items-center gap-1">
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Lv.{user.level || 1}</span>
                <span className="text-xs text-white/60">{levelTitle}</span>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="text-xs bg-white/10 px-3 py-1.5 rounded-full">退出</button>
        </div>
        <div className="bg-white/10 rounded-xl p-3 mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span>{levelTitle}</span>
            <span>{levelProgress.progress}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2"><div className="bg-white rounded-full h-2 transition-all" style={{ width: `${Math.min(levelProgress.progress, 100)}%` }}></div></div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center"><div className="text-lg font-bold">{memes.length}</div><div className="text-[10px] text-white/60">梗</div></div>
          <div className="text-center"><div className="text-lg font-bold">{formatNum(memes.reduce((s, m) => s + (m.view_count || 0), 0))}</div><div className="text-[10px] text-white/60">曝光</div></div>
          <div className="text-center"><div className="text-lg font-bold">{formatNum(memes.reduce((s, m) => s + (m.like_count || 0), 0))}</div><div className="text-[10px] text-white/60">点赞</div></div>
          <div className="text-center"><div className="text-lg font-bold">{user.points || 0}</div><div className="text-[10px] text-white/60">积分</div></div>
        </div>
      </div>

      {/* Tab */}
      <div className="flex bg-white border-b border-gray-100">
        {(['memes', 'achievements', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 text-sm font-medium ${tab === t ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400'}`}>
            {t === 'memes' ? '我的梗' : t === 'achievements' ? '成就' : '数据'}
          </button>
        ))}
      </div>

      {/* 内容 */}
      <div className="px-5 pt-4">
        {tab === 'memes' && (
          loading ? <div className="text-center py-10 text-gray-400">加载中...</div> :
          memes.length === 0 ? <div className="text-center py-10 text-gray-400">还没有梗，去造一个吧</div> :
          <div className="space-y-3">
            {memes.map(meme => (
              <div key={meme.id} className="bg-white rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 text-[10px] rounded-full ${meme.status === 'viral' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                    {meme.status === 'viral' ? '🔥 爆款' : '已发布'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">{meme.title}</h3>
                <p className="text-sm text-gray-500 mb-2 line-clamp-2">{meme.content}</p>
                <div className="flex gap-4 text-xs text-gray-400">
                  <span>👁 {formatNum(meme.view_count)}</span>
                  <span>❤️ {formatNum(meme.like_count)}</span>
                  <span>🔄 {formatNum(meme.share_count)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'achievements' && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: '🚀', name: '首次发布', desc: '发布第一个梗' },
              { icon: '🔥', name: '爆款制造机', desc: '单个梗超过1万曝光' },
              { icon: '💬', name: '话题达人', desc: '参与10个话题' },
              { icon: '🎯', name: '精准打击', desc: '点赞率超过80%' },
              { icon: '🌟', name: '社区之星', desc: '获得100个关注者' },
              { icon: '💎', name: '传奇巨浪', desc: '达到50级' },
            ].map((a, i) => (
              <div key={i} className="bg-white rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">{a.icon}</div>
                <div className="text-xs font-bold text-gray-900">{a.name}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{a.desc}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'stats' && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">📊 数据概览</h3>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-sm text-gray-500">总梗数</span><span className="text-sm font-bold">{memes.length}</span></div>
                <div className="flex justify-between"><span className="text-sm text-gray-500">总曝光</span><span className="text-sm font-bold">{formatNum(memes.reduce((s, m) => s + (m.view_count || 0), 0))}</span></div>
                <div className="flex justify-between"><span className="text-sm text-gray-500">总点赞</span><span className="text-sm font-bold">{formatNum(memes.reduce((s, m) => s + (m.like_count || 0), 0))}</span></div>
                <div className="flex justify-between"><span className="text-sm text-gray-500">总分享</span><span className="text-sm font-bold">{formatNum(memes.reduce((s, m) => s + (m.share_count || 0), 0))}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
