// ===== 通知列表 =====

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotifications, markAllNotificationsRead } from '../lib/api/client'
import { toast } from '../lib/toast'

interface Notification {
  id: string
  type: string
  title: string
  content: string
  related_id: string
  is_read: boolean
  created_at: string
}

const ICON_MAP: Record<string, string> = {
  like: '❤️',
  comment: '💬',
  follow: '👤',
  promote: '🔥',
  achievement: '🏆',
  system: '📢',
  invite: '🎁',
  points: '💰',
}

export default function Notifications({ user }: { user: any }) {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) loadNotifications()
  }, [user?.id])

  const loadNotifications = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const data = await getNotifications()
      if (data) {
        setNotifications(data)
        // 标记所有为已读
        await markAllNotificationsRead()
      }
    } catch {}
    setLoading(false)
  }

  const handleClick = (n: Notification) => {
    if (n.related_id) {
      if (n.type === 'like' || n.type === 'comment' || n.type === 'promote') {
        navigate(`/content/${n.related_id}`)
      } else if (n.type === 'follow') {
        navigate(`/profile/${n.related_id}`)
      }
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="bg-white px-5 pt-12 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-gray-400">← 返回</button>
          <h1 className="text-base font-bold text-gray-900">通知</h1>
          <button onClick={() => {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
            toast.success('已全部标为已读')
          }} className="text-xs text-blue-500">全部已读</button>
        </div>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="text-center py-10 text-gray-400">加载中...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔔</div>
            <p className="text-gray-400">暂无通知</p>
            <p className="text-xs text-gray-300 mt-1">点赞、评论、关注等消息会出现在这里</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`bg-white rounded-xl p-4 border border-gray-100 ${!n.is_read ? 'border-l-4 border-l-blue-500' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{ICON_MAP[n.type] || '📢'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-gray-900">{n.title}</span>
                      {!n.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{n.content}</p>
                    <span className="text-[10px] text-gray-300 mt-1 block">{new Date(n.created_at).toLocaleString('zh-CN')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
