// ===== 鍐呭璇︽儏椤?鈥?瀹屾暣浜や簰鐗?=====

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getContentById, getMemeById, getComments, getUserById, toggleLikeWithPoints, toggleFavorite, promoteContent, addCommentWithPoints, toggleFollow, isFollowing, createNotification, checkInteraction, checkPromote } from '../lib/api/client'
import { checkAndUnlockAchievements } from '../lib/achievements'
import { toast } from '../lib/toast'

export default function ContentDetail({ user }: { user?: any }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const [content, setContent] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [liked, setLiked] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [promoted, setPromoted] = useState(false)
  const [promoting, setPromoting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    if (id) loadContent(id)
  }, [id])

  const loadContent = async (contentId: string) => {
    setLoading(true)
    let data = await getContentById(contentId).catch(() => null)
    let source = 'contents'
    if (!data) {
      const meme = await getMemeById(contentId).catch(() => null)
      if (meme) { data = meme; source = 'memes' }
    }
    if (data) {
      setContent({ ...data, _source: source })
    }
    // 鍔犺浇璇勮
    const targetType = source === 'memes' ? 'meme' : 'content'
    const cmts = await getComments(targetType, contentId).catch(() => [])
    const userIds = [...new Set((cmts || []).map((c: any) => c.user_id).filter(Boolean))]
    let usersMap: Record<string, any> = {}
    if (userIds.length > 0) {
      const usersArr = await Promise.all(userIds.map((uid: string) => getUserById(uid).catch(() => null)))
      const valid = usersArr.filter(Boolean)
      if (valid.length) usersMap = Object.fromEntries(valid.map((u: any) => [u.id, u]))
    }
    setComments((cmts || []).map((c: any) => ({ ...c, user_name: usersMap[c.user_id]?.name || '鍖垮悕鐢ㄦ埛', user_avatar: usersMap[c.user_id]?.avatar || '馃懁' })))
    // 鐢ㄦ埛浜掑姩鐘舵€?
    if (user?.id) {
      const [likeExists, favExists, promoteExists, followRes] = await Promise.all([
        checkInteraction(targetType, contentId, 'like').catch(() => false),
        checkInteraction(targetType, contentId, 'favorite').catch(() => false),
        checkPromote(contentId).catch(() => false),
        data?.creator_id ? isFollowing(user.id, data.creator_id) : Promise.resolve(false),
      ])
      if (likeExists) setLiked(true)
      if (favExists) setFavorited(true)
      if (promoteExists) setPromoted(true)
      setFollowing(followRes as boolean)
    }
    setLoading(false)
  }

  const handleLike = async () => {
    if (!user?.id) { toast.warning('璇峰厛鐧诲綍'); return }
    const targetType = content._source === 'memes' ? 'meme' : 'content'
    const prev = liked
    setLiked(!prev)
    try {
      await toggleLikeWithPoints(targetType, content.id)
      setContent((c: any) => ({ ...c, like_count: (c.like_count || 0) + (prev ? -1 : 1) }))
      if (!prev) toast.points(5)
      checkAndUnlockAchievements(user.id).catch(() => {})
    } catch { setLiked(prev) }
  }

  const handleFavorite = async () => {
    if (!user?.id) { toast.warning('璇峰厛鐧诲綍'); return }
    const targetType = content._source === 'memes' ? 'meme' : 'content'
    const prev = favorited
    setFavorited(!prev)
    try { await toggleFavorite(targetType, content.id) } catch { setFavorited(prev) }
  }

  const handlePromote = async () => {
    if (!user?.id) { toast.warning('璇峰厛鐧诲綍'); return }
    if (promoted || promoting) return
    setPromoting(true)
    try {
      await promoteContent(user.id, content.id)
      setPromoted(true)
      setContent((c: any) => ({ ...c, promote_count: (c.promote_count || 0) + 1 }))
      toast.success('馃敟 甯帹鎴愬姛 +20绉垎')
      checkAndUnlockAchievements(user.id).catch(() => {})
    } catch (e: any) {
      if (e.message === '宸茬粡甯帹杩囪鍐呭') { setPromoted(true) } else { toast.error(e.message || '甯帹澶辫触') }
    } finally { setPromoting(false) }
  }

  const handleComment = async () => {
    if (!newComment.trim() || !content) return
    if (!user?.id) { toast.warning('璇峰厛鐧诲綍'); return }
    setSubmitting(true)
    try {
      const targetType = content._source === 'memes' ? 'meme' : 'content'
      const inserted = await addCommentWithPoints(targetType, content.id, newComment.trim())
      const userInfo = await getUserById(user.id).catch(() => null)
      setComments([{ ...inserted, user_name: userInfo?.name || '鍖垮悕鐢ㄦ埛', user_avatar: userInfo?.avatar || '馃懁' }, ...comments])
      setNewComment('')
      setContent((c: any) => ({ ...c, comment_count: (c.comment_count || 0) + 1 }))
      toast.points(5)
      checkAndUnlockAchievements(user.id).catch(() => {})
      if (content.creator_id && content.creator_id !== user.id) {
        createNotification(content.creator_id, 'comment', '鏀跺埌璇勮', `${user.name || '鐢ㄦ埛'} 璇勮浜嗕綘鐨勫唴瀹筦, content.id).catch(() => {})
      }
    } catch (e: any) { toast.error(e.message || '璇勮澶辫触') } finally { setSubmitting(false) }
  }

  const handleFollow = async () => {
    if (!user?.id) { toast.warning('璇峰厛鐧诲綍'); return }
    const creatorId = content.creator_id
    if (!creatorId || creatorId === user.id) return
    setFollowLoading(true)
    try {
      const result = await toggleFollow(user.id, creatorId)
      setFollowing(result)
      if (result) {
        toast.success('鍏虫敞鎴愬姛')
        createNotification(creatorId, 'follow', '鏂板叧娉?, `${user.name || '鐢ㄦ埛'} 鍏虫敞浜嗕綘`, user.id).catch(() => {})
      }
    } catch (e: any) { toast.error(e.message || '鎿嶄綔澶辫触') } finally { setFollowLoading(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="text-center"><div className="text-4xl mb-3 animate-bounce">馃寠</div><p className="text-gray-400 text-sm">鍔犺浇涓?..</p></div>
    </div>
  )

  if (!content) return (
    <div className="flex flex-col items-center justify-center h-screen bg-white">
      <div className="text-4xl mb-3">馃樀</div>
      <p className="text-gray-500 mb-4">鍐呭涓嶅瓨鍦?/p>
      <button onClick={() => navigate(-1)} className="px-6 py-2 bg-black text-white rounded-full text-sm">杩斿洖</button>
    </div>
  )

  const isMeme = content._source === 'memes'
  const title = isMeme ? (content.title || content.content?.substring(0, 30)) : content.title
  const description = isMeme ? content.content : (content.description || '')
  const tags = isMeme ? (content.hashtags || []) : (content.tags || [])
  const creatorName = isMeme ? content.creator_name : content.creator_name
  const creatorAvatar = isMeme ? content.creator_avatar : content.creator_avatar

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* 椤堕儴灏侀潰 */}
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-700 px-5 pt-14 pb-6">
        <button onClick={() => navigate(-1)} className="absolute top-12 left-4 text-white/80 text-lg">鈫?杩斿洖</button>
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 bg-white/20 text-white text-xs rounded-full">{isMeme ? '馃幁 娈靛瓙' : `馃搸 ${content.type}`}</span>
            {tags.slice(0, 3).map((tag: string) => <span key={tag} className="px-2 py-0.5 bg-white/10 text-white/70 text-[11px] rounded-full">#{tag}</span>)}
          </div>
          <h1 className="text-white text-xl font-bold mb-2">{title}</h1>
          {description && <p className="text-white/70 text-sm leading-relaxed">{description}</p>}
        </div>
      </div>

      {/* 浜掑姩鏍?*/}
      <div className="bg-white px-5 py-3 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-5">
          <button onClick={handleLike} className="flex items-center gap-1.5">
            <span className="text-xl">{liked ? '鉂わ笍' : '馃'}</span>
            <span className="text-sm text-gray-600">{content.like_count || 0}</span>
          </button>
          <button className="flex items-center gap-1.5">
            <span className="text-xl">馃挰</span>
            <span className="text-sm text-gray-600">{comments.length}</span>
          </button>
          <button className="flex items-center gap-1.5">
            <span className="text-xl">鈫楋笍</span>
            <span className="text-sm text-gray-600">{content.share_count || 0}</span>
          </button>
          <button className="flex items-center gap-1.5">
            <span className="text-xl">馃敟</span>
            <span className="text-sm text-gray-600">{content.view_count || 0} 娴忚</span>
          </button>
        </div>
        <button onClick={handleFavorite} className="text-xl">{favorited ? '猸? : '鈽?}</button>
      </div>

      {/* 鍒涗綔鑰呬俊鎭?*/}
      <div className="bg-white px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div onClick={() => content.creator_id && navigate(`/profile/${content.creator_id}`)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg cursor-pointer">{creatorAvatar || '馃懁'}</div>
          <div className="flex-1">
            <div onClick={() => content.creator_id && navigate(`/profile/${content.creator_id}`)} className="text-sm font-bold text-gray-900 cursor-pointer hover:underline">{creatorName || '鍖垮悕鐢ㄦ埛'}</div>
            <div className="text-xs text-gray-400">{isMeme ? `${content.view_count || 0} 娴忚` : `${content.type} 路 ${content.view_count || 0} 娴忚`}</div>
          </div>
          <button onClick={handleFollow} disabled={followLoading} className={`px-4 py-1.5 text-xs rounded-full transition-all ${following ? 'bg-gray-200 text-gray-600' : 'bg-black text-white'}`}>
            {followLoading ? '...' : following ? '宸插叧娉? : '鍏虫敞'}
          </button>
        </div>
      </div>

      {/* 涓炬姤 */}
      <div className="mx-5 mt-2 flex justify-end">
        <button onClick={() => {
          if (!user?.id) { toast.warning('璇峰厛鐧诲綍'); return }
          toast.info('涓炬姤宸叉彁浜わ紝鎴戜滑浼氬敖蹇鐞?)
        }} className="text-xs text-gray-400 underline">涓炬姤鍐呭</button>
      </div>

      {/* 甯帹鎸夐挳 */}
      {!promoted && (
        <div className="mx-5 mt-4">
          <button onClick={handlePromote} disabled={promoting} className="w-full py-3 bg-orange-500 text-white rounded-2xl font-bold text-sm active:scale-[0.98] transition-transform">
            {promoting ? '甯帹涓?..' : '馃敟 甯帹杩欐潯鍐呭 (+20绉垎)'}
          </button>
        </div>
      )}
      {promoted && (
        <div className="mx-5 mt-4">
          <div className="w-full py-3 bg-green-50 text-green-600 rounded-2xl font-bold text-sm text-center">鉁?宸插府鎺?/div>
        </div>
      )}

      {/* 璇勮鍖?*/}
      <div className="mx-5 mt-4 bg-white rounded-2xl p-5 border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-3">馃挰 璇勮 ({comments.length})</h3>
        {comments.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">杩樻病鏈夎瘎璁猴紝鏉ヨ涓ゅ彞鍚?馃挰</div>
        ) : (
          <div className="space-y-3">
            {comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm shrink-0">{c.user_avatar || '馃懁'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{c.user_name}</span>
                    <span className="text-[10px] text-gray-400">{new Date(c.created_at).toLocaleDateString('zh-CN')}</span>
                  </div>
                  <p className="text-sm text-gray-700">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* 璇勮杈撳叆 */}
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment() } }}
            placeholder="璇磋浣犵殑鐪嬫硶..."
            className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          <button onClick={handleComment} disabled={!newComment.trim() || submitting} className={`px-4 py-2.5 rounded-xl text-sm font-medium ${newComment.trim() ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'}`}>
            {submitting ? '...' : '鍙戦€?}
          </button>
        </div>
      </div>
    </div>
  )
}

