// ===== 活动中心 =====

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getActivities, joinActivity, getUserActivities } from '../lib/api/client'
import { toast } from '../lib/toast'

interface ActivitiesProps {
  user?: any
  setUser?: (user: any) => void
}

interface Activity {
  id: string
  type: string
  title: string
  description: string
  reward: number
  end_date: string | null
  participant_count: number
  status: string
}

export default function Activities({ user, setUser: _setUser }: ActivitiesProps) {
  const navigate = useNavigate()
  const [activities, setActivities] = useState<Activity[]>([])
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set())
  const [joining, setJoining] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [])

  useEffect(() => {
    if (user?.id) loadJoinedIds()
  }, [user?.id])

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const data = await getActivities('active')
      setActivities(data)
    } catch (err) {
      console.error('加载活动失败:', err)
    }
    setLoading(false)
  }

  const loadJoinedIds = async () => {
    if (!user?.id) return
    try {
      const data = await getUserActivities()
      if (data) {
        setJoinedIds(new Set(data.map((d: any) => d.activity_id)))
      }
    } catch {}
  }

  const handleJoin = async (activityId: string) => {
    if (!user?.id) {
      navigate('/login')
      return
    }
    if (joinedIds.has(activityId) || joining) return

    setJoining(activityId)
    try {
      await joinActivity(activityId)
      setJoinedIds(prev => new Set([...prev, activityId]))
      setActivities(prev => prev.map(a =>
        a.id === activityId
          ? { ...a, participant_count: a.participant_count + 1 }
          : a
      ))
      toast.success('参与成功！+10积分')
    } catch (e: any) {
      toast.error(e.message || '参与失败')
    } finally {
      setJoining(null)
    }
  }

  const typeIcons: Record<string, string> = {
    promote: '📢',
    create: '✍️',
    vote: '🗳️',
    trial: '📦',
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-4 py-4 border-b">
        <h1 className="text-lg font-bold">🎯 活动中心</h1>
        <p className="text-xs text-gray-400 mt-1">参与活动赢积分</p>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-gray-400 text-sm">暂无活动</p>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {activities.map((a) => (
            <div key={a.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="text-3xl">{typeIcons[a.type] || '🎯'}</div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{a.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>💰 {a.reward} 积分</span>
                    <span>👥 {a.participant_count} 人参与</span>
                    {a.end_date && <span>⏰ 截止 {new Date(a.end_date).toLocaleDateString()}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleJoin(a.id)}
                  disabled={joinedIds.has(a.id) || joining === a.id}
                  className={`text-xs px-3 py-1.5 rounded-full shrink-0 ${
                    joinedIds.has(a.id)
                      ? 'bg-gray-200 text-gray-500'
                      : joining === a.id
                        ? 'bg-blue-300 text-white'
                        : 'bg-blue-500 text-white'
                  }`}
                >
                  {joinedIds.has(a.id) ? '已参与' : joining === a.id ? '...' : '参与'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
