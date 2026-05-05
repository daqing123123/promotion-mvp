// ===== 品牌中心（真实数据版） =====

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getBrands, getTopics } from '../lib/api/client'

export default function Brands() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'brands' | 'topics'>('brands')
  const [brands, setBrands] = useState<any[]>([])
  const [brandTopics, setBrandTopics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [brandData, topicData] = await Promise.all([
      getBrands().catch(() => [] as any[]),
      getTopics().catch(() => [] as any[]),
    ])
    setBrands(brandData || [])
    // 只显示品牌方话题
    setBrandTopics((topicData || []).filter((t: any) => t.creator_type === 'brand' || t.brand_name))
    setLoading(false)
  }

  const formatNum = (n: number) => n >= 10000 ? (n / 10000).toFixed(1) + '万' : n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)

  if (loading) return (
    <div className="max-w-lg mx-auto bg-black min-h-screen flex items-center justify-center text-white/40">
      加载中...
    </div>
  )

  return (
    <div className="max-w-lg mx-auto bg-black min-h-screen pb-16">
      <header className="sticky top-0 bg-black border-b border-white/10 z-40 px-4 py-3">
        <h1 className="text-xl font-bold text-white">品牌中心</h1>
      </header>

      <div className="bg-black px-4 py-2 border-b border-white/10">
        <div className="flex gap-3">
          <button onClick={() => setActiveTab('brands')} className={`px-4 py-1.5 rounded-full text-sm ${activeTab === 'brands' ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`}>
            品牌列表 ({brands.length})
          </button>
          <button onClick={() => setActiveTab('topics')} className={`px-4 py-1.5 rounded-full text-sm ${activeTab === 'topics' ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`}>
            品牌话题 ({brandTopics.length})
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {activeTab === 'brands' && (
          <>
            {brands.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🏢</div>
                <p className="text-white/40 mb-2">还没有品牌入驻</p>
                <p className="text-white/20 text-sm mb-4">成为第一个品牌方，发布推广话题</p>
                <button onClick={() => navigate('/publish')} className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium">
                  🚀 发布品牌话题
                </button>
              </div>
            ) : (
              brands.map(brand => (
                <div key={brand.id} className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition cursor-pointer"
                  onClick={() => navigate('/topics')}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl"
                      style={brand.logo ? { backgroundImage: `url(${brand.logo})`, backgroundSize: 'cover' } : {}}>
                      {!brand.logo && '🏷️'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white">{brand.name}</h4>
                      {brand.description && <div className="text-xs text-white/40">{brand.description}</div>}
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm text-white/40">
                    <span>📋 {brand.topic_count || 0}个话题</span>
                    <span>🔥 {formatNum(brand.total_promotes || 0)}次推广</span>
                    <span>👥 {formatNum(brand.total_participants || 0)}参与</span>
                  </div>
                </div>
              ))
            )}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 text-center">
              <p className="text-white/40 text-sm">你是品牌方？</p>
              <button onClick={() => navigate('/publish')} className="mt-2 px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium">
                发布品牌推广话题
              </button>
            </div>
          </>
        )}

        {activeTab === 'topics' && (
          <>
            {brandTopics.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📢</div>
                <p className="text-white/40 mb-2">暂没有品牌话题</p>
                <button onClick={() => navigate('/publish')} className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium">
                  🚀 发布第一个
                </button>
              </div>
            ) : (
              brandTopics.map((topic: any) => (
                <div key={topic.id} className="bg-white/5 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition"
                  onClick={() => navigate(`/topic/${topic.id}`)}>
                  <div className="flex items-center gap-2 mb-2">
                    {topic.brand_logo && (
                      <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-xs overflow-hidden"
                        style={{ backgroundImage: topic.brand_logo ? `url(${topic.brand_logo})` : undefined, backgroundSize: 'cover' }}>
                        {!topic.brand_logo && '🏷️'}
                      </div>
                    )}
                    <span className="text-xs font-medium text-blue-400">{topic.brand_name}</span>
                    <span className={`px-2 py-0.5 text-[10px] rounded-full ${topic.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {topic.status === 'active' ? '推广中' : '已结束'}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-white mb-1">{topic.title}</h3>
                  <p className="text-xs text-white/40 mb-3 line-clamp-2">{topic.description}</p>
                  <div className="flex gap-4 text-xs text-white/30">
                    <span>💰 {topic.reward_pool || 0}积分池</span>
                    <span>📢 {topic.promote_count || 0}次推广</span>
                    <span>👥 {topic.participant_count || 0}参与</span>
                    <span>🔥 {topic.hot_score || 0}热度</span>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
}
