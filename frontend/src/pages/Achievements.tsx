// ===== 成就页面（真实数据版） =====

import { useState, useEffect, useCallback } from 'react'
import { getAchievementProgressList, AchievementDef } from '../lib/achievements'

interface AchievementWithProgress extends AchievementDef {
  isUnlocked: boolean
  progress: { current: number; max: number }
}

interface AchievementsProps {
  user: any
}

export default function Achievements({ user }: AchievementsProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'promote' | 'create' | 'checkin' | 'social' | 'special'>('all')
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([])
  const [loading, setLoading] = useState(true)

  const loadAchievements = useCallback(async () => {
    if (!user) return
    try {
      const data = await getAchievementProgressList(user.id)
      setAchievements(data)
    } catch (err) {
      console.error('加载成就失败:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadAchievements()
  }, [loadAchievements])

  const filtered = activeTab === 'all'
    ? achievements
    : achievements.filter(a => a.category === activeTab)

  const unlockedCount = achievements.filter(a => a.isUnlocked).length
  const totalCount = achievements.length

  return (
    <div className="max-w-lg mx-auto bg-black min-h-screen pb-16">
      <header className="sticky top-0 bg-black border-b border-white/10 z-40 px-4 py-3">
        <h1 className="text-xl font-bold text-white">🏆 成就系统</h1>
      </header>

      {/* 成就概览 */}
      <div className="p-4">
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-white/80 text-sm">已解锁成就</div>
              <div className="text-5xl font-bold text-white">{unlockedCount}</div>
            </div>
            <div className="text-right">
              <div className="text-white/80 text-sm">总成就数</div>
              <div className="text-5xl font-bold text-white">{totalCount}</div>
            </div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <div
              className="bg-white h-3 rounded-full transition-all"
              style={{ width: `${totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
          <div className="text-center text-sm text-white/60 mt-2">
            完成度 {totalCount > 0 ? ((unlockedCount / totalCount) * 100).toFixed(0) : 0}%
          </div>
        </div>
      </div>

      {/* 标签页 */}
      <div className="bg-black px-4 py-2 border-b border-white/10 overflow-x-auto">
        <div className="flex gap-2">
          {[
            { key: 'all' as const, label: '全部' },
            { key: 'promote' as const, label: '🚀 帮推' },
            { key: 'create' as const, label: '✍️ 创作' },
            { key: 'checkin' as const, label: '📅 签到' },
            { key: 'social' as const, label: '👥 社交' },
            { key: 'special' as const, label: '⭐ 特殊' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${
                activeTab === tab.key ? 'bg-white text-black' : 'bg-white/10 text-white/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 成就列表 */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-10 text-white/40">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-4">🏆</div>
            <div className="text-white/60">暂无成就</div>
          </div>
        ) : (
          filtered.map(achievement => {
            const progressPercent = achievement.progress.max > 0
              ? (achievement.progress.current / achievement.progress.max) * 100
              : 0

            return (
              <div
                key={achievement.id}
                className={`rounded-xl p-4 ${
                  achievement.isUnlocked
                    ? 'bg-white/10 border border-yellow-500/30'
                    : 'bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{achievement.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{achievement.name}</span>
                      {achievement.isUnlocked && (
                        <span className="text-xs text-yellow-400">✓ 已达成</span>
                      )}
                    </div>
                    <div className="text-xs text-white/60">{achievement.desc}</div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-white/40 mb-1">
                        <span>{achievement.condition}</span>
                        <span>{achievement.progress.current}/{achievement.progress.max}</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-primary font-bold">+{achievement.rewardPoints}</div>
                    <div className="text-xs text-white/40">积分</div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
