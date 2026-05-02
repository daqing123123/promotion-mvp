// ===== 话题详情页 =====

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase/client'
import MemeModal from '../components/MemeModal'

export default function TopicDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [topic, setTopic] = useState<any>(null)
  const [memes, setMemes] = useState<any[]>([])
  const [showMemeCreate, setShowMemeCreate] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) fetchTopic(id)
  }, [id])

  const fetchTopic = async (topicId: string) => {
    setLoading(true)
    const { data: t } = await supabase.from('topics').select('*').eq('id', topicId).single()
    setTopic(t)
    if (t) {
      const { data: m } = await supabase.from('memes').select('*').eq('topic_id', topicId).order('hot_score', { ascending: false })
      setMemes(m || [])
    }
    setLoading(false)
  }

  const formatNum = (n: number) => n >= 10000 ? (n / 10000).toFixed(1) + '万' : n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)

  const getDaysLeft = (endDate: string) => {
    if (!endDate) return '无限期'
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000)
    return days > 0 ? `${days} 天` : '已结束'
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">加载中...</div>
  if (!topic) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">话题不存在</div>

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* 话题信息 */}
      <div className="bg-white px-5 pt-12 pb-5">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => navigate(-1)} className="text-gray-400">←</button>
          <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-gray-100 text-gray-600">{topic.type}</span>
          <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-green-50 text-green-600">{topic.status === 'active' ? '进行中' : '已结束'}</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">{topic.title}</h1>
        <p className="text-sm text-gray-500 mb-4">{topic.description}</p>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">{topic.creator_avatar}</div>
          <div>
            <div className="text-sm font-bold text-gray-900">{topic.creator_name}</div>
            <div className="text-xs text-gray-400">{topic.creator_type === 'brand' ? '品牌' : '个人'}发起</div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl p-3 text-center"><div className="text-lg font-bold text-gray-900">{topic.meme_count}</div><div className="text-[10px] text-gray-400">梗</div></div>
          <div className="bg-gray-50 rounded-xl p-3 text-center"><div className="text-lg font-bold text-gray-900">{formatNum(topic.total_views)}</div><div className="text-[10px] text-gray-400">曝光</div></div>
          <div className="bg-gray-50 rounded-xl p-3 text-center"><div className="text-lg font-bold text-gray-900">{topic.participant_count}</div><div className="text-[10px] text-gray-400">参与</div></div>
          <div className="bg-gray-50 rounded-xl p-3 text-center"><div className="text-lg font-bold text-orange-500">{topic.hot_score}</div><div className="text-[10px] text-gray-400">热度</div></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center"><div className="text-sm font-bold text-gray-900">💰 {topic.reward_pool}</div><div className="text-[10px] text-gray-400">奖池积分</div></div>
          <div className="text-center"><div className="text-sm font-bold text-gray-900">⏰ {getDaysLeft(topic.end_date)}</div><div className="text-[10px] text-gray-400">剩余时间</div></div>
        </div>
      </div>

      {/* 造梗按钮 */}
      <div className="px-5 py-4">
        <button onClick={() => setShowMemeCreate(true)} className="w-full py-3 bg-black text-white rounded-2xl font-bold text-base active:scale-[0.98] transition-transform">
          🔥 我要造梗
        </button>
      </div>

      {/* 热门梗 */}
      <div className="px-5">
        <h2 className="text-lg font-bold text-gray-900 mb-3">🔥 热门梗</h2>
        {memes.length === 0 ? (
          <div className="text-center py-8 text-gray-400">还没有梗，快来第一个造梗！</div>
        ) : (
          <div className="space-y-3">
            {memes.map((meme, i) => (
              <div key={meme.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</span>
                  <span className={`px-2 py-0.5 text-[10px] rounded-full ${meme.status === 'viral' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                    {meme.status === 'viral' ? '🔥 爆款' : '已发布'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">{meme.title}</h3>
                <p className="text-sm text-gray-500 mb-2">{meme.content}</p>
                <div className="flex gap-2 mb-2">
                  {(meme.hashtags || []).map((tag: string) => (
                    <span key={tag} className="text-xs text-blue-500">#{tag}</span>
                  ))}
                </div>
                <div className="flex gap-4 text-xs text-gray-400">
                  <span>👁 {formatNum(meme.view_count)}</span>
                  <span>❤️ {formatNum(meme.like_count)}</span>
                  <span>🔄 {formatNum(meme.share_count)}</span>
                  <span>🔥 {meme.hot_score}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 造梗弹窗 */}
      {showMemeCreate && (
        <MemeModal
          targetTitle={topic.title}
          onClose={() => setShowMemeCreate(false)}
          onSuccess={async (meme) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { navigate('/login'); return }
            await supabase.from('memes').insert({
              type: meme.type,
              title: meme.title,
              content: meme.content,
              hashtags: meme.hashtags,
              topic_id: topic.id,
              creator_id: user.id,
            })
            setShowMemeCreate(false)
            fetchTopic(topic.id)
          }}
        />
      )}
    </div>
  )
}
