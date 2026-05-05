// ===== 任务广场（真实数据版） =====

import { useState, useEffect, useCallback } from 'react'
import { fetchTasks, joinTaskById, fetchUserTasks, autoCheckTaskCompletion, Task, TaskParticipant } from '../lib/tasks'
import { checkAndUnlockAchievements } from '../lib/achievements'
import { toast } from '../lib/toast'

interface TasksProps {
  user: any
  setUser: (user: any) => void
}

export default function Tasks({ user, setUser }: TasksProps) {
  const [activeTab, setActiveTab] = useState<'daily' | 'promote' | 'create' | 'challenge' | 'my'>('daily')
  const [tasks, setTasks] = useState<Task[]>([])
  const [myTasks, setMyTasks] = useState<TaskParticipant[]>([])
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState<string | null>(null)

  const loadTasks = useCallback(async () => {
    try {
      const type = activeTab === 'my' ? undefined : activeTab
      const data = await fetchTasks(type)
      setTasks(data)
    } catch (err) {
      console.error('加载任务失败:', err)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  const loadMyTasks = useCallback(async () => {
    if (!user) return
    try {
      const data = await fetchUserTasks(user.id)
      setMyTasks(data)
      setJoinedIds(new Set(data.map(p => p.task_id)))
    } catch (err) {
      console.error('加载我的任务失败:', err)
    }
  }, [user])

  useEffect(() => {
    loadTasks()
    loadMyTasks()
  }, [loadTasks, loadMyTasks])

  // 自动检测任务完成
  useEffect(() => {
    if (!user) return
    const checkCompletion = async () => {
      try {
        const completed = await autoCheckTaskCompletion(user.id)
        if (completed && completed.length > 0) {
          await loadMyTasks()
          await checkAndUnlockAchievements(user.id)
        }
      } catch {
        // 静默失败
      }
    }
    checkCompletion()
  }, [user, loadMyTasks])

  const handleJoin = async (taskId: string) => {
    if (!user) {
      toast.warning('请先登录')
      return
    }

    setJoining(taskId)
    try {
      await joinTaskById(taskId, user.id)

      setJoinedIds(prev => new Set([...prev, taskId]))
      await loadMyTasks()
      toast.success('参与成功！')
    } catch (err: any) {
      toast.error(err.message || '参与失败')
    } finally {
      setJoining(null)
    }
  }

  const getTaskIcon = (task: Task) => {
    if (task.title.includes('签到')) return '📅'
    if (task.title.includes('发布')) return '🎭'
    if (task.title.includes('点赞')) return '❤️'
    if (task.title.includes('帮推')) return '🔥'
    if (task.title.includes('评论')) return '💬'
    if (task.type === 'promote') return '📢'
    if (task.type === 'create') return '✍️'
    if (task.type === 'challenge') return '🏆'
    return '📋'
  }

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case 'daily': return '每日任务'
      case 'promote': return '帮推任务'
      case 'create': return '创作任务'
      case 'challenge': return '挑战任务'
      default: return '任务'
    }
  }

  return (
    <div className="max-w-lg mx-auto bg-black min-h-screen pb-16">
      <header className="sticky top-0 bg-black border-b border-white/10 z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">任务广场</h1>
          {user && (
            <button onClick={() => setActiveTab('my')} className="text-sm text-purple-400">
              我的任务
            </button>
          )}
        </div>
      </header>

      {/* 标签页 */}
      <div className="bg-black px-4 py-2 border-b border-white/10 overflow-x-auto">
        <div className="flex gap-3 scrollbar-hide">
          {[
            { key: 'daily' as const, label: '🎯 每日任务' },
            { key: 'promote' as const, label: '🔥 帮推任务' },
            { key: 'create' as const, label: '✍️ 创作任务' },
            { key: 'challenge' as const, label: '🏆 挑战任务' },
            { key: 'my' as const, label: '📋 我的任务' },
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

      <div className="p-4 space-y-3">
        {/* 每日任务提示 */}
        {activeTab === 'daily' && (
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 mb-4">
            <h3 className="text-white font-bold mb-2">🎯 每日任务</h3>
            <p className="text-white/60 text-sm">完成任务赚取积分，每日刷新！</p>
          </div>
        )}

        {activeTab === 'promote' && (
          <div className="bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-xl p-4 mb-4">
            <h3 className="text-white font-bold mb-2">🔥 帮推任务</h3>
            <p className="text-white/60 text-sm">帮推指定内容获得额外积分奖励</p>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 mb-4">
            <h3 className="text-white font-bold mb-2">✍️ 创作任务</h3>
            <p className="text-white/60 text-sm">发布优质内容获得积分奖励</p>
          </div>
        )}

        {activeTab === 'challenge' && (
          <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-4 mb-4">
            <h3 className="text-white font-bold mb-2">🏆 挑战任务</h3>
            <p className="text-white/60 text-sm">参与挑战赢取丰厚奖励</p>
          </div>
        )}

        {/* 任务列表 */}
        {activeTab !== 'my' ? (
          loading ? (
            <div className="text-center py-10 text-white/40">加载中...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-4">📋</div>
              <div className="text-white/60">暂无任务</div>
              <div className="text-white/40 text-xs mt-2">敬请期待</div>
            </div>
          ) : (
            tasks.map(task => {
              const isJoined = joinedIds.has(task.id)
              const isJoining = joining === task.id

              return (
                <div key={task.id} className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{getTaskIcon(task)}</span>
                    <div className="flex-1">
                      <h4 className="font-bold text-white">{task.title}</h4>
                      <div className="text-xs text-white/40">
                        {getTaskTypeLabel(task.type)} · {task.current_participants}人参与
                      </div>
                    </div>
                    <span className="text-purple-400 font-bold">+{task.reward_points}积分</span>
                  </div>

                  {task.description && (
                    <p className="text-white/60 text-sm mb-3">{task.description}</p>
                  )}

                  <button
                    onClick={() => handleJoin(task.id)}
                    disabled={isJoined || isJoining}
                    className={`w-full py-2 rounded-lg font-medium transition-all ${
                      isJoined
                        ? 'bg-white/10 text-white/40'
                        : isJoining
                          ? 'bg-white/20 text-white/60'
                          : 'bg-white text-black active:scale-[0.98]'
                    }`}
                  >
                    {isJoined ? '已参与' : isJoining ? '参与中...' : '参与任务'}
                  </button>
                </div>
              )
            })
          )
        ) : (
          /* 我的任务 */
          !user ? (
            <div className="text-center py-10">
              <div className="text-white/60">请先登录</div>
            </div>
          ) : myTasks.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-4">📋</div>
              <div className="text-white/60">还没有参与任务</div>
              <div className="text-white/40 text-xs mt-2">去任务广场看看吧</div>
            </div>
          ) : (
            myTasks.map(participant => {
              const task = participant.tasks
              if (!task) return null

              return (
                <div key={participant.id} className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{getTaskIcon(task)}</span>
                    <div className="flex-1">
                      <h4 className="font-bold text-white">{task.title}</h4>
                      <div className="text-xs text-white/40">
                        {getTaskTypeLabel(task.type)}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      participant.status === 'completed'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {participant.status === 'completed' ? '已完成' : '进行中'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-white/40">
                    <span>奖励：{task.reward_points}积分</span>
                    {participant.status === 'completed' && (
                      <span className="text-green-400">✅ 已获得奖励</span>
                    )}
                  </div>
                </div>
              )
            })
          )
        )}
      </div>
    </div>
  )
}
