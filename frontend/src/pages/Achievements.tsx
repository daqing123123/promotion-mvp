import { useState } from 'react'

interface Achievement {
  id: string
  name: string
  icon: string
  desc: string
  condition: string
  progress: number
  maxProgress: number
  reward: number
  unlocked: boolean
}

export default function Achievements({ user: _user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<'points' | 'recommend' | 'activity'>('points')

  const pointAchievements: Achievement[] = [
    { id: 'p1', name: '初入江湖', icon: '🌱', desc: '获得100积分', condition: '累计获得100积分', progress: 100, maxProgress: 100, reward: 50, unlocked: true },
    { id: 'p2', name: '小有积蓄', icon: '💰', desc: '获得500积分', condition: '累计获得500积分', progress: 500, maxProgress: 500, reward: 100, unlocked: true },
    { id: 'p3', name: '积分达人', icon: '💎', desc: '获得1000积分', condition: '累计获得1000积分', progress: 1000, maxProgress: 1000, reward: 200, unlocked: true },
    { id: 'p4', name: '积分大亨', icon: '👑', desc: '获得5000积分', condition: '累计获得5000积分', progress: 2500, maxProgress: 5000, reward: 500, unlocked: false },
    { id: 'p5', name: '积分传奇', icon: '🏆', desc: '获得10000积分', condition: '累计获得10000积分', progress: 2500, maxProgress: 10000, reward: 1000, unlocked: false },
  ]

  const recommendAchievements: Achievement[] = [
    { id: 'r1', name: '初次推荐', icon: '⭐', desc: '推荐1次', condition: '累计推荐1次', progress: 1, maxProgress: 1, reward: 20, unlocked: true },
    { id: 'r2', name: '热心推荐官', icon: '🌟', desc: '推荐10次', condition: '累计推荐10次', progress: 5, maxProgress: 10, reward: 50, unlocked: false },
    { id: 'r3', name: '推荐达人', icon: '💫', desc: '推荐50次', condition: '累计推荐50次', progress: 5, maxProgress: 50, reward: 200, unlocked: false },
    { id: 'r4', name: '被推荐新星', icon: '✨', desc: '被推荐5次', condition: '被推荐5次', progress: 3, maxProgress: 5, reward: 30, unlocked: false },
    { id: 'r5', name: '人气王', icon: '🔥', desc: '被推荐50次', condition: '被推荐50次', progress: 3, maxProgress: 50, reward: 300, unlocked: false },
  ]

  const activityAchievements: Achievement[] = [
    { id: 'a1', name: '初出茅庐', icon: '📝', desc: '发布第1条内容', condition: '发布1条内容', progress: 1, maxProgress: 1, reward: 10, unlocked: true },
    { id: 'a2', name: '内容创作者', icon: '✍️', desc: '发布10条内容', condition: '发布10条内容', progress: 3, maxProgress: 10, reward: 50, unlocked: false },
    { id: 'a3', name: '任务新手', icon: '📋', desc: '完成1个任务', condition: '完成1个任务', progress: 1, maxProgress: 1, reward: 20, unlocked: true },
    { id: 'a4', name: '任务达人', icon: '✅', desc: '完成10个任务', condition: '完成10个任务', progress: 1, maxProgress: 10, reward: 100, unlocked: false },
    { id: 'a5', name: '社交达人', icon: '👥', desc: '获得10个粉丝', condition: '获得10个粉丝', progress: 5, maxProgress: 10, reward: 30, unlocked: false },
    { id: 'a6', name: '网红', icon: '🎤', desc: '获得100个粉丝', condition: '获得100个粉丝', progress: 5, maxProgress: 100, reward: 200, unlocked: false },
  ]

  const currentAchievements = activeTab === 'points' ? pointAchievements : activeTab === 'recommend' ? recommendAchievements : activityAchievements

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4">
        <h3 className="text-white font-bold mb-2">🏆 成就系统</h3>
        <p className="text-white/60 text-sm">完成成就获得积分奖励</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setActiveTab('points')} className={`flex-1 py-2 rounded-lg text-sm ${activeTab === 'points' ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`}>💰 积分成就</button>
        <button onClick={() => setActiveTab('recommend')} className={`flex-1 py-2 rounded-lg text-sm ${activeTab === 'recommend' ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`}>⭐ 推荐成就</button>
        <button onClick={() => setActiveTab('activity')} className={`flex-1 py-2 rounded-lg text-sm ${activeTab === 'activity' ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`}>🎯 活动成就</button>
      </div>

      <div className="space-y-3">
        {currentAchievements.map(achievement => (
          <div key={achievement.id} className={`rounded-xl p-4 ${achievement.unlocked ? 'bg-white/10 border border-yellow-500/30' : 'bg-white/5'}`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{achievement.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{achievement.name}</span>
                  {achievement.unlocked && <span className="text-xs text-yellow-400">✓ 已达成</span>}
                </div>
                <div className="text-xs text-white/60">{achievement.desc}</div>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-white/40 mb-1">
                    <span>{achievement.condition}</span>
                    <span>{achievement.progress}/{achievement.maxProgress}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full" style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }} />
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-primary font-bold">+{achievement.reward}</div>
                <div className="text-xs text-white/40">积分</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
