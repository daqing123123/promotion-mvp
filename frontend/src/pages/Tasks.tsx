// ===== 浠诲姟骞垮満锛堢湡瀹炴暟鎹増锛?=====

import { useState, useEffect, useCallback } from 'react'
import { fetchTasks, joinTaskById, fetchUserTasks, autoCheckTaskCompletion, Task, TaskParticipant } from '../lib/tasks'
import { earnPoints } from '../lib/api/client'
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
      console.error('鍔犺浇浠诲姟澶辫触:', err)
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
      console.error('鍔犺浇鎴戠殑浠诲姟澶辫触:', err)
    }
  }, [user])

  useEffect(() => {
    loadTasks()
    loadMyTasks()
  }, [loadTasks, loadMyTasks])

  // 鑷姩妫€娴嬩换鍔″畬鎴?
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
        // 闈欓粯澶辫触
      }
    }
    checkCompletion()
  }, [user, loadMyTasks])

  const handleJoin = async (taskId: string) => {
    if (!user) {
      toast.warning('璇峰厛鐧诲綍')
      return
    }

    setJoining(taskId)
    try {
      await joinTaskById(taskId, user.id)

      try {
        const result = await earnPoints(user.id, 10, 'task', '鍙備笌浠诲姟鑾峰緱绉垎')
        if (setUser && result.points !== undefined) {
          setUser((prev: any) => prev ? { ...prev, points: result.points } : prev)
        }
      } catch {
        // 绉垎鑾峰彇澶辫触涓嶅奖鍝嶅弬涓?
      }

      setJoinedIds(prev => new Set([...prev, taskId]))
      await loadMyTasks()
      toast.success('鍙備笌鎴愬姛锛?)
    } catch (err: any) {
      toast.error(err.message || '鍙備笌澶辫触')
    } finally {
      setJoining(null)
    }
  }

  const getTaskIcon = (task: Task) => {
    if (task.title.includes('绛惧埌')) return '馃搮'
    if (task.title.includes('鍙戝竷')) return '馃幁'
    if (task.title.includes('鐐硅禐')) return '鉂わ笍'
    if (task.title.includes('甯帹')) return '馃敟'
    if (task.title.includes('璇勮')) return '馃挰'
    if (task.type === 'promote') return '馃摙'
    if (task.type === 'create') return '鉁嶏笍'
    if (task.type === 'challenge') return '馃弳'
    return '馃搵'
  }

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case 'daily': return '姣忔棩浠诲姟'
      case 'promote': return '甯帹浠诲姟'
      case 'create': return '鍒涗綔浠诲姟'
      case 'challenge': return '鎸戞垬浠诲姟'
      default: return '浠诲姟'
    }
  }

  return (
    <div className="max-w-lg mx-auto bg-black min-h-screen pb-16">
      <header className="sticky top-0 bg-black border-b border-white/10 z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">浠诲姟骞垮満</h1>
          {user && (
            <button onClick={() => setActiveTab('my')} className="text-sm text-purple-400">
              鎴戠殑浠诲姟
            </button>
          )}
        </div>
      </header>

      {/* 鏍囩椤?*/}
      <div className="bg-black px-4 py-2 border-b border-white/10 overflow-x-auto">
        <div className="flex gap-3 scrollbar-hide">
          {[
            { key: 'daily' as const, label: '馃幆 姣忔棩浠诲姟' },
            { key: 'promote' as const, label: '馃敟 甯帹浠诲姟' },
            { key: 'create' as const, label: '鉁嶏笍 鍒涗綔浠诲姟' },
            { key: 'challenge' as const, label: '馃弳 鎸戞垬浠诲姟' },
            { key: 'my' as const, label: '馃搵 鎴戠殑浠诲姟' },
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
        {/* 姣忔棩浠诲姟鎻愮ず */}
        {activeTab === 'daily' && (
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 mb-4">
            <h3 className="text-white font-bold mb-2">馃幆 姣忔棩浠诲姟</h3>
            <p className="text-white/60 text-sm">瀹屾垚浠诲姟璧氬彇绉垎锛屾瘡鏃ュ埛鏂帮紒</p>
          </div>
        )}

        {activeTab === 'promote' && (
          <div className="bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-xl p-4 mb-4">
            <h3 className="text-white font-bold mb-2">馃敟 甯帹浠诲姟</h3>
            <p className="text-white/60 text-sm">甯帹鎸囧畾鍐呭鑾峰緱棰濆绉垎濂栧姳</p>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 mb-4">
            <h3 className="text-white font-bold mb-2">鉁嶏笍 鍒涗綔浠诲姟</h3>
            <p className="text-white/60 text-sm">鍙戝竷浼樿川鍐呭鑾峰緱绉垎濂栧姳</p>
          </div>
        )}

        {activeTab === 'challenge' && (
          <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-4 mb-4">
            <h3 className="text-white font-bold mb-2">馃弳 鎸戞垬浠诲姟</h3>
            <p className="text-white/60 text-sm">鍙備笌鎸戞垬璧㈠彇涓板帤濂栧姳</p>
          </div>
        )}

        {/* 浠诲姟鍒楄〃 */}
        {activeTab !== 'my' ? (
          loading ? (
            <div className="text-center py-10 text-white/40">鍔犺浇涓?..</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-4">馃搵</div>
              <div className="text-white/60">鏆傛棤浠诲姟</div>
              <div className="text-white/40 text-xs mt-2">鏁鏈熷緟</div>
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
                        {getTaskTypeLabel(task.type)} 路 {task.current_participants}浜哄弬涓?
                      </div>
                    </div>
                    <span className="text-purple-400 font-bold">+{task.reward_points}绉垎</span>
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
                    {isJoined ? '宸插弬涓? : isJoining ? '鍙備笌涓?..' : '鍙備笌浠诲姟'}
                  </button>
                </div>
              )
            })
          )
        ) : (
          /* 鎴戠殑浠诲姟 */
          !user ? (
            <div className="text-center py-10">
              <div className="text-white/60">璇峰厛鐧诲綍</div>
            </div>
          ) : myTasks.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-4">馃搵</div>
              <div className="text-white/60">杩樻病鏈夊弬涓庝换鍔?/div>
              <div className="text-white/40 text-xs mt-2">鍘讳换鍔″箍鍦虹湅鐪嬪惂</div>
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
                      {participant.status === 'completed' ? '宸插畬鎴? : '杩涜涓?}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-white/40">
                    <span>濂栧姳锛歿task.reward_points}绉垎</span>
                    {participant.status === 'completed' && (
                      <span className="text-green-400">鉁?宸茶幏寰楀鍔?/span>
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

