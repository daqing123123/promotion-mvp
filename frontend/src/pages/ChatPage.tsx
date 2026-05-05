// ===== 消息中心 =====

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotifications, markAllNotificationsRead } from '../lib/api/client'

export default function ChatPage({ user }: { user: any }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'notifications' | 'chats'>('notifications')
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [chatUnread, setChatUnread] = useState(0)

  useEffect(() => {
    if (user) fetchNotifications()
  }, [user])

  const fetchNotifications = async () => {
    setLoading(true)
    const data = await getNotifications()
    setNotifications(data || [])
    setLoading(false)
  }

  const markAllRead = async () => {
    await markAllNotificationsRead()
    fetchNotifications()
  }

  // 切换到聊天 tab 时清除红点
  const handleTabChange = (t: 'notifications' | 'chats') => {
    setTab(t)
    if (t === 'chats') setChatUnread(0)
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return '刚刚'
    if (mins < 60) return `${mins}分钟前`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}小时前`
    const days = Math.floor(hours / 24)
    return `${days}天前`
  }

  const getNotifIcon = (type: string) => {
    const icons: Record<string, string> = { like: '❤️', comment: '💬', remix: '💡', promote: '📈', achievement: '🏅', system: '⏰' }
    return icons[type] || '📢'
  }

  const chats = [
    { id: '1', name: '系统通知', lastMsg: '欢迎加入巨浪！', time: '刚刚', avatar: '📢', unread: 0 },
  ]

  if (!user) {
    return (
      <div className="bg-white min-h-screen flex flex-col items-center justify-center pb-20">
        <div className="text-4xl mb-4">💬</div>
        <p className="text-gray-400 mb-4">登录后查看消息</p>
        <button onClick={() => navigate('/login')} className="px-6 py-2 bg-black text-white rounded-full text-sm font-medium">去登录</button>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="px-5 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">消息</h1>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-sm text-blue-500">全部已读</button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleTabChange('notifications')} className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${tab === 'notifications' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>
            通知 {unreadCount > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
          </button>
          <button onClick={() => handleTabChange('chats')} className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${tab === 'chats' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>
            聊天 {chatUnread > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{chatUnread}</span>}
          </button>
        </div>
      </div>

      {tab === 'notifications' ? (
        <div>
          {loading ? (
            <div className="text-center py-10 text-gray-400">加载中...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-10 text-gray-400">暂无通知</div>
          ) : notifications.map(n => (
            <div key={n.id} className={`flex items-start gap-4 px-5 py-4 border-b border-gray-50 ${!n.is_read ? 'bg-blue-50/30' : ''}`}>
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg shrink-0">{getNotifIcon(n.type)}</div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 mb-0.5">{n.title}</h3>
                <p className="text-xs text-gray-500 mb-1 line-clamp-2">{n.content}</p>
                <span className="text-[10px] text-gray-400">{getTimeAgo(n.created_at)}</span>
              </div>
              {!n.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>}
            </div>
          ))}
        </div>
      ) : (
        <div>
          {chats.map(c => (
            <div key={c.id} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 active:bg-gray-50">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl shrink-0">{c.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="text-sm font-bold text-gray-900">{c.name}</h3>
                  <span className="text-[10px] text-gray-400">{c.time}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{c.lastMsg}</p>
              </div>
              {c.unread > 0 && <div className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{c.unread}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
