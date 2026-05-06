// ===== 积分中心（合并版 — 真数据 + 任务追踪 + 盲盒） =====

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getPointsHistory,
  getPointsBalance,
  getTodayShareCount,
  getTodaySignIn,
  getPointLogsCount,
} from '../lib/api/client'
import {
  getLevelTitle,
  getLevelBadge,
  getLevelColor,
} from '../lib/rewardSystem'

interface PointsProps {
  user: any
}

export default function Points({ user }: PointsProps) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'earn' | 'spend' | 'level' | 'history'>('earn')
  const [pointsBalance, setPointsBalance] = useState(0)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 任务进度
  const [todayShared, setTodayShared] = useState(0)
  const [todaySigned, setTodaySigned] = useState(false)
  const [todayLikes, setTodayLikes] = useState(0)
  const [todayComments, setTodayComments] = useState(0)

  const loadPointsData = useCallback(async () => {
    if (!user?.id) return
    try {
      const [balance, historyData] = await Promise.all([
        getPointsBalance(),
        getPointsHistory(50),
      ])
      setPointsBalance(balance)
      setHistory(historyData)

      // 任务进度
      const [shareCount, signed] = await Promise.all([
        getTodayShareCount(user.id),
        getTodaySignIn(),
      ])
      setTodayShared(shareCount)
      setTodaySigned(signed)

      const today = new Date().toISOString().split('T')[0]
      const [likes, comments] = await Promise.all([
        getPointLogsCount(user.id, 'like', today),
        getPointLogsCount(user.id, 'comment', today),
      ]).catch(() => [0, 0])
      setTodayLikes(typeof likes === 'number' ? likes : 0)
      setTodayComments(typeof comments === 'number' ? comments : 0)
    } catch (err) {
      console.error('加载积分数据失败:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadPointsData()
  }, [loadPointsData])

  const currentLevel = user?.level || 1

  // 每日任务
  const dailyTasks = [
    {
      id: 'signin',
      icon: SignInIcon,
      name: '每日签到',
      desc: todaySigned ? '今日已签到' : '连续签到更多天数，奖励越高',
      points: todaySigned ? 0 : 10,
      limit: '每日1次',
      done: todaySigned,
      action: () => navigate('/checkin'),
    },
    {
      id: 'share',
      icon: ShareIcon,
      name: '分享内容',
      desc: `今日已分享 ${todayShared}/10 次`,
      points: 3,
      limit: '每日10次',
      done: todayShared >= 10,
    },
    {
      id: 'like',
      icon: HeartIcon,
      name: '点赞内容',
      desc: `今日已点赞 ${todayLikes}/25 次`,
      points: 5,
      limit: '每日25次',
      done: todayLikes >= 25,
    },
    {
      id: 'comment',
      icon: CommentIcon,
      name: '评论内容',
      desc: `今日已评论 ${todayComments}/5 次`,
      points: 5,
      limit: '每日5次',
      done: todayComments >= 5,
    },
    {
      id: 'promote',
      icon: BoostIcon,
      name: '帮推内容',
      desc: '帮推好内容，赚积分',
      points: 20,
      limit: '每日5次',
      done: false,
    },
  ]

  const bonusTasks = [
    {
      id: 'invite',
      icon: InviteIcon,
      name: '邀请好友注册',
      desc: '好友用你的码注册，双方都得积分',
      points: 100,
      limit: '无上限',
      done: false,
      action: () => navigate('/invite'),
    },
    {
      id: 'publish',
      icon: PublishIcon,
      name: '发布内容',
      desc: '发布原创内容',
      points: 50,
      limit: '每日3次',
      done: false,
      action: () => navigate('/publish'),
    },
    {
      id: 'viral',
      icon: ViralIcon,
      name: '内容爆了',
      desc: '内容获得100+点赞',
      points: 500,
      limit: '自动触发',
      done: false,
    },
    {
      id: 'achievement',
      icon: TrophyIcon,
      name: '解锁成就',
      desc: '完成成就获得额外积分',
      points: 100,
      limit: '按成就',
      done: false,
      action: () => navigate('/profile'),
    },
  ]

  // 本周统计
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const weekEarned = history
    .filter((h) => h.amount > 0 && new Date(h.created_at) >= weekStart)
    .reduce((sum, h) => sum + h.amount, 0)
  const weekSpent = history
    .filter((h) => h.amount < 0 && new Date(h.created_at) >= weekStart)
    .reduce((sum, h) => sum + Math.abs(h.amount), 0)

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* 顶栏 */}
      <header className="sticky top-0 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 z-40 px-5 py-4">
        <h1 className="text-lg font-bold text-white">积分中心</h1>
      </header>

      {/* 积分概览卡片 */}
      <div className="px-4 pt-4">
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1a1a2e 100%)',
            border: '1px solid rgba(99, 102, 241, 0.15)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-slate-400 text-sm mb-1">我的积分</div>
              <div className="text-5xl font-bold text-white">
                {loading ? '...' : pointsBalance}
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-3xl">{getLevelBadge(currentLevel)}</span>
                <span className={`text-xl font-bold ${getLevelColor(currentLevel)}`}>
                  {getLevelTitle(currentLevel)}
                </span>
              </div>
              <div className="text-slate-500 text-sm">Lv.{currentLevel}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 标签页 */}
      <div className="px-4 py-3">
        <div className="flex gap-1.5 bg-slate-800/50 rounded-xl p-1">
          {[
            { key: 'earn' as const, label: '赚积分' },
            { key: 'spend' as const, label: '花积分' },
            { key: 'level' as const, label: '等级' },
            { key: 'history' as const, label: '记录' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-3">
        {/* ======== 赚积分 ======== */}
        {activeTab === 'earn' && (
          <>
            {/* 每日任务 */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                每日任务
              </h3>
              <div className="space-y-2">
                {dailyTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/50"
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-800 shrink-0">
                      <task.icon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{task.name}</div>
                      <div className="text-xs text-slate-500 truncate">{task.desc}</div>
                    </div>
                    <div className="text-right shrink-0">
                      {task.done ? (
                        <span className="text-xs text-emerald-400 font-medium">✓ 完成</span>
                      ) : (
                        <div>
                          <div className="text-sm font-bold text-indigo-400">+{task.points}</div>
                          <div className="text-[10px] text-slate-600">{task.limit}</div>
                        </div>
                      )}
                    </div>
                    {task.action && !task.done && (
                      <button
                        onClick={task.action}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 shrink-0"
                      >
                        去做
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 额外奖励 */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-amber-500 rounded-full" />
                额外奖励
              </h3>
              <div className="space-y-2">
                {bonusTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/50"
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-800 shrink-0">
                      <task.icon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{task.name}</div>
                      <div className="text-xs text-slate-500 truncate">{task.desc}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-amber-400">+{task.points}</div>
                      <div className="text-[10px] text-slate-600">{task.limit}</div>
                    </div>
                    {task.action && (
                      <button
                        onClick={task.action}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 shrink-0"
                      >
                        去做
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 盲盒入口 */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #2a1a3e 100%)',
                border: '1px solid rgba(255, 107, 107, 0.2)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white mb-1">积分盲盒</h3>
                  <p className="text-xs text-slate-500">
                    花30积分开一次，随机出积分/特效/碎片/神秘奖励！
                  </p>
                </div>
                <button
                  onClick={() => navigate('/blind-box')}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #ff6b6b, #ffd93d)',
                    color: '#1a1a2e',
                  }}
                >
                  去开盲盒
                </button>
              </div>
            </div>

            {/* 积分规则 */}
            <div className="bg-slate-800/20 border border-slate-700/30 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-3">积分规则</h3>
              <div className="space-y-1.5 text-xs text-slate-500">
                <p>• 每日积分上限 500 积分</p>
                <p>• 同一内容重复点赞/分享不重复计分</p>
                <p>• 邀请好友注册无上限</p>
                <p>• 内容爆款奖励自动触发</p>
                <p>• 积分可用于兑换优惠券、参与投票、兑换实物奖品</p>
              </div>
            </div>
          </>
        )}

        {/* ======== 花积分 ======== */}
        {activeTab === 'spend' && (
          <>
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
              <p className="text-slate-400 text-sm">
                积分可用于推广、投票、置顶等。点击下方卡片进入对应功能页面。
              </p>
            </div>
            {[
              { id: 'boost', icon: BoostIcon, name: '曝光加速', cost: 50, desc: '24小时曝光翻倍', nav: '/profile' },
              { id: 'pin', icon: PinIcon, name: '内容置顶', cost: 150, desc: '置顶24小时', nav: '/profile' },
              { id: 'vote', icon: VoteIcon, name: '投票', cost: '按投票', desc: '参与投票消耗积分', nav: '/topics' },
              { id: 'topic', icon: WaveIcon, name: '发布话题', cost: '自定', desc: '设置奖励池吸引推广', nav: '/publish' },
            ].map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(item.nav)}
                className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 cursor-pointer hover:border-indigo-500/30 transition-all"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-800 shrink-0">
                  <item.icon />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{item.name}</div>
                  <div className="text-xs text-slate-500">{item.desc}</div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-rose-400">{item.cost}</span>
                  <div className="text-[10px] text-indigo-400 mt-0.5">去使用 →</div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ======== 等级 ======== */}
        {activeTab === 'level' && (
          <>
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5 mb-3 text-center">
              <div className="text-6xl mb-3">{getLevelBadge(currentLevel)}</div>
              <div className="text-2xl font-bold text-white">{getLevelTitle(currentLevel)}</div>
              <div className="text-slate-500 text-sm mt-1">Lv.{currentLevel}</div>
              <p className="text-slate-500 text-xs mt-3">积分越多等级越高，解锁更多特权</p>
            </div>
            <div className="space-y-1.5">
              {[
                { level: 1, title: '泡沫', icon: '🫧' },
                { level: 5, title: '水滴', icon: '💧' },
                { level: 10, title: '小浪花', icon: '💎' },
                { level: 20, title: '中流击水', icon: '⭐' },
                { level: 30, title: '乘风破浪', icon: '🚀' },
                { level: 40, title: '浪尖舞者', icon: '✨' },
                { level: 50, title: '巨浪行者', icon: '💪' },
                { level: 60, title: '潮汐大师', icon: '🔥' },
                { level: 70, title: '风暴领主', icon: '⚡' },
                { level: 80, title: '海洋之王', icon: '👑' },
                { level: 90, title: '传奇巨浪', icon: '🌊' },
              ].map((item) => (
                <div
                  key={item.level}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    currentLevel >= item.level
                      ? 'bg-indigo-600/10 border border-indigo-500/30'
                      : 'bg-slate-800/20'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      currentLevel >= item.level ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white">
                      Lv.{item.level} {item.title}
                    </div>
                  </div>
                  {currentLevel >= item.level && (
                    <div className="text-xs text-indigo-400">✓ 已达成</div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ======== 记录 ======== */}
        {activeTab === 'history' && (
          <>
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5 mb-3">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-emerald-400">+{weekEarned}</div>
                  <div className="text-xs text-slate-500 mt-1">本周获得</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-rose-400">-{weekSpent}</div>
                  <div className="text-xs text-slate-500 mt-1">本周消耗</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{pointsBalance}</div>
                  <div className="text-xs text-slate-500 mt-1">当前积分</div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-10 text-slate-500">加载中...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                    className="text-slate-600">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <p className="text-slate-500">暂无积分记录</p>
                <p className="text-slate-600 text-xs mt-1">完成任务或消费积分后这里会显示</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {history.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/20 border border-slate-800/50"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      record.amount > 0 ? 'bg-emerald-900/30' : 'bg-rose-900/30'
                    }`}>
                      <span className="text-sm">{record.amount > 0 ? '↑' : '↓'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{record.description}</div>
                      <div className="text-xs text-slate-600">
                        {new Date(record.created_at).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    <span
                      className={`text-sm font-bold shrink-0 ${
                        record.amount > 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {record.amount > 0 ? '+' : ''}
                      {record.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ============================================
// 内联 SVG 图标
// ============================================

function SignInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-indigo-400">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="14" x2="8" y2="14" /><line x1="12" y1="14" x2="12" y2="14" /><line x1="16" y1="14" x2="16" y2="14" />
      <line x1="8" y1="18" x2="12" y2="18" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-blue-400">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-rose-400">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function CommentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-amber-400">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function BoostIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-orange-400">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function InviteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-purple-400">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function PublishIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-emerald-400">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  )
}

function ViralIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-pink-400">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function TrophyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-yellow-400">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-amber-400">
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
    </svg>
  )
}

function VoteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-cyan-400">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="9" x2="15" y2="9" /><line x1="9" y1="13" x2="13" y2="13" />
      <line x1="9" y1="17" x2="11" y2="17" />
    </svg>
  )
}

function WaveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-blue-400">
      <path d="M2 12c1.5-2 4-4 6-2s3 4 5 2 3-3 5-2 4 2 4 4" />
      <path d="M2 16c1.5-2 4-4 6-2s3 4 5 2 3-3 5-2 4 2 4 4" />
      <path d="M2 8c1.5-2 4-4 6-2s3 4 5 2 3-3 5-2 4 2 4 4" />
    </svg>
  )
}
