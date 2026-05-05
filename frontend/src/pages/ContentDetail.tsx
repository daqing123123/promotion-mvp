// ===== 内容详情页 — 完整交互版 =====

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getContentById, getMemeById, getComments, getUserById, toggleLikeWithPoints, toggleFavorite, promoteContent, addCommentWithPoints, toggleFollow, isFollowing, createNotification, checkInteraction, checkPromote, deleteContent, deleteMeme, submitReport, boostContent, pinContent } from '../lib/api/client'
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
    // 加载评论
    const targetType = source === 'memes' ? 'meme' : 'content'
    const cmts = await getComments(targetType, contentId).catch(() => [])
    const userIds = [...new Set((cmts || []).map((c: any) => c.user_id).filter(Boolean))]
    let usersMap: Record<string, any> = {}
    if (userIds.length > 0) {
      const usersArr = await Promise.all(userIds.map((uid: string) => getUserById(uid).catch(() => null)))
      const valid = usersArr.filter(Boolean)
      if (valid.length) usersMap = Object.fromEntries(valid.map((u: any) => [u.id, u]))
    }
    setComments((cmts || []).map((c: any) => ({ ...c, user_name: usersMap[c.user_id]?.name || '匿名用户', user_avatar: usersMap[c.user_id]?.avatar || '👤' })))
    // 用户互动状态
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
    if (!user?.id) { toast.warning('请先登录'); return }
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
    if (!user?.id) { toast.warning('请先登录'); return }
    const targetType = content._source === 'memes' ? 'meme' : 'content'
    const prev = favorited
    setFavorited(!prev)
    try { await toggleFavorite(targetType, content.id) } catch { setFavorited(prev) }
  }

  const handlePromote = async () => {
    if (!user?.id) { toast.warning('请先登录'); return }
    if (promoted || promoting) return
    setPromoting(true)
    try {
      await promoteContent(user.id, content.id)
      setPromoted(true)
      setContent((c: any) => ({ ...c, promote_count: (c.promote_count || 0) + 1 }))
      toast.success('🔥 帮推成功 +20积分')
      checkAndUnlockAchievements(user.id).catch(() => {})
    } catch (e: any) {
      if (e.message === '已经帮推过该内容') { setPromoted(true) } else { toast.error(e.message || '帮推失败') }
    } finally { setPromoting(false) }
  }

  const handleComment = async () => {
    if (!newComment.trim() || !content) return
    if (!user?.id) { toast.warning('请先登录'); return }
    setSubmitting(true)
    try {
      const targetType = content._source === 'memes' ? 'meme' : 'content'
      const inserted = await addCommentWithPoints(targetType, content.id, newComment.trim())
      const userInfo = await getUserById(user.id).catch(() => null)
      setComments([{ ...inserted, user_name: userInfo?.name || '匿名用户', user_avatar: userInfo?.avatar || '👤' }, ...comments])
      setNewComment('')
      setContent((c: any) => ({ ...c, comment_count: (c.comment_count || 0) + 1 }))
      toast.points(5)
      checkAndUnlockAchievements(user.id).catch(() => {})
      if (content.creator_id && content.creator_id !== user.id) {
        createNotification(content.creator_id, 'comment', '收到评论', `${user.name || '用户'} 评论了你的内容`, content.id).catch(() => {})
      }
    } catch (e: any) { toast.error(e.message || '评论失败') } finally { setSubmitting(false) }
  }

  const handleFollow = async () => {
    if (!user?.id) { toast.warning('请先登录'); return }
    const creatorId = content.creator_id
    if (!creatorId || creatorId === user.id) return
    setFollowLoading(true)
    try {
      const result = await toggleFollow(user.id, creatorId)
      setFollowing(result)
      if (result) {
        toast.success('关注成功')
        createNotification(creatorId, 'follow', '新关注', `${user.name || '用户'} 关注了你`, user.id).catch(() => {})
      }
    } catch (e: any) { toast.error(e.message || '操作失败') } finally { setFollowLoading(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="text-center"><div className="text-4xl mb-3 animate-bounce">🌊</div><p className="text-gray-400 text-sm">加载中...</p></div>
    </div>
  )

  if (!content) return (
    <div className="flex flex-col items-center justify-center h-screen bg-white">
      <div className="text-4xl mb-3">😵</div>
      <p className="text-gray-500 mb-4">内容不存在</p>
      <button onClick={() => navigate(-1)} className="px-6 py-2 bg-black text-white rounded-full text-sm">返回</button>
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
      {/* 顶部封面 */}
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-700 px-5 pt-14 pb-6">
        <button onClick={() => navigate(-1)} className="absolute top-12 left-4 text-white/80 text-lg">← 返回</button>
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 bg-white/20 text-white text-xs rounded-full">{isMeme ? '🎭 段子' : `📎 ${content.type}`}</span>
            {tags.slice(0, 3).map((tag: string) => <span key={tag} className="px-2 py-0.5 bg-white/10 text-white/70 text-[11px] rounded-full">#{tag}</span>)}
          </div>
          <h1 className="text-white text-xl font-bold mb-2">{title}</h1>
          {description && <p className="text-white/70 text-sm leading-relaxed">{description}</p>}
        </div>
      </div>

      {/* 互动栏 */}
      <div className="bg-white px-5 py-3 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-5">
          <button onClick={handleLike} className="flex items-center gap-1.5">
            <span className="text-xl">{liked ? '❤️' : '🤍'}</span>
            <span className="text-sm text-gray-600">{content.like_count || 0}</span>
          </button>
          <button className="flex items-center gap-1.5">
            <span className="text-xl">💬</span>
            <span className="text-sm text-gray-600">{comments.length}</span>
          </button>
          <button className="flex items-center gap-1.5">
            <span className="text-xl">↗️</span>
            <span className="text-sm text-gray-600">{content.share_count || 0}</span>
          </button>
          <button className="flex items-center gap-1.5">
            <span className="text-xl">🔥</span>
            <span className="text-sm text-gray-600">{content.view_count || 0} 浏览</span>
          </button>
        </div>
        <button onClick={handleFavorite} className="text-xl">{favorited ? '⭐' : '☆'}</button>
      </div>

      {/* 创作者信息 */}
      <div className="bg-white px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div onClick={() => content.creator_id && navigate(`/profile/${content.creator_id}`)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg cursor-pointer">{creatorAvatar || '👤'}</div>
          <div className="flex-1">
            <div onClick={() => content.creator_id && navigate(`/profile/${content.creator_id}`)} className="text-sm font-bold text-gray-900 cursor-pointer hover:underline">{creatorName || '匿名用户'}</div>
            <div className="text-xs text-gray-400">{isMeme ? `${content.view_count || 0} 浏览` : `${content.type} · ${content.view_count || 0} 浏览`}</div>
          </div>
          <button onClick={handleFollow} disabled={followLoading} className={`px-4 py-1.5 text-xs rounded-full transition-all ${following ? 'bg-gray-200 text-gray-600' : 'bg-black text-white'}`}>
            {followLoading ? '...' : following ? '已关注' : '关注'}
          </button>
        </div>
      </div>

      {/* 举报 & 删除 */}
      <div className="mx-5 mt-2 flex justify-end gap-4">
        {user?.id && content.creator_id === user.id && (
          <button onClick={async () => {
            if (!confirm('确定要删除吗？删了就没了。')) return
            try {
              if (isMeme) await deleteMeme(content.id)
              else await deleteContent(content.id)
              toast.success('已删除')
              navigate(-1)
            } catch (e: any) { toast.error(e.message || '删除失败') }
          }} className="text-xs text-red-400 underline">删除</button>
        )}
        <button onClick={async () => {
          if (!user?.id) { toast.warning('请先登录'); return }
          const reason = prompt('请说明举报原因（色情、暴力、诈骗、侵权、其他）：')
          if (!reason) return
          try {
            await submitReport(isMeme ? 'meme' : 'content', content.id, reason)
            toast.success('举报已提交，我们会尽快处理')
          } catch (e: any) { toast.error(e.message || '举报失败') }
        }} className="text-xs text-gray-400 underline">举报内容</button>
      </div>

      {/* 内容所有者操作：曝光加速 + 置顶 */}
      {user?.id && (content.creator_id === user.id || content.created_by === user.id) && (
        <div className="mx-5 mt-3 flex gap-2">
          <button onClick={async () => {
            try {
              await boostContent(content.id)
              toast.success('曝光加速成功！24小时内优先展示')
            } catch (e: any) { toast.error(e.message || '加速失败') }
          }} className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-xs font-bold">
            🚀 曝光加速 (-50分)
          </button>
          <button onClick={async () => {
            try {
              await pinContent(content.id)
              toast.success('置顶成功！24小时内优先展示')
            } catch (e: any) { toast.error(e.message || '置顶失败') }
          }} className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-bold">
            📌 置顶 (-150分)
          </button>
        </div>
      )}

      {/* 帮推按钮 */}
      {!promoted && (
        <div className="mx-5 mt-4">
          <button onClick={handlePromote} disabled={promoting} className="w-full py-3 bg-orange-500 text-white rounded-2xl font-bold text-sm active:scale-[0.98] transition-transform">
            {promoting ? '帮推中...' : '🔥 帮推这条内容 (+20积分)'}
          </button>
        </div>
      )}
      {promoted && (
        <div className="mx-5 mt-4">
          <div className="w-full py-3 bg-green-50 text-green-600 rounded-2xl font-bold text-sm text-center">✅ 已帮推</div>
        </div>
      )}

      {/* 评论区 */}
      <div className="mx-5 mt-4 bg-white rounded-2xl p-5 border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-3">💬 评论 ({comments.length})</h3>
        {comments.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">还没有评论，来说两句吧 💬</div>
        ) : (
          <div className="space-y-3">
            {comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm shrink-0">{c.user_avatar || '👤'}</div>
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
        {/* 评论输入 */}
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment() } }}
            placeholder="说说你的看法..."
            className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          <button onClick={handleComment} disabled={!newComment.trim() || submitting} className={`px-4 py-2.5 rounded-xl text-sm font-medium ${newComment.trim() ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'}`}>
            {submitting ? '...' : '发送'}
          </button>
        </div>
      </div>
    </div>
  )
}
