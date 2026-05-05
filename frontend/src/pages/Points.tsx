// ===== 积分中心（真实数据版） =====

import { useState, useEffect, useCallback } from 'react'
import { getPointsHistory, getPointsBalance } from '../lib/api/client'
import { getLevelTitle, getLevelBadge, getLevelColor } from '../lib/rewardSystem'

interface PointsProps {
  user: any
}

export default function Points({ user }: PointsProps) {
  const [activeTab, setActiveTab] = useState<'earn' | 'spend' | 'history' | 'level'>('earn')
  const [pointsBalance, setPointsBalance] = useState(0)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadPointsData = useCallback(async () => {
    if (!user) return
    try {
      const [balance, historyData] = await Promise.all([
        getPointsBalance(),
        getPointsHistory(50),
      ])
      setPointsBalance(balance)
      setHistory(historyData)
    } catch (err) {
      console.error('加载积分数据失败:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadPointsData()
  }, [loadPointsData])

  const currentLevel = user?.level || 1

  const earnRules = [
    { id: '1', action: '每日签到', points: '+10', icon: '📅', desc: '每天签到获得积分' },
    { id: '2', action: '发布内容', points: '+10', icon: '📝', desc: '每发布一条内容' },
    { id: '3', action: '点赞', points: '+5', icon: '❤️', desc: '每次点赞获得积分' },
    { id: '4', action: '帮推内容', points: '+20', icon: '🚀', desc: '每次帮推获得积分' },
    { id: '5', action: '评论', points: '+5', icon: '💬', desc: '每次评论获得积分' },
    { id: '6', action: '完成任务', points: '按任务', icon: '📋', desc: '完成任务获得积分' },
    { id: '7', action: '参与活动', points: '+10', icon: '🎯', desc: '参与活动获得积分' },
    { id: '8', action: '解锁成就', points: '按成就', icon: '🏆', desc: '解锁成就获得积分' },
    { id: '9', action: '连续签到', points: '+20~200', icon: '🔥', desc: '连续签到额外奖励' },
  ]

  const spendRules = [
    { id: '1', action: '投票', points: '按投票', icon: '🗳️', desc: '参与投票消耗积分' },
    { id: '2', action: '发起小浪', points: '100', icon: '🌊', desc: '基础推广' },
    { id: '3', action: '发起中浪', points: '300', icon: '🌊', desc: '中等推广' },
    { id: '4', action: '发起巨浪', points: '800', icon: '🌊', desc: '大规模推广' },
    { id: '5', action: '曝光加速', points: '50', icon: '🚀', desc: '24h曝光翻倍' },
    { id: '6', action: '置顶', points: '150', icon: '📌', desc: '置顶24小时' },
  ]

  // 计算本周统计
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const weekEarned = history
    .filter(h => h.amount > 0 && new Date(h.created_at) >= weekStart)
    .reduce((sum, h) => sum + h.amount, 0)

  const weekSpent = history
    .filter(h => h.amount < 0 && new Date(h.created_at) >= weekStart)
    .reduce((sum, h) => sum + Math.abs(h.amount), 0)

  return (
    <div className="max-w-lg mx-auto bg-black min-h-screen pb-16">
      <header className="sticky top-0 bg-black border-b border-white/10 z-40 px-4 py-3">
        <h1 className="text-xl font-bold text-white">积分中心</h1>
      </header>

      {/* 积分概览 */}
      <div className="px-4 py-6">
        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-white/80 text-sm">我的积分</div>
              <div className="text-5xl font-bold text-white">{loading ? '...' : pointsBalance}</div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{getLevelBadge(currentLevel)}</span>
                <span className={`text-xl font-bold ${getLevelColor(currentLevel)}`}>
                  {getLevelTitle(currentLevel)}
                </span>
              </div>
              <div className="text-white/60 text-sm">Lv.{currentLevel}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 标签页 */}
      <div className="bg-black px-4 py-2 border-b border-white/10">
        <div className="flex gap-2">
          {[
            { key: 'earn' as const, label: '💰 赚积分' },
            { key: 'spend' as const, label: '💸 花积分' },
            { key: 'level' as const, label: '📊 等级' },
            { key: 'history' as const, label: '📝 记录' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                activeTab === tab.key ? 'bg-white text-black' : 'bg-white/10 text-white/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* 赚积分 */}
        {activeTab === 'earn' && (
          <>
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4">
              <h3 className="text-green-400 font-bold mb-2">💰 如何赚取积分</h3>
              <p className="text-white/60 text-sm">通过签到、发布内容、帮推、评论等方式赚取积分</p>
            </div>
            {earnRules.map(rule => (
              <div key={rule.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <span className="text-2xl">{rule.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-white text-sm">{rule.action}</div>
                  <div className="text-xs text-white/40">{rule.desc}</div>
                </div>
                <span className="text-green-400 font-bold">{rule.points}</span>
              </div>
            ))}
          </>
        )}

        {/* 花积分 */}
        {activeTab === 'spend' && (
          <>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
              <h3 className="text-red-400 font-bold mb-2">💸 积分用途</h3>
              <p className="text-white/60 text-sm">积分可用于推广、投票、置顶等</p>
            </div>
            {spendRules.map(rule => (
              <div key={rule.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl opacity-60">
                <span className="text-2xl">{rule.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-white text-sm">{rule.action}</div>
                  <div className="text-xs text-white/40">{rule.desc}</div>
                </div>
                <div className="text-right">
                  <span className="text-red-400 font-bold">{rule.points}</span>
                  <div className="text-[10px] text-white/30 mt-0.5">即将上线</div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* 等级 */}
        {activeTab === 'level' && (
          <>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-4">
              <h3 className="text-blue-400 font-bold mb-2">📊 等级系统</h3>
              <p className="text-white/60 text-sm">积分越多等级越高，解锁更多特权</p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <div className="text-center mb-4">
                <div className="text-6xl mb-2">{getLevelBadge(currentLevel)}</div>
                <div className="text-3xl font-bold text-white">{getLevelTitle(currentLevel)}</div>
                <div className="text-white/60 text-sm">Lv.{currentLevel}</div>
              </div>
            </div>

            <div className="space-y-2">
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
              ].map(item => (
                <div
                  key={item.level}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    currentLevel >= item.level
                      ? 'bg-primary/20 border border-primary/30'
                      : 'bg-white/5'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentLevel >= item.level ? 'bg-primary text-white' : 'bg-white/10 text-white/40'
                  }`}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white">Lv.{item.level} {item.title}</div>
                  </div>
                  {currentLevel >= item.level && (
                    <div className="text-xs text-primary">✓ 已达成</div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* 历史记录 */}
        {activeTab === 'history' && (
          <>
            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-400">+{weekEarned}</div>
                  <div className="text-xs text-white/40">本周获得</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-400">-{weekSpent}</div>
                  <div className="text-xs text-white/40">本周消耗</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{pointsBalance}</div>
                  <div className="text-xs text-white/40">当前积分</div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-10 text-white/40">加载中...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-white/60">暂无积分记录</div>
              </div>
            ) : (
              history.map(record => (
                <div key={record.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <span className="text-2xl">{record.amount > 0 ? '💰' : '💸'}</span>
                  <div className="flex-1">
                    <div className="font-medium text-white text-sm">{record.description}</div>
                    <div className="text-xs text-white/40">
                      {new Date(record.created_at).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <span className={`font-bold ${record.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {record.amount > 0 ? '+' : ''}{record.amount}
                  </span>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
}
