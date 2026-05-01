import { useState } from 'react'

export default function Tasks({ user, setUser: _setUser }: { user: any; setUser: any }) {
  const [activeTab, setActiveTab] = useState<'official' | 'brand' | 'personal' | 'hot' | 'fun' | 'my'>('official')
  const [showPublish, setShowPublish] = useState(false)
  const [showDetail, setShowDetail] = useState<string | null>(null)
  const [showReward, setShowReward] = useState(false)
  const [publishType, setPublishType] = useState<'brand' | 'personal'>('personal')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [rewardType, setRewardType] = useState<'cash' | 'gift' | 'points'>('points')
  const [rewardAmount, setRewardAmount] = useState('')
  const [rewardRule, setRewardRule] = useState<'performance' | 'ranking' | 'random'>('performance')
  const [maxParticipants, setMaxParticipants] = useState('')
  const [loading, setLoading] = useState(false)
  const [joinedTasks, setJoinedTasks] = useState<Set<string>>(new Set())
  const [claimedRewards, setClaimedRewards] = useState<Set<string>>(new Set())
  const [showMyTasks, setShowMyTasks] = useState(false)

  const officialTasks = [
    { id: 'o1', title: '🎯 每日签到', brand: '巨浪官方', reward: '10积分', rewardType: 'points', participants: 5678, deadline: '每日', tags: ['签到', '日常'], icon: '📅', desc: '每日签到获得积分，连续签到奖励递增', status: 'active', difficulty: '简单', time: '10秒', rule: '签到即得' },
    { id: 'o2', title: '📝 发布你的第一条内容', brand: '巨浪官方', reward: '100积分', rewardType: 'points', participants: 3456, deadline: '长期', tags: ['新手', '内容'], icon: '✍️', desc: '发布任意一条内容即可完成', status: 'active', difficulty: '简单', time: '2分钟', rule: '发布即得' },
    { id: 'o3', title: '👤 完善个人资料', brand: '巨浪官方', reward: '50积分', rewardType: 'points', participants: 2345, deadline: '长期', tags: ['新手', '资料'], icon: '📋', desc: '填写昵称、头像、简介即可', status: 'active', difficulty: '简单', time: '1分钟', rule: '完善即得' },
    { id: 'o4', title: '⭐ 关注3个感兴趣的创作者', brand: '巨浪官方', reward: '30积分', rewardType: 'points', participants: 1890, deadline: '长期', tags: ['新手', '社交'], icon: '👥', desc: '关注3个创作者即可完成', status: 'active', difficulty: '简单', time: '1分钟', rule: '关注即得' },
    { id: 'o5', title: '❤️ 点赞5个喜欢的内容', brand: '巨浪官方', reward: '20积分', rewardType: 'points', participants: 1567, deadline: '长期', tags: ['新手', '互动'], icon: '👍', desc: '点赞5个内容即可完成', status: 'active', difficulty: '简单', time: '1分钟', rule: '点赞即得' },
    { id: 'o6', title: '💬 评论3个内容', brand: '巨浪官方', reward: '30积分', rewardType: 'points', participants: 1234, deadline: '长期', tags: ['互动', '社交'], icon: '🗣️', desc: '评论3个内容即可完成', status: 'active', difficulty: '简单', time: '2分钟', rule: '评论即得' },
    { id: 'o7', title: '🔄 分享1个内容', brand: '巨浪官方', reward: '20积分', rewardType: 'points', participants: 890, deadline: '长期', tags: ['推广', '分享'], icon: '📤', desc: '分享1个内容到社交平台', status: 'active', difficulty: '简单', time: '1分钟', rule: '分享即得' },
    { id: 'o8', title: '🏆 连续签到7天', brand: '巨浪官方', reward: '100积分', rewardType: 'points', participants: 567, deadline: '长期', tags: ['签到', '坚持'], icon: '📅', desc: '连续签到7天获得额外奖励', status: 'active', difficulty: '中等', time: '7天', rule: '连续签到7天' },
    { id: 'o9', title: '🌟 获得10个粉丝', brand: '巨浪官方', reward: '200积分', rewardType: 'points', participants: 345, deadline: '长期', tags: ['成长', '粉丝'], icon: '👥', desc: '获得10个粉丝即可完成', status: 'active', difficulty: '中等', time: '3天', rule: '粉丝达标' },
    { id: 'o10', title: '🔥 被推荐5次', brand: '巨浪官方', reward: '300积分', rewardType: 'points', participants: 234, deadline: '长期', tags: ['推荐', '人气'], icon: '⭐', desc: '被其他用户推荐5次', status: 'active', difficulty: '困难', time: '7天', rule: '被推荐达标' },
    { id: 'o11', title: '📝 发布10条内容', brand: '巨浪官方', reward: '500积分', rewardType: 'points', participants: 123, deadline: '长期', tags: ['创作', '坚持'], icon: '✍️', desc: '累计发布10条内容', status: 'active', difficulty: '中等', time: '7天', rule: '发布达标' },
    { id: 'o12', title: '🎁 邀请好友注册', brand: '巨浪官方', reward: '200积分/人', rewardType: 'points', participants: 456, deadline: '长期', tags: ['邀请', '推广'], icon: '📩', desc: '每邀请1个好友注册获得200积分', status: 'active', difficulty: '中等', time: '不限', rule: '好友注册即得' },
  ]

  const hotTasks = [
    { id: 'h1', title: '搞笑段子大赛', brand: '巨浪官方', reward: '1000积分', rewardType: 'points', participants: 2345, deadline: '2026-05-10', tags: ['搞笑', '段子'], icon: '😂', desc: '发布最搞笑的段子，点赞前10名获得奖励', status: 'active', difficulty: '中等', time: '3天', rule: '按点赞排名' },
    { id: 'h2', title: '表情包创作大赛', brand: '巨浪官方', reward: '800积分', rewardType: 'points', participants: 1890, deadline: '2026-05-15', tags: ['表情包', '创意'], icon: '😎', desc: '创作最有趣的表情包', status: 'active', difficulty: '中等', time: '5天', rule: '按效果排名' },
    { id: 'h3', title: '模仿达人秀', brand: '巨浪官方', reward: '1500积分', rewardType: 'points', participants: 1234, deadline: '2026-05-20', tags: ['模仿', '才艺'], icon: '🎭', desc: '模仿名人/角色，最像的获胜', status: 'active', difficulty: '困难', time: '7天', rule: '按投票排名' },
    { id: 'h4', title: '魔性舞蹈挑战', brand: '巨浪官方', reward: '2000积分', rewardType: 'points', participants: 3456, deadline: '2026-05-25', tags: ['舞蹈', '魔性'], icon: '💃', desc: '跳最魔性的舞蹈', status: 'active', difficulty: '困难', time: '7天', rule: '按播放量排名' },
    { id: 'h5', title: '配音大赛', brand: '巨浪官方', reward: '1200积分', rewardType: 'points', participants: 987, deadline: '2026-05-30', tags: ['配音', '才艺'], icon: '🎙️', desc: '为经典片段配音', status: 'active', difficulty: '中等', time: '5天', rule: '按投票排名' },
  ]

  const funChallenges = [
    { id: 'f1', title: '最沙雕表情包大赛', brand: '巨浪官方', reward: '1000积分', participants: 2345, deadline: '2026-05-10', tags: ['沙雕', '表情包'], icon: '🤪', desc: '创作最沙雕的表情包', status: 'active' },
    { id: 'f2', title: '魔性舞蹈挑战', brand: '巨浪官方', reward: '1500积分', participants: 1890, deadline: '2026-05-15', tags: ['舞蹈', '魔性'], icon: '💃', desc: '跳最魔性的舞蹈', status: 'active' },
    { id: 'f3', title: '搞笑配音大赛', brand: '巨浪官方', reward: '800积分', participants: 1234, deadline: '2026-05-20', tags: ['配音', '搞笑'], icon: '🎤', desc: '为搞笑片段配音', status: 'active' },
    { id: 'f4', title: '整蛊朋友大赛', brand: '巨浪官方', reward: '1200积分', participants: 987, deadline: '2026-05-25', tags: ['整蛊', '搞笑'], icon: '😈', desc: '创意整蛊朋友', status: 'active' },
    { id: 'f5', title: '才艺大比拼', brand: '巨浪官方', reward: '2000积分', participants: 2345, deadline: '2026-05-30', tags: ['才艺', '展示'], icon: '🎯', desc: '展示你的才艺', status: 'active' },
  ]

  const myTasks = {
    published: [
      { id: 'mp1', title: '夏日穿搭挑战', participants: 123, status: 'active', reward: '500元' },
      { id: 'mp2', title: '美食探店大赛', participants: 89, status: 'ended', reward: '美食礼包' },
    ],
    joined: [
      { id: 'mj1', title: '搞笑段子大赛', status: 'active', myRank: 15, reward: '待结算' },
      { id: 'mj2', title: '表情包创作大赛', status: 'active', myRank: 8, reward: '待结算' },
      { id: 'mj3', title: '魔性舞蹈挑战', status: 'ended', myRank: 3, reward: '已获得200积分' },
    ]
  }

  const handleJoinTask = (taskId: string) => {
    if (!user) { alert('请先登录'); return }
    setJoinedTasks(prev => new Set([...prev, taskId]))
    alert('参与成功！发布内容时带上任务话题即可')
  }

  const handleClaimReward = (taskId: string) => {
    if (!user) { alert('请先登录'); return }
    setClaimedRewards(prev => new Set([...prev, taskId]))
    alert('奖励领取成功！积分已到账')
  }

  const handlePublishTask = async () => {
    if (!taskTitle.trim() || !taskDesc.trim()) { alert('请填写完整信息'); return }
    setLoading(true)
    setTimeout(() => {
      alert('任务发布成功！')
      setShowPublish(false)
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="max-w-lg mx-auto bg-black min-h-screen pb-16">
      <header className="sticky top-0 bg-black border-b border-white/10 z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">任务广场</h1>
          <button onClick={() => user && setShowMyTasks(true)} className="text-sm text-primary">我的任务</button>
        </div>
      </header>

      <div className="bg-black px-4 py-2 border-b border-white/10">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
          <button onClick={() => setActiveTab('official')} className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${activeTab === 'official' ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`}>🎯 官方任务</button>
          <button onClick={() => setActiveTab('hot')} className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${activeTab === 'hot' ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`}>🔥 热门活动</button>
          <button onClick={() => setActiveTab('fun')} className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${activeTab === 'fun' ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`}>🎭 搞怪挑战</button>
          <button onClick={() => setActiveTab('brand')} className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${activeTab === 'brand' ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`}>🏢 品牌任务</button>
          <button onClick={() => setActiveTab('personal')} className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${activeTab === 'personal' ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`}>👤 个人任务</button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {activeTab === 'official' && (
          <>
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 mb-4">
              <h3 className="text-white font-bold mb-2">🎯 官方任务</h3>
              <p className="text-white/60 text-sm">完成任务赚取积分，不需要花钱！</p>
            </div>
            {officialTasks.map(task => (
              <div key={task.id} className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{task.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-white">{task.title}</h4>
                    <div className="text-xs text-white/40">{task.brand} · 截止 {task.deadline}</div>
                  </div>
                  <span className="text-primary font-bold">{task.reward}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {task.tags.map(tag => <span key={tag} className="px-2 py-1 bg-white/10 text-white/60 text-xs rounded-full">#{tag}</span>)}
                </div>
                <div className="flex items-center justify-between text-xs text-white/40 mb-3">
                  <span>👥 {task.participants}人参与</span>
                  <span>⏱ {task.time}</span>
                  <span>📊 {task.rule}</span>
                </div>
                <button 
                  onClick={() => handleJoinTask(task.id)} 
                  disabled={joinedTasks.has(task.id)}
                  className={`w-full py-2 rounded-lg font-medium ${joinedTasks.has(task.id) ? 'bg-white/10 text-white/40' : 'bg-white text-black'}`}
                >
                  {joinedTasks.has(task.id) ? '已参与' : '参与任务'}
                </button>
              </div>
            ))}
          </>
        )}

        {activeTab === 'hot' && (
          <>
            <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl p-4 mb-4">
              <h3 className="text-white font-bold mb-2">🔥 热门活动</h3>
              <p className="text-white/60 text-sm">参与热门活动，赢取积分奖励！</p>
            </div>
            {hotTasks.map(task => (
              <div key={task.id} className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{task.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-white">{task.title}</h4>
                    <div className="text-xs text-white/40">{task.brand} · 截止 {task.deadline}</div>
                  </div>
                  <span className="text-primary font-bold">{task.reward}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {task.tags.map(tag => <span key={tag} className="px-2 py-1 bg-white/10 text-white/60 text-xs rounded-full">#{tag}</span>)}
                </div>
                <div className="flex items-center justify-between text-xs text-white/40 mb-3">
                  <span>👥 {task.participants}人参与</span>
                  <span>⏱ {task.time}</span>
                  <span>📊 {task.rule}</span>
                </div>
                <button 
                  onClick={() => handleJoinTask(task.id)} 
                  disabled={joinedTasks.has(task.id)}
                  className={`w-full py-2 rounded-lg font-medium ${joinedTasks.has(task.id) ? 'bg-white/10 text-white/40' : 'bg-gradient-to-r from-primary to-secondary text-white'}`}
                >
                  {joinedTasks.has(task.id) ? '已参与' : '参与挑战'}
                </button>
              </div>
            ))}
          </>
        )}

        {activeTab === 'fun' && (
          <>
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 mb-4">
              <h3 className="text-white font-bold mb-2">🎭 搞怪挑战</h3>
              <p className="text-white/60 text-sm">展示你的搞怪天赋，赢取积分！</p>
            </div>
            {funChallenges.map(task => (
              <div key={task.id} className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{task.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-white">{task.title}</h4>
                    <div className="text-xs text-white/40">{task.brand} · 截止 {task.deadline}</div>
                  </div>
                  <span className="text-primary font-bold">{task.reward}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {task.tags.map(tag => <span key={tag} className="px-2 py-1 bg-white/10 text-white/60 text-xs rounded-full">#{tag}</span>)}
                </div>
                <div className="flex items-center justify-between text-xs text-white/40 mb-3">
                  <span>👥 {task.participants}人参与</span>
                  <span>🏆 按效果排名</span>
                </div>
                <button 
                  onClick={() => handleJoinTask(task.id)} 
                  disabled={joinedTasks.has(task.id)}
                  className={`w-full py-2 rounded-lg font-medium ${joinedTasks.has(task.id) ? 'bg-white/10 text-white/40' : 'bg-gradient-to-r from-primary to-secondary text-white'}`}
                >
                  {joinedTasks.has(task.id) ? '已参与' : '参与挑战'}
                </button>
              </div>
            ))}
          </>
        )}

        {activeTab === 'brand' && (
          <>
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-4 mb-4">
              <h3 className="text-white font-bold mb-2">🏢 品牌任务</h3>
              <p className="text-white/60 text-sm">品牌发布的推广任务</p>
            </div>
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🏢</div>
              <div className="text-white/60 text-sm">暂无品牌任务</div>
              <div className="text-white/40 text-xs mt-2">品牌入驻后会发布任务</div>
            </div>
          </>
        )}

        {activeTab === 'personal' && (
          <>
            <div className="bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-xl p-4 mb-4">
              <h3 className="text-white font-bold mb-2">👤 个人任务</h3>
              <p className="text-white/60 text-sm">个人发布的任务</p>
            </div>
            <div className="text-center py-8">
              <div className="text-4xl mb-4">👤</div>
              <div className="text-white/60 text-sm">暂无个人任务</div>
              <div className="text-white/40 text-xs mt-2">成为达人后可发布任务</div>
            </div>
          </>
        )}
      </div>

      {showMyTasks && (
        <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto">
          <div className="max-w-lg mx-auto bg-black min-h-screen pb-16">
            <header className="sticky top-0 bg-black border-b border-white/10 z-40 px-4 py-3">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-white">我的任务</h1>
                <button onClick={() => setShowMyTasks(false)} className="text-white/60">✕</button>
              </div>
            </header>

            <div className="p-4 space-y-6">
              <div>
                <h3 className="text-white font-bold mb-3">📋 我发布的任务</h3>
                {myTasks.published.map(task => (
                  <div key={task.id} className="bg-white/5 rounded-xl p-4 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white">{task.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${task.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {task.status === 'active' ? '进行中' : '已结束'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-white/40">
                      <span>👥 {task.participants}人参与</span>
                      <span>🎁 {task.reward}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-white font-bold mb-3">🎯 我参与的任务</h3>
                {myTasks.joined.map(task => (
                  <div key={task.id} className="bg-white/5 rounded-xl p-4 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white">{task.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${task.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {task.status === 'active' ? '进行中' : '已结束'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-white/40">
                      <span>🏅 排名: {task.myRank}</span>
                      <span>🎁 {task.reward}</span>
                    </div>
                    {task.status === 'ended' && !claimedRewards.has(task.id) && (
                      <button onClick={() => handleClaimReward(task.id)} className="w-full mt-2 py-2 bg-primary text-white rounded-lg text-sm font-medium">
                        领取奖励
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showPublish && (
        <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto">
          <div className="max-w-lg mx-auto bg-black min-h-screen pb-16">
            <header className="sticky top-0 bg-black border-b border-white/10 z-40 px-4 py-3">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-white">发布任务</h1>
                <button onClick={() => setShowPublish(false)} className="text-white/60">✕</button>
              </div>
            </header>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-2 block">任务类型</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setPublishType('brand')} className={`p-3 rounded-xl flex items-center gap-2 ${publishType === 'brand' ? 'bg-white text-black' : 'bg-white/5 text-white/60 border border-white/10'}`}>
                    <span>🏢</span>
                    <span className="text-sm">品牌任务</span>
                  </button>
                  <button onClick={() => setPublishType('personal')} className={`p-3 rounded-xl flex items-center gap-2 ${publishType === 'personal' ? 'bg-white text-black' : 'bg-white/5 text-white/60 border border-white/10'}`}>
                    <span>👤</span>
                    <span className="text-sm">个人任务</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-2 block">任务标题</label>
                <input type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="例如：夏日穿搭挑战" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none" />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-2 block">任务描述</label>
                <textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} placeholder="详细描述任务要求..." className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 focus:outline-none resize-none" />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-2 block">奖励类型</label>
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => setRewardType('points')} className={`p-3 rounded-xl flex flex-col items-center gap-1 ${rewardType === 'points' ? 'bg-white text-black' : 'bg-white/5 text-white/60 border border-white/10'}`}>
                    <span className="text-xl">💎</span>
                    <span className="text-sm">积分</span>
                  </button>
                  <button onClick={() => setRewardType('cash')} className={`p-3 rounded-xl flex flex-col items-center gap-1 ${rewardType === 'cash' ? 'bg-white text-black' : 'bg-white/5 text-white/60 border border-white/10'}`}>
                    <span className="text-xl">💰</span>
                    <span className="text-sm">现金</span>
                  </button>
                  <button onClick={() => setRewardType('gift')} className={`p-3 rounded-xl flex flex-col items-center gap-1 ${rewardType === 'gift' ? 'bg-white text-black' : 'bg-white/5 text-white/60 border border-white/10'}`}>
                    <span className="text-xl">🎁</span>
                    <span className="text-sm">实物</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-2 block">{rewardType === 'cash' ? '奖励金额（元）' : rewardType === 'gift' ? '奖品描述' : '奖励积分'}</label>
                <input type="text" value={rewardAmount} onChange={(e) => setRewardAmount(e.target.value)} placeholder={rewardType === 'cash' ? '例如：500' : rewardType === 'gift' ? '例如：品牌周边礼包' : '例如：1000'} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none" />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-2 block">奖励规则</label>
                <div className="space-y-3">
                  <button onClick={() => setRewardRule('performance')} className={`w-full p-3 rounded-xl flex items-center gap-3 ${rewardRule === 'performance' ? 'bg-white text-black' : 'bg-white/5 text-white/60 border border-white/10'}`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${rewardRule === 'performance' ? 'border-black' : 'border-white/30'}`}>
                      {rewardRule === 'performance' && <div className="w-3 h-3 rounded-full bg-black" />}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">按效果</div>
                      <div className={`text-xs ${rewardRule === 'performance' ? 'text-gray-600' : 'text-white/40'}`}>根据浏览量/点赞量自动发放</div>
                    </div>
                  </button>
                  <button onClick={() => setRewardRule('ranking')} className={`w-full p-3 rounded-xl flex items-center gap-3 ${rewardRule === 'ranking' ? 'bg-white text-black' : 'bg-white/5 text-white/60 border border-white/10'}`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${rewardRule === 'ranking' ? 'border-black' : 'border-white/30'}`}>
                      {rewardRule === 'ranking' && <div className="w-3 h-3 rounded-full bg-black" />}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">按排名</div>
                      <div className={`text-xs ${rewardRule === 'ranking' ? 'text-gray-600' : 'text-white/40'}`}>前N名获得奖励</div>
                    </div>
                  </button>
                  <button onClick={() => setRewardRule('random')} className={`w-full p-3 rounded-xl flex items-center gap-3 ${rewardRule === 'random' ? 'bg-white text-black' : 'bg-white/5 text-white/60 border border-white/10'}`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${rewardRule === 'random' ? 'border-black' : 'border-white/30'}`}>
                      {rewardRule === 'random' && <div className="w-3 h-3 rounded-full bg-black" />}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">随机抽取</div>
                      <div className={`text-xs ${rewardRule === 'random' ? 'text-gray-600' : 'text-white/40'}`}>从参与者中随机抽取</div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-2 block">最大参与人数</label>
                <input type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} placeholder="例如：500" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none" />
              </div>

              <button onClick={handlePublishTask} disabled={loading} className="w-full py-3 bg-white text-black rounded-xl font-bold disabled:opacity-50">{loading ? '发布中...' : '发布任务'}</button>
            </div>
          </div>
        </div>
      )}

      {showDetail && (
        <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto">
          <div className="max-w-lg mx-auto bg-black min-h-screen pb-16">
            <header className="sticky top-0 bg-black border-b border-white/10 z-40 px-4 py-3">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-white">任务详情</h1>
                <button onClick={() => setShowDetail(null)} className="text-white/60">✕</button>
              </div>
            </header>

            <div className="p-4">
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-white font-bold text-lg mb-2">任务详情</h3>
                <p className="text-white/60 text-sm">任务ID: {showDetail}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReward && (
        <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto">
          <div className="max-w-lg mx-auto bg-black min-h-screen pb-16">
            <header className="sticky top-0 bg-black border-b border-white/10 z-40 px-4 py-3">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-white">领取奖励</h1>
                <button onClick={() => setShowReward(false)} className="text-white/60">✕</button>
              </div>
            </header>

            <div className="p-4">
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🎁</div>
                <h3 className="text-white font-bold text-lg mb-2">领取奖励</h3>
                <p className="text-white/60 text-sm">选择要领取的奖励</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
