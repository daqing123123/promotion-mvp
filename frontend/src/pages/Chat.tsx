import { useState } from 'react'

export default function Chat({ user: _user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<'messages' | 'notifications'>('messages')
  const [selectedChat, setSelectedChat] = useState<string | null>(null)

  const chats = [
    { id: '1', name: '时尚达人小美', avatar: '👗', lastMessage: '你好！看到你发布的内容了', time: '2分钟前', unread: 2 },
    { id: '2', name: '游戏达人小李', avatar: '🎮', lastMessage: '游戏测评任务还参与吗？', time: '1小时前', unread: 0 },
    { id: '3', name: '创意达人小王', avatar: '🎨', lastMessage: '创意点子很有意思！', time: '3小时前', unread: 1 },
    { id: '4', name: '巨浪官方', avatar: '🌊', lastMessage: '恭喜你完成新手任务！', time: '1天前', unread: 0 },
  ]

  const notifications = [
    { id: '1', type: 'like', content: '时尚达人小美 点赞了你的内容', time: '2分钟前', avatar: '👗' },
    { id: '2', type: 'comment', content: '游戏达人小李 评论了你的内容', time: '5分钟前', avatar: '🎮' },
    { id: '3', type: 'follow', content: '创意达人小王 关注了你', time: '1小时前', avatar: '🎨' },
    { id: '4', type: 'recommend', content: '音乐达人小陈 推荐了你', time: '2小时前', avatar: '🎵' },
    { id: '5', type: 'task', content: '你参与的任务"夏日穿搭挑战"有新动态', time: '3小时前', avatar: '📋' },
    { id: '6', type: 'reward', content: '你获得了50积分奖励', time: '1天前', avatar: '💎' },
  ]

  const messages = [
    { id: '1', sender: 'other', content: '你好！看到你发布的内容了', time: '2分钟前' },
    { id: '2', sender: 'me', content: '谢谢！有什么想聊的吗？', time: '1分钟前' },
    { id: '3', sender: 'other', content: '你的创意点子很有意思，我们可以合作', time: '30秒前' },
  ]

  return (
    <div className="max-w-lg mx-auto bg-black min-h-screen pb-16">
      <header className="sticky top-0 bg-black border-b border-white/10 z-40 px-4 py-3">
        <h1 className="text-xl font-bold text-white">消息</h1>
      </header>

      <div className="bg-black px-4 py-2 border-b border-white/10">
        <div className="flex gap-3">
          <button onClick={() => setActiveTab('messages')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${activeTab === 'messages' ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`}>
            💬 私信
          </button>
          <button onClick={() => setActiveTab('notifications')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${activeTab === 'notifications' ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`}>
            🔔 通知
          </button>
        </div>
      </div>

      {selectedChat ? (
        <div className="flex flex-col h-[calc(100vh-120px)]">
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
            <button onClick={() => setSelectedChat(null)} className="text-white/60">←</button>
            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-lg">
              {chats.find(c => c.id === selectedChat)?.avatar}
            </div>
            <span className="font-medium text-white">{chats.find(c => c.id === selectedChat)?.name}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] p-3 rounded-2xl ${msg.sender === 'me' ? 'bg-primary text-white' : 'bg-white/10 text-white'}`}>
                  <div className="text-sm">{msg.content}</div>
                  <div className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-white/60' : 'text-white/40'}`}>{msg.time}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <input type="text" placeholder="输入消息..." className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none" />
              <button className="px-4 py-2 bg-primary text-white rounded-lg font-medium">发送</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {activeTab === 'messages' && chats.map(chat => (
            <button key={chat.id} onClick={() => setSelectedChat(chat.id)} className="w-full flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
              <div className="relative">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-2xl">{chat.avatar}</div>
                {chat.unread > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">{chat.unread}</div>
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{chat.name}</span>
                  <span className="text-xs text-white/40">{chat.time}</span>
                </div>
                <div className="text-sm text-white/60 truncate">{chat.lastMessage}</div>
              </div>
            </button>
          ))}

          {activeTab === 'notifications' && notifications.map(notif => (
            <div key={notif.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-xl">{notif.avatar}</div>
              <div className="flex-1">
                <div className="text-sm text-white">{notif.content}</div>
                <div className="text-xs text-white/40">{notif.time}</div>
              </div>
              <div className="text-lg">
                {notif.type === 'like' && '❤️'}
                {notif.type === 'comment' && '💬'}
                {notif.type === 'follow' && '⭐'}
                {notif.type === 'recommend' && '🏆'}
                {notif.type === 'task' && '📋'}
                {notif.type === 'reward' && '💎'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
