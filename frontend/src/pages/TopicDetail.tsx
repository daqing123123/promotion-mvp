// ===== 话题详情页 — 品牌推广完整版 =====

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getTopicById, getMemesByTopic, getComments, getUserById, checkInteraction, toggleLikeWithPoints, addCommentWithPoints, acceptTopicPromote, updateTopicPromote, claimTopicCoupon, getTopicPromotes, createMeme } from '../lib/api/client'
import { checkAndUnlockAchievements } from '../lib/achievements'
import { toast } from '../lib/toast'
import MemeModal from '../components/MemeModal'

export default function TopicDetail({ user }: { user?: any }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const [topic, setTopic] = useState<any>(null)
  const [memes, setMemes] = useState<any[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [showMemeCreate, setShowMemeCreate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [promoted, setPromoted] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [promoteProgress, setPromoteProgress] = useState({ accepted: 0, target: 0 })
  const [myPromote, setMyPromote] = useState<any>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [address, setAddress] = useState({ name: '', phone: '', address: '' })
  const [submittingAddress, setSubmittingAddress] = useState(false)

  useEffect(() => {
    if (id) fetchTopic(id)
  }, [id])

  const fetchTopic = async (topicId: string) => {
    setLoading(true)
    try {
      const t = await getTopicById(topicId)
      setTopic(t)
      if (t) {
        // 并行加载 memes + comments
        const [memesData, commentsData] = await Promise.all([
          getMemesByTopic(topicId),
          getComments('topic', topicId),
        ])

        setMemes((memesData || []).slice(0, 50))
        setLikeCount(t.like_count || 0)

        // 评论 + 用户信息
        const cmts = (commentsData || []).slice(0, 50)
        const userIds = [...new Set(cmts.map((c: any) => c.user_id).filter(Boolean))]
        let usersMap: Record<string, any> = {}
        if (userIds.length > 0) {
          const usersData = await Promise.all(userIds.map((uid: string) => getUserById(uid).catch(() => null)))
          usersMap = Object.fromEntries(usersData.filter(Boolean).map((u: any) => [u.id, u]))
        }
        setComments(cmts.map((c: any) => ({
          ...c,
          user_name: usersMap[c.user_id]?.name || '匿名用户',
          user_avatar: usersMap[c.user_id]?.avatar || '👤',
        })))

        // 推广进度
        const promotes = await getTopicPromotes(topicId).catch(() => [] as any[])
        const promoteArr = promotes || []
        setPromoteProgress({
          accepted: promoteArr.length,
          target: t.promote_target || 100,
        })

        // 当前用户状态
        if (user?.id) {
          const likedData = await checkInteraction('topic', topicId, 'like').catch(() => null)
          if (likedData?.exists) setLiked(true)

          const myP = promoteArr.find((p: any) => p.user_id === user.id || p.userId === user.id)
          if (myP) {
            setPromoted(true)
            setMyPromote(myP)
          }
        }
      }
    } catch (e: any) {
      console.error('加载话题失败', e)
    }
    setLoading(false)
  }

  const formatNum = (n: number) => n >= 10000 ? (n / 10000).toFixed(1) + '万' : n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)

  const getDaysLeft = (endDate: string) => {
    if (!endDate) return '无限期'
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000)
    return days > 0 ? `${days} 天` : '已结束'
  }

  const handleLike = async () => {
    if (!user?.id) return navigate('/login')
    const prev = liked
    setLiked(!prev)
    setLikeCount(c => c + (prev ? -1 : 1))
    try {
      await toggleLikeWithPoints('topic', topic.id)
      checkAndUnlockAchievements(user.id).catch(() => {})
    } catch {
      setLiked(prev)
      setLikeCount(c => c + (prev ? 1 : -1))
    }
  }

  const handleComment = async () => {
    if (!newComment.trim() || !user?.id) return navigate('/login')
    setSubmitting(true)
    try {
      const inserted = await addCommentWithPoints('topic', topic.id, newComment.trim())
      setComments([{
        ...inserted,
        user_name: user.name || '匿名用户',
        user_avatar: user.avatar || '👤',
      }, ...comments])
      setNewComment('')
      checkAndUnlockAchievements(user.id).catch(() => {})
    } catch (e: any) {
      toast.error(e.message || '评论失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAcceptPromote = async () => {
    if (!user?.id) return navigate('/login')
    if (promoted || accepting) return

    // 如果是实物奖励，先弹地址表单
    const isPhysical = topic.reward_type === 'physical' || topic.reward_type === 'both'
    if (isPhysical && !showAddressForm) {
      setShowAddressForm(true)
      return
    }

    setAccepting(true)
    try {
      const insertData: any = {
        topic_id: topic.id,
        user_id: user.id,
        status: 'accepted',
        points_earned: topic.promote_reward || 20,
      }
      // 如果有地址信息
      if (address.name && address.phone && address.address) {
        insertData.receiver_name = address.name
        insertData.receiver_phone = address.phone
        insertData.receiver_address = address.address
        insertData.status = 'address_submitted'
      }

      const data = await acceptTopicPromote(topic.id, insertData)

      // 如果是优惠券奖励，自动发券（后端已处理计数更新）
      if (isCoupon && topic.coupon_type) {
        try { await claimTopicCoupon(topic.id) } catch {}
      }

      setPromoted(true)
      setMyPromote(data)
      setPromoteProgress(p => ({ ...p, accepted: p.accepted + 1 }))
      setShowAddressForm(false)
      checkAndUnlockAchievements(user.id).catch(() => {})
      if (isCoupon) {
        toast.success(`🎫 优惠券已领取！${topic.coupon_value || ''}`)
      } else if (isPhysical) {
        toast.success('已提交！等待商家发货')
      } else {
        toast.success(`接受推广成功！+${topic.promote_reward || 20}积分`)
      }
    } catch (e: any) {
      toast.error(e.message || '接受推广失败')
    } finally {
      setAccepting(false)
    }
  }

  const handleSubmitAddress = async () => {
    if (!address.name || !address.phone || !address.address) {
      toast.warning('请填写完整收货信息')
      return
    }
    setSubmittingAddress(true)
    try {
      if (myPromote?.id) {
        // 已接受推广，更新地址
        const updated = await updateTopicPromote(myPromote.id, {
          receiver_name: address.name,
          receiver_phone: address.phone,
          receiver_address: address.address,
          status: 'address_submitted',
        })
        setMyPromote({ ...myPromote, ...updated })
        toast.success('地址已提交！')
      } else {
        // 直接接受推广 + 提交地址
        await handleAcceptPromote()
      }
      setShowAddressForm(false)
    } catch (e: any) {
      toast.error(e.message || '提交失败')
    } finally {
      setSubmittingAddress(false)
    }
  }

  const handleShare = () => {
    const url = window.location.origin + '/topic/' + topic.id
    const text = `${topic.brand_name ? '【' + topic.brand_name + '】' : ''}${topic.title} — 来巨浪参与推广，赚积分！`
    if (navigator.share) {
      navigator.share({ title: topic.title, text, url })
    } else {
      navigator.clipboard.writeText(text + ' ' + url)
      toast.success('推广链接已复制，快去分享吧！')
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">加载中...</div>
  if (!topic) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">话题不存在</div>

  const isBrand = topic.creator_type === 'brand' || !!topic.brand_name
  const isPhysical = topic.reward_type === 'physical' || topic.reward_type === 'both'
  const isPoints = topic.reward_type === 'points' || topic.reward_type === 'both' || !topic.reward_type
  const isCoupon = topic.reward_type === 'coupon' || topic.coupon_type
  const isCash = topic.reward_type === 'cash'
  const progressPercent = promoteProgress.target > 0 ? Math.min(100, Math.round(promoteProgress.accepted / promoteProgress.target * 100)) : 0

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
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
          {isBrand && <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-blue-50 text-blue-600">🏷️ 品牌推广</span>}
          <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-gray-100 text-gray-600">{topic.type}</span>
          <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-green-50 text-green-600">{topic.status === 'active' ? '进行中' : '已结束'}</span>
        </div>

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
          <div className="bg-gray-50 rounded-xl p-3 text-center"><div className="text-lg font-bold text-gray-900">{topic.meme_count || memes.length}</div><div className="text-[10px] text-gray-400">梗</div></div>
          <div className="bg-gray-50 rounded-xl p-3 text-center"><div className="text-lg font-bold text-gray-900">{formatNum(topic.total_views)}</div><div className="text-[10px] text-gray-400">曝光</div></div>
          <div className="bg-gray-50 rounded-xl p-3 text-center"><div className="text-lg font-bold text-gray-900">{topic.participant_count}</div><div className="text-[10px] text-gray-400">参与</div></div>
          <div className="bg-gray-50 rounded-xl p-3 text-center"><div className="text-lg font-bold text-orange-500">{topic.hot_score}</div><div className="text-[10px] text-gray-400">热度</div></div>
        </div>

        {/* 点赞 + 统计栏 */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-5">
            <button onClick={handleLike} className="flex items-center gap-1.5">
              <span className="text-xl">{liked ? '❤️' : '🤍'}</span>
              <span className="text-sm text-gray-600">{likeCount}</span>
            </button>
            <button className="flex items-center gap-1.5">
              <span className="text-xl">💬</span>
              <span className="text-sm text-gray-600">{comments.length}</span>
            </button>
            <button onClick={handleShare} className="flex items-center gap-1.5">
              <span className="text-xl">↗️</span>
              <span className="text-sm text-gray-600">分享</span>
            </button>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {topic.reward_pool > 0 && <span>💰 {topic.reward_pool}积分</span>}
            <span>⏰ {getDaysLeft(topic.end_date)}</span>
          </div>
        </div>
      </div>

      {/* 奖励信息卡片 */}
      {isBrand && (
        <div className="mx-5 mt-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🎁</span>
            <h3 className="text-sm font-bold text-gray-900">奖励内容</h3>
          </div>
          <div className="space-y-1.5">
            {isPoints && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span>💰</span>
                <span>每次帮推 +{topic.promote_reward || 20} 积分</span>
              </div>
            )}
            {isCash && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span>💵</span>
                <span>{topic.reward_description || '现金奖励（详见话题说明）'}</span>
              </div>
            )}
            {isCoupon && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span>🎫</span>
                <span>{topic.coupon_value || '优惠券'} · 限{topic.coupon_count || 0}张 {topic.coupon_claimed >= topic.coupon_count ? '(已领完)' : `(${topic.coupon_claimed || 0}人已领)`}</span>
              </div>
            )}
            {isPhysical && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span>📦</span>
                <span>{topic.reward_description || '实物奖励（详见话题说明）'}</span>
              </div>
            )}
            {!isPoints && !isPhysical && !isCoupon && !isCash && (
              <div className="text-sm text-gray-500">暂无奖励说明</div>
            )}
          </div>
        </div>
      )}

      {/* 推广任务卡片 */}
      {isBrand && (
        <div className="mx-5 mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-gray-900">📢 推广任务</h3>
            <span className="text-sm text-blue-600 font-medium">
              {isPoints && `+${topic.promote_reward || 20}积分/次`}
              {isPhysical && !isPoints && '🎁 实物奖励'}
            </span>
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

          {/* 推广状态 */}
          {promoted && myPromote && (
            <div className="mb-3 p-3 bg-white rounded-xl">
              <div className="flex items-center gap-2 text-sm">
                {myPromote.status === 'accepted' && <><span className="text-green-500">✅</span><span className="text-gray-700">已接受推广</span></>}
                {myPromote.status === 'address_submitted' && <><span className="text-blue-500">📬</span><span className="text-gray-700">地址已提交，等待发货</span></>}
                {myPromote.status === 'shipped' && <><span className="text-purple-500">🚚</span><span className="text-gray-700">已发货，请注意查收</span></>}
                {myPromote.status === 'received' && <><span className="text-green-500">🎉</span><span className="text-gray-700">已收货</span></>}
                {myPromote.status === 'completed' && <><span className="text-green-500">✅</span><span className="text-gray-700">已完成</span></>}
              </div>
              {/* 补填地址按钮 */}
              {isPhysical && myPromote.status === 'accepted' && (
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="mt-2 text-xs text-blue-600 underline"
                >
                  📝 补填收货地址
                </button>
              )}
            </div>
          )}

          {/* 推广说明 */}
          <div className="text-xs text-gray-500 mb-4 space-y-1">
            {isPoints && <p>• 接受任务后，分享话题链接给好友</p>}
            {isPoints && <p>• 好友通过你的链接访问，你获得积分奖励</p>}
            {isPhysical && <p>• 接受任务后填写收货地址</p>}
            {isPhysical && <p>• 商家审核后发货，收到后请提交反馈</p>}
            <p>• 分享越多，赚得越多，还能解锁帮推成就</p>
          </div>

          {/* 地址表单 */}
          {showAddressForm && (
            <div className="mb-4 p-4 bg-white rounded-xl border border-gray-200 space-y-3">
              <h4 className="text-sm font-bold text-gray-900">📬 收货地址</h4>
              <input
                type="text"
                value={address.name}
                onChange={e => setAddress(a => ({ ...a, name: e.target.value }))}
                placeholder="收件人姓名"
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <input
                type="tel"
                value={address.phone}
                onChange={e => setAddress(a => ({ ...a, phone: e.target.value }))}
                placeholder="手机号"
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <textarea
                value={address.address}
                onChange={e => setAddress(a => ({ ...a, address: e.target.value }))}
                placeholder="详细收货地址（省市区 + 街道门牌号）"
                rows={3}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowAddressForm(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">
                  取消
                </button>
                <button
                  onClick={handleSubmitAddress}
                  disabled={submittingAddress || !address.name || !address.phone || !address.address}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${
                    address.name && address.phone && address.address
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {submittingAddress ? '提交中...' : '确认提交'}
                </button>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3">
            {promoted ? (
              <>
                <button onClick={handleShare} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm active:scale-[0.98] transition-transform">
                  📤 分享赚积分
                </button>
                {isPhysical && myPromote?.status === 'accepted' && !myPromote?.receiver_name && (
                  <button onClick={() => setShowAddressForm(true)} className="px-4 py-3 bg-amber-500 text-white rounded-xl font-bold text-sm active:scale-[0.98] transition-transform">
                    📬 填地址
                  </button>
                )}
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
                {accepting ? '接受中...' : isCoupon ? `🎫 领取优惠券 (+${topic.promote_reward || 20}积分)` : isPhysical ? `🎯 接受任务 + 填地址 (+${topic.promote_reward || 20}积分)` : `🎯 接受推广任务 (+${topic.promote_reward || 20}积分)`}
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
        <h2 className="text-lg font-bold text-gray-900 mb-3">🔥 热门梗 ({memes.length})</h2>
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

      {/* 评论区 */}
      <div className="px-5 mt-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">💬 评论 ({comments.length})</h2>

        {/* 发表评论 */}
        <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="说说你对这个话题的看法..."
            rows={3}
            className="w-full text-sm resize-none focus:outline-none"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleComment}
              disabled={!newComment.trim() || submitting}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                newComment.trim() ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'
              }`}
            >
              {submitting ? '发送中...' : '发表 (+5积分)'}
            </button>
          </div>
        </div>

        {/* 评论列表 */}
        <div className="space-y-3">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">还没有评论，来说两句吧 💬</div>
          ) : (
            comments.map(c => (
              <div key={c.id} className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">{c.user_avatar || '👤'}</div>
                  <span className="text-sm font-medium text-gray-900">{c.user_name || '匿名用户'}</span>
                  <span className="text-[11px] text-gray-400">{new Date(c.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{c.content}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 造梗弹窗 */}
      {showMemeCreate && (
        <MemeModal
          targetTitle={topic.title}
          onClose={() => setShowMemeCreate(false)}
          onSuccess={async (meme: any) => {
            if (!user?.id) { navigate('/login'); return }
            await createMeme({
              type: meme.type, title: meme.title, content: meme.content,
              hashtags: meme.hashtags, topic_id: topic.id, creator_id: user.id,
            })
            setShowMemeCreate(false)
            fetchTopic(topic.id)
          }}
        />
      )}
    </div>
  )
}
