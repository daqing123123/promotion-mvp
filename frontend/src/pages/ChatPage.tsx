// ===== 消息中心 =====

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotifications, markAllNotificationsRead } from '../lib/api/client'

const NOTIF_CONFIG: Record<string, { label: string; color: string }> = {
  like: { label: '赞', color: '#f43f5e' },
  comment: { label: '评', color: '#3b82f6' },
  remix: { label: '创', color: '#8b5cf6' },
  promote: { label: '推', color: '#f97316' },
  achievement: { label: '勋', color: '#eab308' },
  system: { label: '系', color: '#06b6d4' },
}

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

  const getNotifConfig = (type: string) => NOTIF_CONFIG[type] || { label: '通', color: '#94a3b8' }

  // 登录前状态
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex flex-col items-center justify-center pb-20">
        <div className="mb-6">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <rect x="8" y="12" width="40" height="32" rx="4" stroke="#475569" strokeWidth="1.5"/>
            <path d="M8 16l18 12a2 2 0 002.5 0L48 16" stroke="#475569" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="text-slate-400 mb-4">登录后查看消息</p>
        <button onClick={() => navigate('/login')} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors">去登录</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 pb-20">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">消息</h1>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">全部已读</button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => handleTabChange('notifications')}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === 'notifications'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            通知
            {unreadCount > 0 && (
              <span className="ml-1.5 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </button>
          <button
            onClick={() => handleTabChange('chats')}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === 'chats'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            聊天
            {chatUnread > 0 && (
              <span className="ml-1.5 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{chatUnread}</span>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {tab === 'notifications' ? (
        <div>
          {loading ? (
            <div className="text-center py-16">
              <div className="space-y-3 px-5">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-slate-800/40 rounded-xl p-4 animate-pulse">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-slate-700/50 rounded-full shrink-0" />
                      <div className="flex-1"><div className="h-4 w-24 bg-slate-700/50 rounded mb-2" /><div className="h-3 w-full bg-slate-700/50 rounded" /></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 px-5">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#475569" strokeWidth="1.5"/><path d="M13.73 21a2 2 0 01-3.46 0" stroke="#475569" strokeWidth="1.5"/></svg>
              </div>
              <p className="text-slate-500 text-sm">暂无通知</p>
            </div>
          ) : (
            notifications.map(n => {
              const cfg = getNotifConfig(n.type)
              return (
                <div key={n.id} className={`flex items-start gap-4 px-5 py-4 border-b border-slate-800/50 transition-colors ${!n.is_read ? 'bg-indigo-500/5' : ''}`}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white" style={{ backgroundColor: cfg.color + '30', color: cfg.color }}>
                    {cfg.label}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white mb-0.5">{n.title}</h3>
                    <p className="text-xs text-slate-400 mb-1 line-clamp-2">{n.content}</p>
                    <span className="text-[10px] text-slate-600">{getTimeAgo(n.created_at)}</span>
                  </div>
                  {!n.is_read && <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 shrink-0" />}
                </div>
              )
            })
          )}
        </div>
      ) : (
        /* Chats - 暂无真实聊天功能 */
        <div className="text-center py-16 px-5">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="#475569" strokeWidth="1.5"/></svg>
          </div>
          <p className="text-slate-400 text-sm mb-1">聊天功能开发中</p>
          <p className="text-slate-600 text-xs">你可以通过内容评论与其他用户互动</p>
        </div>
      )}
    </div>
  )
}
