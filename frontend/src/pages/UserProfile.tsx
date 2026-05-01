import { useState } from 'react'

interface UserProfileProps {
  userId: string
  onClose: () => void
}

export default function UserProfile({ userId, onClose }: UserProfileProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'idea' | 'task'>('content')
  const [isFollowing, setIsFollowing] = useState(false)

  const user = {
    id: userId,
    name: '时尚达人小美',
    avatar: '👗',
    username: 'fashion_mei',
    bio: '分享穿搭灵感，让每个人都能找到自己的风格',
    level: 45,
    vipLevel: 3,
    verified: true,
    stats: { followers: 12345, following: 234, likes: 56789, recommends: 890 },
    tags: ['穿搭', '时尚', '美妆'],
    joinDate: '2025-01-15',
  }

  const contents = [
    { id: '1', type: 'video', title: '夏日穿搭挑战！这个搭配太绝了！', views: 12345, likes: 890, comments: 234 },
    { id: '2', type: 'image', title: '春日穿搭分享', views: 5678, likes: 456, comments: 123 },
    { id: '3', type: 'text', title: '穿搭小技巧分享', views: 3456, likes: 234, comments: 89 },
  ]

  const ideas = [
    { id: '1', title: '用AI生成品牌吉祥物', price: 100, views: 567, likes: 45, status: 'active' },
    { id: '2', title: '互动式产品展示方案', price: 200, views: 234, likes: 23, status: 'sold' },
  ]

  const tasks = [
    { id: '1', title: '夏日穿搭挑战', reward: '500元', participants: 234, status: 'active' },
    { id: '2', title: '美妆教程大赛', reward: '1000积分', participants: 189, status: 'ended' },
  ]

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto">
      <div className="max-w-lg mx-auto bg-black min-h-screen pb-16">
        <header className="sticky top-0 bg-black/80 backdrop-blur-sm z-40 px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={onClose} className="text-white/60">← 返回</button>
            <button className="text-white/60">•••</button>
          </div>
        </header>

        <div className="relative">
          <div className="h-32 bg-gradient-to-r from-primary/30 to-secondary/30"></div>
          <div className="px-4 pb-4 -mt-12">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-full bg-white/10 border-4 border-black flex items-center justify-center text-4xl">{user.avatar}</div>
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white">{user.name}</h1>
                  {user.verified && <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">✓ 认证</span>}
                </div>
                <p className="text-sm text-white/50">@{user.username}</p>
              </div>
              <button onClick={handleFollow} className={`px-4 py-2 rounded-lg text-sm font-medium ${isFollowing ? 'bg-white/10 text-white' : 'bg-white text-black'}`}>
                {isFollowing ? '已关注' : '关注'}
              </button>
            </div>

            <p className="mt-3 text-white/60 text-sm">{user.bio}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {user.tags.map(tag => <span key={tag} className="px-2 py-1 bg-white/10 text-white/60 text-xs rounded-full">{tag}</span>)}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">Lv.{user.level}</span>
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">VIP.{user.vipLevel}</span>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-3">
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <div className="font-bold text-white text-lg">{user.stats.followers}</div>
                <div className="text-xs text-white/40">粉丝</div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <div className="font-bold text-white text-lg">{user.stats.following}</div>
                <div className="text-xs text-white/40">关注</div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <div className="font-bold text-white text-lg">{user.stats.likes}</div>
                <div className="text-xs text-white/40">获赞</div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <div className="font-bold text-white text-lg">{user.stats.recommends}</div>
                <div className="text-xs text-white/40">被推荐</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black border-b border-white/10 sticky top-12 z-40">
          <div className="flex">
            {['content', 'idea', 'task'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-3 text-sm font-medium ${activeTab === tab ? 'text-white border-b-2 border-white' : 'text-white/50'}`}>
                {tab === 'content' ? '内容' : tab === 'idea' ? '创意' : '任务'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {activeTab === 'content' && (
            <div className="space-y-4">
              {contents.map(content => (
                <div key={content.id} className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-white/10 text-white/60 text-xs rounded-full">{content.type === 'video' ? '视频' : content.type === 'image' ? '图片' : '文字'}</span>
                  </div>
                  <h4 className="font-medium text-white mb-2">{content.title}</h4>
                  <div className="flex items-center gap-4 text-sm text-white/40">
                    <span>👁 {content.views}</span>
                    <span>❤️ {content.likes}</span>
                    <span>💬 {content.comments}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'idea' && (
            <div className="space-y-4">
              {ideas.map(idea => (
                <div key={idea.id} className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">{idea.title}</h4>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${idea.status === 'sold' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {idea.status === 'sold' ? '已售' : '在售'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-bold">¥{idea.price}</span>
                    <div className="flex items-center gap-4 text-sm text-white/40">
                      <span>👁 {idea.views}</span>
                      <span>❤️ {idea.likes}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'task' && (
            <div className="space-y-4">
              {tasks.map(task => (
                <div key={task.id} className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">{task.title}</h4>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${task.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {task.status === 'active' ? '进行中' : '已结束'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-bold">{task.reward}</span>
                    <span className="text-sm text-white/40">{task.participants}人参与</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 mb-4 flex gap-3">
          <button className="flex-1 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-bold">⭐ 推荐 TA</button>
          <button className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-bold">💰 打赏</button>
        </div>
      </div>
    </div>
  )
}
