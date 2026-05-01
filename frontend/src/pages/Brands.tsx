import { useState } from 'react'

export default function Brands() {
  const [activeTab, setActiveTab] = useState<'market' | 'challenges' | 'ranking' | 'incubator'>('market')

  const brands = [
    { id: '1', name: '优衣库', avatar: '👕', level: '金牌', tasks: 12, followers: 56789, description: '全球知名服装品牌' },
    { id: '2', name: '美团', avatar: '🍔', level: '银牌', tasks: 8, followers: 34567, description: '本地生活服务平台' },
    { id: '3', name: '配音秀', avatar: '🎙️', level: '铜牌', tasks: 5, followers: 23456, description: '专业配音平台' },
    { id: '4', name: '创意工坊', avatar: '🎨', level: '金牌', tasks: 15, followers: 45678, description: '创意设计平台' },
  ]

  const challenges = [
    { id: '1', title: '夏日穿搭挑战', brand: '优衣库', reward: '5000元', participants: 2345, deadline: '2026-05-10', icon: '👗' },
    { id: '2', title: '美食探店大赛', brand: '美团', reward: '3000元', participants: 1890, deadline: '2026-05-15', icon: '🍔' },
    { id: '3', title: '配音作品大赛', brand: '配音秀', reward: '2000元', participants: 1234, deadline: '2026-05-20', icon: '🎙️' },
  ]

  const rankings = [
    { id: '1', name: '创意达人小王', avatar: '🎨', recommends: 1234, earnings: 56789, level: '传奇' },
    { id: '2', name: '时尚达人小美', avatar: '👗', recommends: 987, earnings: 45678, level: '大师' },
    { id: '3', name: '游戏达人小李', avatar: '🎮', recommends: 876, earnings: 34567, level: '专家' },
    { id: '4', name: '音乐达人小陈', avatar: '🎵', recommends: 765, earnings: 23456, level: '传奇' },
    { id: '5', name: '美食达人小张', avatar: '🍔', recommends: 654, earnings: 12345, level: '大师' },
  ]

  const incubatorServices = [
    { id: '1', title: '品牌定位', desc: '帮你找到独特的品牌定位', icon: '🎯', price: '500元' },
    { id: '2', title: '内容策划', desc: '专业内容策划团队', icon: '📝', price: '1000元' },
    { id: '3', title: '推广策略', desc: '制定个性化推广策略', icon: '📢', price: '800元' },
    { id: '4', title: '品牌设计', desc: '专业品牌视觉设计', icon: '🎨', price: '1500元' },
    { id: '5', title: '商业对接', desc: '对接品牌合作机会', icon: '🤝', price: '2000元' },
  ]

  return (
    <div className="max-w-lg mx-auto bg-black min-h-screen pb-16">
      <header className="sticky top-0 bg-black border-b border-white/10 z-40 px-4 py-3">
        <h1 className="text-xl font-bold text-white">品牌中心</h1>
      </header>

      <div className="bg-black px-4 py-2 border-b border-white/10">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
          <button onClick={() => setActiveTab('market')} className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${activeTab === 'market' ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`}>品牌市场</button>
          <button onClick={() => setActiveTab('challenges')} className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${activeTab === 'challenges' ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`}>挑战赛</button>
          <button onClick={() => setActiveTab('ranking')} className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${activeTab === 'ranking' ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`}>排行榜</button>
          <button onClick={() => setActiveTab('incubator')} className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${activeTab === 'incubator' ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`}>品牌孵化</button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {activeTab === 'market' && (
          <>
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4">
              <h3 className="text-white font-bold mb-2">🏢 品牌市场</h3>
              <p className="text-white/60 text-sm">发现优质品牌，参与品牌任务</p>
            </div>
            {brands.map(brand => (
              <div key={brand.id} className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{brand.avatar}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white">{brand.name}</h4>
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">{brand.level}</span>
                    </div>
                    <div className="text-xs text-white/40">{brand.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-white/40 mb-3">
                  <span>📋 {brand.tasks}个任务</span>
                  <span>👥 {brand.followers}粉丝</span>
                </div>
                <button className="w-full py-2 bg-white text-black rounded-lg font-medium">关注品牌</button>
              </div>
            ))}
          </>
        )}

        {activeTab === 'challenges' && (
          <>
            <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl p-4">
              <h3 className="text-white font-bold mb-2">🏆 品牌挑战赛</h3>
              <p className="text-white/60 text-sm">参与品牌挑战，赢取丰厚奖励</p>
            </div>
            {challenges.map(challenge => (
              <div key={challenge.id} className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{challenge.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-white">{challenge.title}</h4>
                    <div className="text-xs text-white/40">{challenge.brand} · 截止 {challenge.deadline}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-primary font-bold text-lg">🎁 {challenge.reward}</span>
                  <span className="text-sm text-white/40">{challenge.participants}人参与</span>
                </div>
                <button className="w-full py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium">参与挑战</button>
              </div>
            ))}
          </>
        )}

        {activeTab === 'ranking' && (
          <>
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4">
              <h3 className="text-white font-bold mb-2">🏆 排行榜</h3>
              <p className="text-white/60 text-sm">被推荐最多、收益最高的创作者</p>
            </div>
            {rankings.map((rank, index) => (
              <div key={rank.id} className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <span className="text-2xl">{rank.avatar}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white">{rank.name}</h4>
                      <span className="px-2 py-0.5 bg-white/10 text-white/60 text-xs rounded-full">{rank.level}</span>
                    </div>
                    <div className="text-xs text-white/40">被推荐 {rank.recommends} 次</div>
                  </div>
                  <span className="text-primary font-bold">¥{rank.earnings}</span>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'incubator' && (
          <>
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4">
              <h3 className="text-white font-bold mb-2">🚀 品牌孵化</h3>
              <p className="text-white/60 text-sm">专业品牌孵化服务，助你成为品牌</p>
            </div>
            {incubatorServices.map(service => (
              <div key={service.id} className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{service.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-white">{service.title}</h4>
                    <div className="text-sm text-white/60">{service.desc}</div>
                  </div>
                  <span className="text-primary font-bold">{service.price}</span>
                </div>
                <button className="w-full py-2 bg-white text-black rounded-lg font-medium">了解详情</button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
