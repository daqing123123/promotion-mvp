// @ts-nocheck
// ===== 璇濋璇︽儏椤?鈥?鍝佺墝鎺ㄥ箍瀹屾暣鐗?=====

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getTopicById, getMemesByTopic, getComments, checkInteraction, toggleLikeWithPoints, addCommentWithPoints, getUserById, getTopicPromotes, acceptTopicPromote, updateTopic, updateTopicPromote, claimTopicCoupon, createMeme } from '../lib/api/client'
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
        // 骞惰鍔犺浇
        const [memesData, commentsData, likeStatus] = await Promise.all([
          getMemesByTopic(topicId),
          getComments('topic', topicId),
          checkInteraction('topic', topicId, 'like').catch(() => null),
        ])

        setMemes(memesData || [])
        setLikeCount(Array.isArray(likeStatus) ? likeStatus.length : (likeStatus ? 1 : 0))

        // 璇勮 + 鐢ㄦ埛淇℃伅
        const cmts = commentsData || []
        const userIds = [...new Set(cmts.map((c: any) => c.user_id).filter(Boolean))]
        let usersMap: Record<string, any> = {}
        // 閫愪釜鑾峰彇鐢ㄦ埛淇℃伅锛圓PI 涓嶆敮鎸佹壒閲忥級
        await Promise.all(
          userIds.map(async (uid: string) => {
            try {
              const u = await getUserById(uid)
              if (u) usersMap[uid] = u
            } catch {}
          })
        )
        setComments(cmts.map((c: any) => ({
          ...c,
          user_name: usersMap[c.user_id]?.name || '鍖垮悕鐢ㄦ埛',
          user_avatar: usersMap[c.user_id]?.avatar || '馃懁',
        })))

        // 褰撳墠鐢ㄦ埛鐘舵€?        if (user?.id) {
          const [promotes, likedRes] = await Promise.all([
            getTopicPromotes(topicId).catch(() => []),
            checkInteraction('user', user.id, 'like').catch(() => null),
          ])

          // 鎵惧埌褰撳墠鐢ㄦ埛鐨勬帹骞胯褰?          const myPromoteRecord = (promotes || []).find((p: any) => p.user_id === user.id)
          if (myPromoteRecord) {
            setPromoted(true)
            setMyPromote(myPromoteRecord)
          }
          if (likedRes) setLiked(true)
          setPromoteProgress({ accepted: (promotes || []).length, target: t.promote_target || 100 })
        } else {
          const promotes = await getTopicPromotes(topicId).catch(() => [])
          setPromoteProgress({ accepted: (promotes || []).length, target: t.promote_target || 100 })
        }
      }
    } catch {}
    setLoading(false)
  }

  const formatNum = (n: number) => n >= 10000 ? (n / 10000).toFixed(1) + '涓? : n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)

  const getDaysLeft = (endDate: string) => {
    if (!endDate) return '鏃犻檺鏈?
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000)
    return days > 0 ? `${days} 澶ー : '宸茬粨鏉?
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
      const userInfo = await getUserById(user.id).catch(() => null)
      setComments([{
        ...inserted,
        user_name: userInfo?.name || user.name || '鍖垮悕鐢ㄦ埛',
        user_avatar: userInfo?.avatar || user.avatar || '馃懁',
      }, ...comments])
      setNewComment('')
      checkAndUnlockAchievements(user.id).catch(() => {})
    } catch (e: any) {
      toast.error(e.message || '璇勮澶辫触')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAcceptPromote = async () => {
    if (!user?.id) return navigate('/login')
    if (promoted || accepting) return

    // 濡傛灉鏄疄鐗╁鍔憋紝鍏堝脊鍦板潃琛ㄥ崟
    const isPhysical = topic.reward_type === 'physical' || topic.reward_type === 'both'
    if (isPhysical && !showAddressForm) {
      setShowAddressForm(true)
      return
    }

    setAccepting(true)
    try {
      const insertData: any = {
        status: 'accepted',
        points_earned: topic.promote_reward || 20,
      }
      // 濡傛灉鏈夊湴鍧€淇℃伅
      if (address.name && address.phone && address.address) {
        insertData.receiver_name = address.name
        insertData.receiver_phone = address.phone
        insertData.receiver_address = address.address
        insertData.status = 'address_submitted'
      }

      const data = await acceptTopicPromote(topic.id, insertData)

      // 鏇存柊璇濋甯帹鏁?      await updateTopic(topic.id, { promote_count: (topic.promote_count || 0) + 1 }).catch(() => {})

      // 濡傛灉鏄紭鎯犲埜濂栧姳锛岃嚜鍔ㄥ彂鍒?      const isCoupon = topic.reward_type === 'coupon' || topic.coupon_type
      if (isCoupon && topic.coupon_type) {
        try {
          await claimTopicCoupon(topic.id)
          await updateTopic(topic.id, { coupon_claimed: (topic.coupon_claimed || 0) + 1 }).catch(() => {})
        } catch {}
      }

      setPromoted(true)
      setMyPromote(data)
      setPromoteProgress(p => ({ ...p, accepted: p.accepted + 1 }))
      setShowAddressForm(false)
      checkAndUnlockAchievements(user.id).catch(() => {})
      if (isCoupon) {
        toast.success(`馃帿 浼樻儬鍒稿凡棰嗗彇锛?{topic.coupon_value || ''}`)
      } else if (isPhysical) {
        toast.success('宸叉彁浜わ紒绛夊緟鍟嗗鍙戣揣')
      } else {
        toast.success(`鎺ュ彈鎺ㄥ箍鎴愬姛锛?${topic.promote_reward || 20}绉垎`)
      }
    } catch (e: any) {
      toast.error(e.message || '鎺ュ彈鎺ㄥ箍澶辫触')
    } finally {
      setAccepting(false)
    }
  }

  const handleSubmitAddress = async () => {
    if (!address.name || !address.phone || !address.address) {
      toast.warning('璇峰～鍐欏畬鏁存敹璐т俊鎭?)
      return
    }
    setSubmittingAddress(true)
    try {
      if (myPromote?.id) {
        // 宸叉帴鍙楁帹骞匡紝鏇存柊鍦板潃
        await updateTopicPromote(myPromote.id, {
          receiver_name: address.name,
          receiver_phone: address.phone,
          receiver_address: address.address,
          status: 'address_submitted',
        })
        setMyPromote({ ...myPromote, ...address, status: 'address_submitted' })
        toast.success('鍦板潃宸叉彁浜わ紒')
      } else {
        // 鐩存帴鎺ュ彈鎺ㄥ箍 + 鎻愪氦鍦板潃
        await handleAcceptPromote()
      }
      setShowAddressForm(false)
    } catch (e: any) {
      toast.error(e.message || '鎻愪氦澶辫触')
    } finally {
      setSubmittingAddress(false)
    }
  }

  const handleShare = () => {
    const url = window.location.origin + '/topic/' + topic.id
    const text = `${topic.brand_name ? '銆? + topic.brand_name + '銆? : ''}${topic.title} 鈥?鏉ュ法娴弬涓庢帹骞匡紝璧氱Н鍒嗭紒`
    if (navigator.share) {
      navigator.share({ title: topic.title, text, url })
    } else {
      navigator.clipboard.writeText(text + ' ' + url)
      toast.success('鎺ㄥ箍閾炬帴宸插鍒讹紝蹇幓鍒嗕韩鍚э紒')
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">鍔犺浇涓?..</div>
  if (!topic) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">璇濋涓嶅瓨鍦?/div>

  const isBrand = topic.creator_type === 'brand' || !!topic.brand_name
  const isPhysical = topic.reward_type === 'physical' || topic.reward_type === 'both'
  const isPoints = topic.reward_type === 'points' || topic.reward_type === 'both' || !topic.reward_type
  const isCoupon = topic.reward_type === 'coupon' || topic.coupon_type
  const isCash = topic.reward_type === 'cash'
  const progressPercent = promoteProgress.target > 0 ? Math.min(100, Math.round(promoteProgress.accepted / promoteProgress.target * 100)) : 0

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* 鍝佺墝澶撮儴 */}
      {isBrand && topic.brand_logo ? (
        <div className="relative">
          <div className="h-32 bg-gradient-to-br from-gray-800 to-gray-600" />
          <div className="absolute inset-0 flex items-center justify-center">
            <img src={topic.brand_logo} alt={topic.brand_name} className="h-20 w-20 rounded-2xl object-cover border-2 border-white shadow-lg" />
          </div>
        </div>
      ) : null}

      {/* 璇濋淇℃伅 */}
      <div className={`bg-white px-5 pb-5 ${isBrand && topic.brand_logo ? 'pt-14' : 'pt-12'}`}>
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => navigate(-1)} className="text-gray-400">鈫?/button>
          {isBrand && <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-blue-50 text-blue-600">馃彿锔?鍝佺墝鎺ㄥ箍</span>}
          <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-gray-100 text-gray-600">{topic.type}</span>
          <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-green-50 text-green-600">{topic.status === 'active' ? '杩涜涓? : '宸茬粨鏉?}</span>
        </div>

        {topic.brand_name && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-blue-600">{topic.brand_name}</span>
            {topic.brand_description && <span className="text-xs text-gray-400">路 {topic.brand_description}</span>}
          </div>
        )}

        <h1 className="text-xl font-bold text-gray-900 mb-2">{topic.title}</h1>
        <p className="text-sm text-gray-500 mb-4">{topic.description}</p>

        {/* 鍙戣捣鑰?*/}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">{topic.creator_avatar}</div>
          <div className="flex-1">
            <div className="text-sm font-bold text-gray-900">{topic.creator_name}</div>
            <div className="text-xs text-gray-400">{isBrand ? '鍝佺墝鏂瑰彂璧? : '涓汉鍙戣捣'}</div>
          </div>
        </div>

        {/* 缁熻 */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl p-3 text-center"><div className="text-lg font-bold text-gray-900">{topic.meme_count}</div><div className="text-[10px] text-gray-400">姊?/div></div>
          <div className="bg-gray-50 rounded-xl p-3 text-center"><div className="text-lg font-bold text-gray-900">{formatNum(topic.total_views)}</div><div className="text-[10px] text-gray-400">鏇濆厜</div></div>
          <div className="bg-gray-50 rounded-xl p-3 text-center"><div className="text-lg font-bold text-gray-900">{topic.participant_count}</div><div className="text-[10px] text-gray-400">鍙備笌</div></div>
          <div className="bg-gray-50 rounded-xl p-3 text-center"><div className="text-lg font-bold text-orange-500">{topic.hot_score}</div><div className="text-[10px] text-gray-400">鐑害</div></div>
        </div>

        {/* 鐐硅禐 + 缁熻鏍?*/}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-5">
            <button onClick={handleLike} className="flex items-center gap-1.5">
              <span className="text-xl">{liked ? '鉂わ笍' : '馃'}</span>
              <span className="text-sm text-gray-600">{likeCount}</span>
            </button>
            <button className="flex items-center gap-1.5">
              <span className="text-xl">馃挰</span>
              <span className="text-sm text-gray-600">{comments.length}</span>
            </button>
            <button onClick={handleShare} className="flex items-center gap-1.5">
              <span className="text-xl">鈫楋笍</span>
              <span className="text-sm text-gray-600">鍒嗕韩</span>
            </button>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {topic.reward_pool > 0 && <span>馃挵 {topic.reward_pool}绉垎</span>}
            <span>鈴?{getDaysLeft(topic.end_date)}</span>
          </div>
        </div>
      </div>

      {/* 濂栧姳淇℃伅鍗＄墖 */}
      {isBrand && (
        <div className="mx-5 mt-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">馃巵</span>
            <h3 className="text-sm font-bold text-gray-900">濂栧姳鍐呭</h3>
          </div>
          <div className="space-y-1.5">
            {isPoints && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span>馃挵</span>
                <span>姣忔甯帹 +{topic.promote_reward || 20} 绉垎</span>
              </div>
            )}
            {isCash && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span>馃挼</span>
                <span>{topic.reward_description || '鐜伴噾濂栧姳锛堣瑙佽瘽棰樿鏄庯級'}</span>
              </div>
            )}
            {isCoupon && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span>馃帿</span>
                <span>{topic.coupon_value || '浼樻儬鍒?} 路 闄恵topic.coupon_count || 0}寮?{topic.coupon_claimed >= topic.coupon_count ? '(宸查瀹?' : `(${topic.coupon_claimed || 0}浜哄凡棰?`}</span>
              </div>
            )}
            {isPhysical && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span>馃摝</span>
                <span>{topic.reward_description || '瀹炵墿濂栧姳锛堣瑙佽瘽棰樿鏄庯級'}</span>
              </div>
            )}
            {!isPoints && !isPhysical && !isCoupon && !isCash && (
              <div className="text-sm text-gray-500">鏆傛棤濂栧姳璇存槑</div>
            )}
          </div>
        </div>
      )}

      {/* 鎺ㄥ箍浠诲姟鍗＄墖 */}
      {isBrand && (
        <div className="mx-5 mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-gray-900">馃摙 鎺ㄥ箍浠诲姟</h3>
            <span className="text-sm text-blue-600 font-medium">
              {isPoints && `+${topic.promote_reward || 20}绉垎/娆}
              {isPhysical && !isPoints && '馃巵 瀹炵墿濂栧姳'}
            </span>
          </div>

          {/* 杩涘害鏉?*/}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>鎺ㄥ箍杩涘害</span>
              <span>{promoteProgress.accepted}/{promoteProgress.target}</span>
            </div>
            <div className="h-2 bg-white rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          {/* 鎺ㄥ箍鐘舵€?*/}
          {promoted && myPromote && (
            <div className="mb-3 p-3 bg-white rounded-xl">
              <div className="flex items-center gap-2 text-sm">
                {myPromote.status === 'accepted' && <><span className="text-green-500">鉁?/span><span className="text-gray-700">宸叉帴鍙楁帹骞?/span></>}
                {myPromote.status === 'address_submitted' && <><span className="text-blue-500">馃摤</span><span className="text-gray-700">鍦板潃宸叉彁浜わ紝绛夊緟鍙戣揣</span></>}
                {myPromote.status === 'shipped' && <><span className="text-purple-500">馃殮</span><span className="text-gray-700">宸插彂璐э紝璇锋敞鎰忔煡鏀?/span></>}
                {myPromote.status === 'received' && <><span className="text-green-500">馃帀</span><span className="text-gray-700">宸叉敹璐?/span></>}
                {myPromote.status === 'completed' && <><span className="text-green-500">鉁?/span><span className="text-gray-700">宸插畬鎴?/span></>}
              </div>
              {/* 琛ュ～鍦板潃鎸夐挳 */}
              {isPhysical && myPromote.status === 'accepted' && (
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="mt-2 text-xs text-blue-600 underline"
                >
                  馃摑 琛ュ～鏀惰揣鍦板潃
                </button>
              )}
            </div>
          )}

          {/* 鎺ㄥ箍璇存槑 */}
          <div className="text-xs text-gray-500 mb-4 space-y-1">
            {isPoints && <p>鈥?鎺ュ彈浠诲姟鍚庯紝鍒嗕韩璇濋閾炬帴缁欏ソ鍙?/p>}
            {isPoints && <p>鈥?濂藉弸閫氳繃浣犵殑閾炬帴璁块棶锛屼綘鑾峰緱绉垎濂栧姳</p>}
            {isPhysical && <p>鈥?鎺ュ彈浠诲姟鍚庡～鍐欐敹璐у湴鍧€</p>}
            {isPhysical && <p>鈥?鍟嗗瀹℃牳鍚庡彂璐э紝鏀跺埌鍚庤鎻愪氦鍙嶉</p>}
            <p>鈥?鍒嗕韩瓒婂锛岃禋寰楄秺澶氾紝杩樿兘瑙ｉ攣甯帹鎴愬氨</p>
          </div>

          {/* 鍦板潃琛ㄥ崟 */}
          {showAddressForm && (
            <div className="mb-4 p-4 bg-white rounded-xl border border-gray-200 space-y-3">
              <h4 className="text-sm font-bold text-gray-900">馃摤 鏀惰揣鍦板潃</h4>
              <input
                type="text"
                value={address.name}
                onChange={e => setAddress(a => ({ ...a, name: e.target.value }))}
                placeholder="鏀朵欢浜哄鍚?
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <input
                type="tel"
                value={address.phone}
                onChange={e => setAddress(a => ({ ...a, phone: e.target.value }))}
                placeholder="鎵嬫満鍙?
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <textarea
                value={address.address}
                onChange={e => setAddress(a => ({ ...a, address: e.target.value }))}
                placeholder="璇︾粏鏀惰揣鍦板潃锛堢渷甯傚尯 + 琛楅亾闂ㄧ墝鍙凤級"
                rows={3}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowAddressForm(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">
                  鍙栨秷
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
                  {submittingAddress ? '鎻愪氦涓?..' : '纭鎻愪氦'}
                </button>
              </div>
            </div>
          )}

          {/* 鎿嶄綔鎸夐挳 */}
          <div className="flex gap-3">
            {promoted ? (
              <>
                <button onClick={handleShare} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm active:scale-[0.98] transition-transform">
                  馃摛 鍒嗕韩璧氱Н鍒?                </button>
                {isPhysical && myPromote?.status === 'accepted' && !myPromote?.receiver_name && (
                  <button onClick={() => setShowAddressForm(true)} className="px-4 py-3 bg-amber-500 text-white rounded-xl font-bold text-sm active:scale-[0.98] transition-transform">
                    馃摤 濉湴鍧€
                  </button>
                )}
                <button className="px-4 py-3 bg-white text-green-600 rounded-xl font-bold text-sm border border-green-200">
                  鉁?宸叉帴鍙?                </button>
              </>
            ) : (
              <button
                onClick={handleAcceptPromote}
                disabled={accepting}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm active:scale-[0.98] transition-transform"
              >
                {accepting ? '鎺ュ彈涓?..' : isCoupon ? `馃帿 棰嗗彇浼樻儬鍒?(+${topic.promote_reward || 20}绉垎)` : isPhysical ? `馃幆 鎺ュ彈浠诲姟 + 濉湴鍧€ (+${topic.promote_reward || 20}绉垎)` : `馃幆 鎺ュ彈鎺ㄥ箍浠诲姟 (+${topic.promote_reward || 20}绉垎)`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 閫犳鎸夐挳 */}
      <div className="px-5 py-4">
        <button onClick={() => setShowMemeCreate(true)} className="w-full py-3 bg-black text-white rounded-2xl font-bold text-base active:scale-[0.98] transition-transform">
          馃敟 鎴戣閫犳
        </button>
      </div>

      {/* 鐑棬姊?*/}
      <div className="px-5">
        <h2 className="text-lg font-bold text-gray-900 mb-3">馃敟 鐑棬姊?({memes.length})</h2>
        {memes.length === 0 ? (
          <div className="text-center py-8 text-gray-400">杩樻病鏈夋锛屽揩鏉ョ涓€涓€犳锛?/div>
        ) : (
          <div className="space-y-3">
            {memes.map((meme, i) => (
              <div key={meme.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{i === 0 ? '馃' : i === 1 ? '馃' : i === 2 ? '馃' : `#${i+1}`}</span>
                  <span className={`px-2 py-0.5 text-[10px] rounded-full ${meme.status === 'viral' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                    {meme.status === 'viral' ? '馃敟 鐖嗘' : '宸插彂甯?}
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
                  <span>馃憗 {formatNum(meme.view_count)}</span>
                  <span>鉂わ笍 {formatNum(meme.like_count)}</span>
                  <span>馃攧 {formatNum(meme.share_count)}</span>
                  <span>馃敟 {meme.hot_score}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 璇勮鍖?*/}
      <div className="px-5 mt-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">馃挰 璇勮 ({comments.length})</h2>

        {/* 鍙戣〃璇勮 */}
        <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="璇磋浣犲杩欎釜璇濋鐨勭湅娉?.."
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
              {submitting ? '鍙戦€佷腑...' : '鍙戣〃 (+5绉垎)'}
            </button>
          </div>
        </div>

        {/* 璇勮鍒楄〃 */}
        <div className="space-y-3">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">杩樻病鏈夎瘎璁猴紝鏉ヨ涓ゅ彞鍚?馃挰</div>
          ) : (
            comments.map(c => (
              <div key={c.id} className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">{c.user_avatar || '馃懁'}</div>
                  <span className="text-sm font-medium text-gray-900">{c.user_name || '鍖垮悕鐢ㄦ埛'}</span>
                  <span className="text-[11px] text-gray-400">{new Date(c.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{c.content}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 閫犳寮圭獥 */}
      {showMemeCreate && (
        <MemeModal
          targetTitle={topic.title}
          onClose={() => setShowMemeCreate(false)}
          onSuccess={async (meme) => {
            if (!user?.id) { navigate('/login'); return }
            await createMeme({
              type: meme.type,
              title: meme.title,
              content: meme.content,
              hashtags: meme.hashtags,
              topic_id: topic.id,
            })
            setShowMemeCreate(false)
            fetchTopic(topic.id)
          }}
        />
      )}
    </div>
  )
}
