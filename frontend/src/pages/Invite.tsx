// ===== 邀请好友页面 =====

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOrCreateInviteCode, getInviteStats, getInviteLeaderboard, claimInviteCode } from '../lib/api/client'
import { toast } from '../lib/toast'

const GROWTH_LEVELS = [
  { key: 'newbie', label: '新手', icon: '🌱', min: 0, color: 'text-gray-400' },
  { key: 'starter', label: '入门', icon: '🌿', min: 1, color: 'text-green-500' },
  { key: 'promoter', label: '推广员', icon: '🔥', min: 5, color: 'text-orange-500' },
  { key: 'expert', label: '推广专家', icon: '⭐', min: 10, color: 'text-yellow-500' },
  { key: 'master', label: '推广大师', icon: '🏅', min: 20, color: 'text-blue-500' },
  { key: 'legend', label: '传说推广者', icon: '👑', min: 50, color: 'text-purple-500' },
]

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 6; i++) result += chars[Math.floor(Math.random() * chars.length)]
  return result
}

export default function Invite({ user }: { user: any }) {
  const navigate = useNavigate()
  const [myCode, setMyCode] = useState('')
  const [inviteCount, setInviteCount] = useState(0)
  const [totalBonus, setTotalBonus] = useState(0)
  const [recentInvites, setRecentInvites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [inputCode, setInputCode] = useState('')
  const [claiming, setClaiming] = useState(false)
  const [leaderboard, setLeaderboard] = useState<any[]>([])

  useEffect(() => {
    if (user?.id) loadInviteData()
  }, [user?.id])

  const loadInviteData = async () => {
    if (!user?.id) return
    setLoading(true)

    // 获取或创建邀请码
    try {
      const code = await getOrCreateInviteCode()
      if (code) setMyCode(code)
    } catch {}

    // 获取邀请统计
    try {
      const stats = await getInviteStats()
      if (stats) {
        setInviteCount(stats.inviteCount || 0)
        setTotalBonus(stats.totalBonus || 0)
        setRecentInvites((stats.recentInvites || []).slice(0, 10))
      }
    } catch {}

    setLoading(false)

    // 加载排行榜
    try {
      const board = await getInviteLeaderboard()
      setLeaderboard(board)
    } catch {}
  }

  const handleShare = () => {
    const url = `${window.location.origin}/register?ref=${myCode}`
    const text = `🌊 来巨浪一起赚积分！用我的邀请码 ${myCode} 注册，我们都得奖励！每天刷内容、帮推好物就能赚钱💰`
    if (navigator.share) {
      navigator.share({ title: '巨浪邀请', text, url })
    } else {
      navigator.clipboard.writeText(text + '\n' + url)
      toast.success('邀请链接已复制 ✓')
    }
  }

  const handleClaimCode = async () => {
    if (!inputCode.trim() || claiming) return
    if (!user?.id) return navigate('/login')
    if (inputCode.trim().toUpperCase() === myCode) {
      toast.info('不能邀请自己哦 😄')
      return
    }
    setClaiming(true)
    try {
      await claimInviteCode(inputCode.trim())
      toast.success('🎉 邀请码使用成功！+50积分')
      setInputCode('')
      loadInviteData()
    } catch (e: any) {
      if (e.message?.includes('已使用') || e.message?.includes('不存在')) {
        toast.error(e.message)
      } else {
        toast.error(e.message || '使用邀请码失败')
      }
    } finally {
      setClaiming(false)
    }
  }

  const getCurrentLevel = () => {
    for (let i = GROWTH_LEVELS.length - 1; i >= 0; i--) {
      if (inviteCount >= GROWTH_LEVELS[i].min) return GROWTH_LEVELS[i]
    }
    return GROWTH_LEVELS[0]
  }

  const getNextLevel = () => {
    for (const level of GROWTH_LEVELS) {
      if (inviteCount < level.min) return level
    }
    return null
  }

  const currentLevel = getCurrentLevel()
  const nextLevel = getNextLevel()
  const progressToNext = nextLevel ? Math.min(100, Math.round(inviteCount / nextLevel.min * 100)) : 100

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">加载中...</div>
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* 头部 */}
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 px-5 pt-12 pb-8 text-white">
        <button onClick={() => navigate(-1)} className="text-white/70 mb-4">← 返回</button>
        <h1 className="text-2xl font-bold mb-1">邀请好友</h1>
        <p className="text-white/70 text-sm">邀请越多，赚得越多，中奖概率越高</p>

        {/* 等级卡片 */}
        <div className="mt-5 bg-white/10 backdrop-blur-xl rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{currentLevel.icon}</span>
              <div>
                <div className={`font-bold ${currentLevel.color}`}>{currentLevel.label}</div>
                <div className="text-xs text-white/50">已邀请 {inviteCount} 人</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{totalBonus}</div>
              <div className="text-xs text-white/50">累计积分</div>
            </div>
          </div>

          {/* 进度条 */}
          {nextLevel && (
            <div>
              <div className="flex justify-between text-xs text-white/50 mb-1">
                <span>距离 {nextLevel.label}</span>
                <span>{inviteCount}/{nextLevel.min}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progressToNext}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 邀请码 */}
      <div className="mx-5 -mt-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-3">🎟️ 我的邀请码</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-center">
            <span className="text-2xl font-mono font-bold tracking-[0.3em] text-gray-900">{myCode}</span>
          </div>
          <button onClick={() => {
            navigator.clipboard.writeText(myCode)
            toast.success('已复制 ✓')
          }} className="px-4 py-3 bg-gray-100 rounded-xl text-sm font-medium text-gray-600">
            复制
          </button>
        </div>

        <button onClick={handleShare} className="w-full mt-3 py-3 bg-black text-white rounded-xl font-bold text-sm active:scale-[0.98] transition-transform">
          📤 邀请好友
        </button>
      </div>

      {/* 奖励规则 */}
      <div className="mx-5 mt-4 bg-white rounded-2xl p-5 border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-3">🎁 邀请奖励</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center text-sm">💰</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">邀请注册 +100积分</div>
              <div className="text-xs text-gray-400">好友用你的码注册，你得100积分</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-sm">🎁</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">好友注册 +50积分</div>
              <div className="text-xs text-gray-400">好友用邀请码注册即得50积分</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center text-sm">🎯</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">实物奖中奖概率 x1.5</div>
              <div className="text-xs text-gray-400">邀请好友参与，中奖概率提升50%</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-pink-50 rounded-full flex items-center justify-center text-sm">🏅</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">推荐成就解锁</div>
              <div className="text-xs text-gray-400">推荐满5/10/20人解锁专属成就和称号</div>
            </div>
          </div>
        </div>
      </div>

      {/* 输入邀请码 */}
      <div className="mx-5 mt-4 bg-white rounded-2xl p-5 border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-3">🔑 使用邀请码</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputCode}
            onChange={e => setInputCode(e.target.value.toUpperCase())}
            placeholder="输入好友的邀请码"
            maxLength={6}
            className="flex-1 px-4 py-3 bg-gray-50 rounded-xl text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
          <button
            onClick={handleClaimCode}
            disabled={!inputCode.trim() || claiming}
            className={`px-5 py-3 rounded-xl text-sm font-bold ${
              inputCode.trim() ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-400'
            }`}
          >
            {claiming ? '...' : '领取'}
          </button>
        </div>
      </div>

      {/* 等级体系 */}
      <div className="mx-5 mt-4 bg-white rounded-2xl p-5 border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-3">🏆 推广等级</h3>
        <div className="space-y-2">
          {GROWTH_LEVELS.map(level => (
            <div key={level.key} className={`flex items-center gap-3 p-2 rounded-lg ${inviteCount >= level.min ? 'bg-gray-50' : 'opacity-40'}`}>
              <span className="text-xl">{level.icon}</span>
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">{level.label}</span>
                <span className="text-xs text-gray-400 ml-2">≥{level.min}人</span>
              </div>
              {inviteCount >= level.min && <span className="text-xs text-green-500">✅ 已达成</span>}
            </div>
          ))}
        </div>
      </div>

      {/* 最近邀请 */}
      {recentInvites.length > 0 && (
        <div className="mx-5 mt-4 bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-3">👥 最近邀请 ({inviteCount})</h3>
          <div className="space-y-3">
            {recentInvites.map(invite => (
              <div key={invite.id} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">
                  {invite.referred?.avatar || '👤'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {invite.referred?.name || '新用户'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(invite.created_at).toLocaleDateString('zh-CN')}
                  </div>
                </div>
                <div className="text-xs text-green-500 font-medium">+{invite.referrer_reward}积分</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 邀请排行榜 */}
      {leaderboard.length > 0 && (
        <div className="mx-5 mt-4 bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-3">🏅 邀请排行榜</h3>
          <div className="space-y-2">
            {leaderboard.map(item => (
              <div key={item.userId} className={`flex items-center gap-3 p-2 rounded-lg ${item.userId === user?.id ? 'bg-purple-50' : ''}`}>
                <span className={`text-sm font-bold w-6 text-center ${item.rank <= 3 ? 'text-orange-500' : 'text-gray-400'}`}>
                  {item.rank <= 3 ? ['🥇', '🥈', '🥉'][item.rank - 1] : `#${item.rank}`}
                </span>
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">{item.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {item.name} {item.userId === user?.id && <span className="text-xs text-purple-500">(我)</span>}
                  </div>
                </div>
                <div className="text-xs text-gray-500">{item.inviteCount}人</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
