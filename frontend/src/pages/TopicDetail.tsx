// ===== 话题详情页 — 品牌推广版 =====

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase, earnPoints } from '../lib/supabase/client'
import { checkAndUnlockAchievements } from '../lib/achievements'
import MemeModal from '../components/MemeModal'

export default function TopicDetail({ user }: { user?: any }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const [topic, setTopic] = useState<any>(null)
  const [memes, setMemes] = useState<any[]>([])
  const [showMemeCreate, setShowMemeCreate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [promoted, setPromoted] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [promoteProgress, setPromoteProgress] = useState({ accepted: 0, target: 0 })

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

      // 检查当前用户是否已接受推广
      if (user?.id) {
        const { data: existing } = await supabase
          .from('topic_promotes')
          .select('id')
          .eq('topic_id', topicId)
          .eq('user_id', user.id)
          .maybeSingle()
        if (existing) setPromoted(true)
      }

      // 获取推广进度
      const { count } = await supabase
        .from('topic_promotes')
        .select('*', { count: 'exact', head: true })
        .eq('topic_id', topicId)
      setPromoteProgress({ accepted: count || 0, target: t.promote_target || 100 })
    }
    setLoading(false)
  }

  const formatNum = (n: number) => n >= 10000 ? (n / 10000).toFixed(1) + '万' : n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)

  const getDaysLeft = (endDate: string) => {
    if (!endDate) return '无限期'
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000)
    return days > 0 ? `${days} 天` : '已结束'
  }

  const handleAcceptPromote = async () => {
    if (!user?.id) return navigate('/login')
    if (promoted || accepting) return
    setAccepting(true)
    try {
      const { error } = await supabase.from('topic_promotes').insert({
        topic_id: topic.id,
        user_id: user.id,
        status: 'accepted',
        points_earned: topic.promote_reward || 20,
      })
      if (error) throw error

      // 给积分
      try {
        await earnPoints(user.id, topic.promote_reward || 20, 'promote', `接受推广任务「${topic.title}」`)
        // 更新话题推广数
        await supabase.from('topics').update({ promote_count: (topic.promote_count || 0) + 1 }).eq('id', topic.id)
        setPromoted(true)
        setPromoteProgress(p => ({ ...p, accepted: p.accepted + 1 }))
        checkAndUnlockAchievements(user.id).catch(() => {})
        alert(`接受推广成功！+${topic.promote_reward || 20}积分`)
      } catch (e: any) {
        if (e.message?.includes('今日该类积分已达上限')) {
          setPromoted(true)
          alert('已接受推广（今日积分已达上限）')
        } else {
          throw e
        }
      }
    } catch (e: any) {
      alert(e.message || '接受推广失败')
    } finally {
      setAccepting(false)
    }
  }

  const handleShare = () => {
    const url = window.location.origin + '/topic/' + topic.id
    const text = `${topic.brand_name ? '【' + topic.brand_name + '】' : ''}${topic.title} — 来巨浪参与推广，赚积分！`
    if (navigator.share) {
      navigator.share({ title: topic.title, text, url })
    } else {
      navigator.clipboard.writeText(text + ' ' + url)
      alert('推广链接已复制，快去分享吧！')
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">加载中...</div>
  if (!topic) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">话题不存在</div>

  const isBrand = topic.creator_type === 'brand' || !!topic.brand_name
  const progressPercent = promoteProgress.target > 0 ? Math.min(100, Math.round(promoteProgress.accepted / promoteProgress.target * 100)) : 0

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* 品牌头部 */}
      {isBrand && topic.brand_logo ? (
        <div className="relative">
          <div className="h-32 bg-gradient-to-br from-gray-800 to-gray-600" />
          <div className="absolute inset-0 flex items-center justify-center">
            <img src={topic.brand_logo} alt={topic.brand_name} className="h-20 w-20 rounded-2xl object-cover border-2 border-white shadow-lg" />
          </div>
        </div>
      ) : null}

      {/* 话题信息 */}
      <div className={`bg-white px-5 pb-5 ${isBrand && topic.brand_logo ? 'pt-14' : 'pt-12'}`}>
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => navigate(-1)} className="text-gray-400">←</button>
          {isBrand && (
            <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-blue-50 text-blue-600">🏷️ 品牌推广</span>
          )}
          <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-gray-100 text-gray-600">{topic.type}</span>
          <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-green-50 text-green-600">{topic.status === 'active' ? '进行中' : '已结束'}</span>
        </div>

        {/* 品牌名 */}
        {topic.brand_name && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-blue-600">{topic.brand_name}</span>
            {topic.brand_description && <span className="text-xs text-gray-400">· {topic.brand_description}</span>}
          </div>
        )}

        <h1 className="text-xl font-bold text-gray-900 mb-2">{topic.title}</h1>
        <p className="text-sm text-gray-500 mb-4">{topic.description}</p>

        {/* 发起者 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">{topic.creator_avatar}</div>
          <div className="flex-1">
            <div className="text-sm font-bold text-gray-900">{topic.creator_name}</div>
            <div className="text-xs text-gray-400">{isBrand ? '品牌方发起' : '个人发起'}</div>
          </div>
        </div>

        {/* 统计 */}
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

      {/* 推广任务卡片（品牌话题特有） */}
      {isBrand && (
        <div className="mx-5 mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-gray-900">📢 推广任务</h3>
            <span className="text-sm text-blue-600 font-medium">+{topic.promote_reward || 20}积分/次</span>
          </div>

          {/* 进度条 */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>推广进度</span>
              <span>{promoteProgress.accepted}/{promoteProgress.target}</span>
            </div>
            <div className="h-2 bg-white rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          {/* 推广说明 */}
          <div className="text-xs text-gray-500 mb-4 space-y-1">
            <p>• 接受任务后，分享话题链接给好友</p>
            <p>• 好友通过你的链接访问，你获得积分奖励</p>
            <p>• 分享越多，赚得越多，还能解锁帮推成就</p>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            {promoted ? (
              <>
                <button onClick={handleShare} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm active:scale-[0.98] transition-transform">
                  📤 分享赚积分
                </button>
                <button className="px-4 py-3 bg-white text-green-600 rounded-xl font-bold text-sm border border-green-200">
                  ✅ 已接受
                </button>
              </>
            ) : (
              <button
                onClick={handleAcceptPromote}
                disabled={accepting}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm active:scale-[0.98] transition-transform"
              >
                {accepting ? '接受中...' : `🎯 接受推广任务 (+${topic.promote_reward || 20}积分)`}
              </button>
            )}
          </div>
        </div>
      )}

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
            if (!user?.id) { navigate('/login'); return }
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
