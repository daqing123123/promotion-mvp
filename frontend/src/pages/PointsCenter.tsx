// ===== 积分中心 — 所有赚积分的方式 =====

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTodayShareCount, getTodaySignIn, getPointsHistory } from '../lib/api/client'

interface PointTask {
  id: string
  icon: string
  name: string
  desc: string
  points: number
  limit: string
  done: boolean
  action?: () => void
}

export default function PointsCenter({ user }: { user: any }) {
  const navigate = useNavigate()
  const [todayShared, setTodayShared] = useState(0)
  const [todaySigned, setTodaySigned] = useState(false)
  const [todayLikes, setTodayLikes] = useState(0)
  const [todayComments, setTodayComments] = useState(0)

  useEffect(() => {
    if (user?.id) loadProgress()
  }, [user?.id])

  const loadProgress = async () => {
    if (!user?.id) return
    try {
      const [shareCount, signed, history] = await Promise.all([
        getTodayShareCount(),
        getTodaySignIn(),
        getPointsHistory(200),
      ])
      setTodayShared(shareCount)
      setTodaySigned(signed)

      // 今日点赞/评论数 — 从积分历史中统计
      const today = new Date().toISOString().split('T')[0]
      const todayLogs = (history || []).filter(
        (log: any) => log.created_at >= today + 'T00:00:00'
      )
      setTodayLikes(todayLogs.filter((log: any) => log.type === 'like').length)
      setTodayComments(todayLogs.filter((log: any) => log.type === 'comment').length)
    } catch {}
  }

  const dailyTasks: PointTask[] = [
    { id: 'signin', icon: '📅', name: '每日签到', desc: todaySigned ? '今日已签到' : '连续签到更多天数，奖励越高', points: todaySigned ? 0 : 10, limit: '每日1次', done: todaySigned, action: () => navigate('/checkin') },
    { id: 'share', icon: '📤', name: '分享内容', desc: `今日已分享 ${todayShared}/10 次`, points: 3, limit: '每日10次', done: todayShared >= 10 },
    { id: 'like', icon: '❤️', name: '点赞内容', desc: `今日已点赞 ${todayLikes}/25 次`, points: 5, limit: '每日25次', done: todayLikes >= 25 },
    { id: 'comment', icon: '💬', name: '评论内容', desc: `今日已评论 ${todayComments}/5 次`, points: 5, limit: '每日5次', done: todayComments >= 5 },
    { id: 'promote', icon: '🔥', name: '帮推内容', desc: '帮推好内容，赚积分', points: 20, limit: '每日5次', done: false },
  ]

  const bonusTasks: PointTask[] = [
    { id: 'invite', icon: '👥', name: '邀请好友注册', desc: '好友用你的码注册，双方都得积分', points: 100, limit: '无上限', done: false, action: () => navigate('/invite') },
    { id: 'publish', icon: '✏️', name: '发布内容', desc: '发布原创内容', points: 50, limit: '每日3次', done: false, action: () => navigate('/publish') },
    { id: 'viral', icon: '🚀', name: '内容爆了', desc: '内容获得100+点赞', points: 500, limit: '自动触发', done: false },
    { id: 'achievement', icon: '🏆', name: '解锁成就', desc: '完成成就获得额外积分', points: 100, limit: '按成就', done: false, action: () => navigate('/profile') },
  ]

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* 头部 */}
      <div className="bg-gradient-to-br from-yellow-500 to-orange-500 px-5 pt-12 pb-8 text-white">
        <button onClick={() => navigate(-1)} className="text-white/70 mb-4">← 返回</button>
        <h1 className="text-2xl font-bold mb-1">积分中心</h1>
        <p className="text-white/70 text-sm">做任务赚积分，积分可兑换奖励</p>
        <div className="mt-4 bg-white/10 backdrop-blur-xl rounded-2xl p-5 text-center">
          <div className="text-4xl font-bold">{user?.points || 0}</div>
          <div className="text-xs text-white/60 mt-1">当前积分</div>
        </div>
      </div>

      {/* 每日任务 */}
      <div className="mx-5 -mt-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-3">📋 每日任务</h3>
        <div className="space-y-3">
          {dailyTasks.map(task => (
            <div key={task.id} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl">{task.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{task.name}</div>
                <div className="text-xs text-gray-400">{task.desc}</div>
              </div>
              <div className="text-right">
                {task.done ? (
                  <span className="text-xs text-green-500 font-medium">✓ 完成</span>
                ) : (
                  <div>
                    <div className="text-sm font-bold text-orange-500">+{task.points}</div>
                    <div className="text-[10px] text-gray-300">{task.limit}</div>
                  </div>
                )}
              </div>
              {task.action && !task.done && (
                <button onClick={task.action} className="px-3 py-1.5 bg-orange-50 text-orange-600 text-xs rounded-lg font-medium">
                  去做
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 额外奖励 */}
      <div className="mx-5 mt-4 bg-white rounded-2xl p-5 border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-3">🎁 额外奖励</h3>
        <div className="space-y-3">
          {bonusTasks.map(task => (
            <div key={task.id} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl">{task.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{task.name}</div>
                <div className="text-xs text-gray-400">{task.desc}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-purple-500">+{task.points}</div>
                <div className="text-[10px] text-gray-300">{task.limit}</div>
              </div>
              {task.action && (
                <button onClick={task.action} className="px-3 py-1.5 bg-purple-50 text-purple-600 text-xs rounded-lg font-medium">
                  去做
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 积分规则 */}
      <div className="mx-5 mt-4 bg-white rounded-2xl p-5 border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-3">📖 积分规则</h3>
        <div className="space-y-2 text-xs text-gray-500">
          <p>• 每日积分上限 500 积分</p>
          <p>• 同一内容重复点赞/分享不重复计分</p>
          <p>• 邀请好友注册无上限</p>
          <p>• 内容爆款奖励自动触发</p>
          <p>• 积分可用于兑换优惠券、参与投票、兑换实物奖品</p>
        </div>
      </div>
    </div>
  )
}
