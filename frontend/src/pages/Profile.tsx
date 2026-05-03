// ===== 个人主页 =====

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase/client'
import { levelTitle, levelProgress as calcLevelProgress, formatXP, xpForNextLevel } from '../lib/levels'
import { getAchievementProgressList, AchievementDef } from '../lib/achievements'
import { toast } from '../lib/toast'

const GROWTH_LEVELS: Record<string, { name: string; icon: string; color: string }> = {
  newbie: { name: '新手', icon: '🌱', color: 'text-gray-500' },
  starter: { name: '入门', icon: '🌿', color: 'text-green-500' },
  promoter: { name: '推广达人', icon: '🌳', color: 'text-blue-500' },
  expert: { name: '资深达人', icon: '⭐', color: 'text-yellow-500' },
  master: { name: '大师', icon: '👑', color: 'text-purple-500' },
  legend: { name: '传奇', icon: '🏆', color: 'text-orange-500' },
}

export default function Profile({ user, setUser }: { user: any; setUser: (u: any) => void }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'memes' | 'achievements' | 'stats'>('memes')
  const [myContents, setMyContents] = useState<any[]>([])
  const [achievements, setAchievements] = useState<(AchievementDef & { isUnlocked: boolean; progress: { current: number; max: number } })[]>([])
  const [loading, setLoading] = useState(true)
  const [myCode, setMyCode] = useState('')
  const [inviteCount, setInviteCount] = useState(0)
  const [growthLevel, setGrowthLevel] = useState('newbie')

  useEffect(() => {
    if (user) {
      fetchMyContents()
      loadAchievements()
      fetchGrowthData()
    }
  }, [user])

  const fetchGrowthData = async () => {
    if (!user) return
    try {
      // 获取我的邀请码
      const { data: codeData } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('user_id', user.id)
        .maybeSingle()
      if (codeData) setMyCode(codeData.code)

      // 获取邀请人数
      const { count } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', user.id)
      setInviteCount(count || 0)

      // 计算成长等级
      const c = count || 0
      if (c >= 50) setGrowthLevel('legend')
      else if (c >= 20) setGrowthLevel('master')
      else if (c >= 10) setGrowthLevel('expert')
      else if (c >= 5) setGrowthLevel('promoter')
      else if (c >= 1) setGrowthLevel('starter')
      else setGrowthLevel('newbie')
    } catch {}
  }

  const loadAchievements = async () => {
    if (!user) return
    try {
      const data = await getAchievementProgressList(user.id)
      setAchievements(data)
    } catch {
      // ignore
    }
  }

  const fetchMyContents = async () => {
    if (!user) return
    setLoading(true)
    const [memesRes, contentsRes] = await Promise.all([
      supabase.from('memes').select('*').eq('creator_id', user.id).order('created_at', { ascending: false }),
      supabase.from('contents').select('*').eq('creator_id', user.id).order('created_at', { ascending: false }),
    ])
    const memes = (memesRes.data || []).map(m => ({ ...m, _source: 'memes' }))
    const contents = (contentsRes.data || []).map(c => ({ ...c, _source: 'contents' }))
    setMyContents([...memes, ...contents].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ))
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

  const lvl = user.level || 1
  const levelTitleText = levelTitle(lvl)
  const progress = calcLevelProgress(user.experience || 0, lvl)
  const nextXP = xpForNextLevel(lvl)

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
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Lv.{lvl}</span>
                <span className="text-xs text-white/60">{levelTitleText}</span>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="text-xs bg-white/10 px-3 py-1.5 rounded-full">退出</button>
        </div>
        <div className="bg-white/10 rounded-xl p-3 mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span>{levelTitleText}</span>
            <span>Lv.{lvl} → Lv.{Math.min(lvl + 1, 100)}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2"><div className="bg-white rounded-full h-2 transition-all" style={{ width: `${Math.min(progress * 100, 100)}%` }}></div></div>
          <div className="flex justify-between text-[10px] text-white/50 mt-1">
            <span>{formatXP(user.experience || 0)} XP</span>
            <span>下级需要 {formatXP(nextXP)} XP</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center"><div className="text-lg font-bold">{myContents.length}</div><div className="text-[10px] text-white/60">内容</div></div>
          <div className="text-center"><div className="text-lg font-bold">{formatNum(myContents.reduce((s, m) => s + (m.view_count || 0), 0))}</div><div className="text-[10px] text-white/60">曝光</div></div>
          <div className="text-center"><div className="text-lg font-bold">{formatNum(myContents.reduce((s, m) => s + (m.like_count || 0), 0))}</div><div className="text-[10px] text-white/60">点赞</div></div>
          <div className="text-center"><div className="text-lg font-bold">{user.points || 0}</div><div className="text-[10px] text-white/60">积分</div></div>
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="mx-5 mt-4 grid grid-cols-4 gap-3">
        <button onClick={() => navigate('/points-center')} className="bg-white rounded-xl p-3 text-center border border-gray-100">
          <div className="text-xl mb-1">💰</div>
          <div className="text-[10px] text-gray-600">积分中心</div>
        </button>
        <button onClick={() => navigate('/invite')} className="bg-white rounded-xl p-3 text-center border border-gray-100">
          <div className="text-xl mb-1">👥</div>
          <div className="text-[10px] text-gray-600">邀请好友</div>
        </button>
        <button onClick={() => navigate('/checkin')} className="bg-white rounded-xl p-3 text-center border border-gray-100">
          <div className="text-xl mb-1">📅</div>
          <div className="text-[10px] text-gray-600">签到</div>
        </button>
        <button onClick={() => navigate('/achievements')} className="bg-white rounded-xl p-3 text-center border border-gray-100">
          <div className="text-xl mb-1">🏆</div>
          <div className="text-[10px] text-gray-600">成就</div>
        </button>
      </div>

      {/* 邀请码 & 成长等级 */}
      {myCode && (
        <div className="mx-5 mt-4 bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{GROWTH_LEVELS[growthLevel]?.icon || '🌱'}</span>
              <div>
                <span className={`text-xs font-bold ${GROWTH_LEVELS[growthLevel]?.color || 'text-gray-500'}`}>
                  {GROWTH_LEVELS[growthLevel]?.name || '新手'}
                </span>
                <span className="text-xs text-gray-400 ml-2">邀请 {inviteCount} 人</span>
              </div>
            </div>
            <button onClick={() => navigate('/invite')} className="text-xs bg-black text-white px-3 py-1.5 rounded-full">
              邀请好友
            </button>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
            <span className="text-xs text-gray-400">邀请码</span>
            <span className="text-base font-mono font-bold tracking-widest">{myCode}</span>
            <button onClick={() => { navigator.clipboard.writeText(myCode); toast.success('已复制') }} className="ml-auto text-xs text-blue-500">复制</button>
          </div>
        </div>
      )}

      {/* Tab */}
      <div className="flex bg-white border-b border-gray-100">
        {(['memes', 'achievements', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 text-sm font-medium ${tab === t ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400'}`}>
            {t === 'memes' ? '我的内容' : t === 'achievements' ? '成就' : '数据'}
          </button>
        ))}
      </div>

      {/* 内容 */}
      <div className="px-5 pt-4">
        {tab === 'memes' && (
          loading ? <div className="text-center py-10 text-gray-400">加载中...</div> :
          myContents.length === 0 ? <div className="text-center py-10 text-gray-400">还没有内容，去发布一个吧</div> :
          <div className="space-y-3">
            {myContents.map(item => (
              <div key={item.id} className="bg-white rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-600">
                    {item._source === 'memes' ? '📝 段子' : `📦 ${item.type}`}
                  </span>
                  {item.status === 'viral' && (
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-red-50 text-red-500">🔥 爆款</span>
                  )}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500 mb-2 line-clamp-2">{item.content || item.description}</p>
                <div className="flex gap-4 text-xs text-gray-400">
                  <span>👁 {formatNum(item.view_count)}</span>
                  <span>❤️ {formatNum(item.like_count)}</span>
                  <span>🔄 {formatNum(item.share_count || 0)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'achievements' && (
          achievements.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">加载中...</div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {achievements.map(a => (
                <div key={a.id} className={`rounded-xl p-4 text-center ${a.isUnlocked ? 'bg-white border border-yellow-200' : 'bg-gray-50 opacity-50'}`}>
                  <div className="text-3xl mb-2">{a.icon}</div>
                  <div className="text-xs font-bold text-gray-900">{a.name}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{a.desc}</div>
                  {a.isUnlocked && <div className="text-[10px] text-yellow-500 mt-1">✓ 已达成</div>}
                  {!a.isUnlocked && a.progress.max > 0 && (
                    <div className="text-[10px] text-gray-300 mt-1">{a.progress.current}/{a.progress.max}</div>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'stats' && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">📊 数据概览</h3>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-sm text-gray-500">总内容数</span><span className="text-sm font-bold">{myContents.length}</span></div>
                <div className="flex justify-between"><span className="text-sm text-gray-500">总曝光</span><span className="text-sm font-bold">{formatNum(myContents.reduce((s, m) => s + (m.view_count || 0), 0))}</span></div>
                <div className="flex justify-between"><span className="text-sm text-gray-500">总点赞</span><span className="text-sm font-bold">{formatNum(myContents.reduce((s, m) => s + (m.like_count || 0), 0))}</span></div>
                <div className="flex justify-between"><span className="text-sm text-gray-500">总分享</span><span className="text-sm font-bold">{formatNum(myContents.reduce((s, m) => s + (m.share_count || 0), 0))}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
