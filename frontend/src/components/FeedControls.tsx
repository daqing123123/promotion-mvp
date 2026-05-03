// ===== Feed 右侧按钮 — 真实数据交互 =====

import { useState, useEffect } from 'react'
import { type Content } from '../lib/contentData'
import { formatStat } from '../lib/memeSystem'
import { supabase, toggleLikeWithPoints, toggleFavorite, promoteContent } from '../lib/supabase/client'
import { checkAndUnlockAchievements } from '../lib/achievements'
import CommentSheet from './CommentSheet'

export default function FeedControls({ content, user, onMeme, onModalToggle }: { content: Content; user: any; onMeme?: () => void; onModalToggle?: (open: boolean) => void }) {
  const [liked, setLiked] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [likeCount, setLikeCount] = useState(content.stats.likes)
  const [commentCount, setCommentCount] = useState(content.stats.comments)
  const [favCount, setFavCount] = useState(content.stats.favorites)
  const [promoting, setPromoting] = useState(false)
  const [promoted, setPromoted] = useState(false)
  const [toast, setToast] = useState('')

  const targetType = content.type === 'content' ? 'content' : 'meme'

  // 弹窗状态同步到 FeedContainer
  useEffect(() => {
    onModalToggle?.(showComments)
  }, [showComments])

  // 检查当前用户是否已点赞/收藏/帮推
  useEffect(() => {
    if (!user?.id) return
    const checkInteractions = async () => {
      const [likeRes, favRes, promoteRes] = await Promise.all([
        supabase.from('interactions').select('id').eq('user_id', user.id).eq('target_type', targetType).eq('target_id', content.id).eq('action', 'like').maybeSingle(),
        supabase.from('interactions').select('id').eq('user_id', user.id).eq('target_type', targetType).eq('target_id', content.id).eq('action', 'favorite').maybeSingle(),
        supabase.from('promotes').select('id').eq('user_id', user.id).eq('content_id', content.id).maybeSingle(),
      ])
      if (likeRes.data) setLiked(true)
      if (favRes.data) setFavorited(true)
      if (promoteRes.data) setPromoted(true)
    }
    checkInteractions()
  }, [user?.id, content.id, targetType])

  // 同步外部数据变化
  useEffect(() => {
    setLikeCount(content.stats.likes)
    setFavCount(content.stats.favorites)
    setCommentCount(content.stats.comments)
  }, [content.id])

  // Toast 自动消失
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 2000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const handleLike = async () => {
    if (!user?.id) { setToast('请先登录'); return }
    const prev = liked
    setLiked(!prev)
    setLikeCount(c => c + (prev ? -1 : 1))
    try {
      await toggleLikeWithPoints(targetType, content.id)
      if (!prev) setToast('+5 积分')
      checkAndUnlockAchievements(user.id).catch(() => {})
    } catch {
      setLiked(prev)
      setLikeCount(c => c + (prev ? 1 : -1))
    }
  }

  const handleFavorite = async () => {
    if (!user?.id) { setToast('请先登录'); return }
    const prev = favorited
    setFavorited(!prev)
    setFavCount(c => c + (prev ? -1 : 1))
    try {
      await toggleFavorite(targetType, content.id)
    } catch {
      setFavorited(prev)
      setFavCount(c => c + (prev ? 1 : -1))
    }
  }

  const handlePromote = async () => {
    if (!user?.id) { setToast('请先登录'); return }
    if (promoted || promoting) return
    setPromoting(true)
    try {
      await promoteContent(user.id, content.id)
      setPromoted(true)
      setToast('🔥 帮推成功 +20积分')
      checkAndUnlockAchievements(user.id).catch(() => {})
    } catch (e: any) {
      if (e.message === '已经帮推过该内容') {
        setPromoted(true)
      } else {
        setToast(e.message || '帮推失败')
      }
    } finally {
      setPromoting(false)
    }
  }

  return (
    <>
      <div className="absolute right-3 bottom-36 z-20 flex flex-col items-center gap-4">
        {/* 头像 */}
        <button className="relative mb-2">
          <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-2xl border-2 border-white">{content.creator.avatar}</div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"><span className="text-white text-[10px] font-bold">+</span></div>
        </button>

        {/* 点赞 */}
        <button onClick={handleLike} className="flex flex-col items-center gap-0.5">
          <span className="text-2xl">{liked ? '❤️' : '🤍'}</span>
          <span className="text-white text-[11px]">{formatStat(likeCount)}</span>
        </button>

        {/* 造梗 */}
        <button onClick={onMeme} className="flex flex-col items-center gap-0.5">
          <span className="text-2xl">💡</span>
          <span className="text-white text-[11px]">造梗</span>
        </button>

        {/* 评论 */}
        <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-0.5">
          <span className="text-2xl">💬</span>
          <span className="text-white text-[11px]">{formatStat(commentCount)}</span>
        </button>

        {/* 帮推 */}
        <button onClick={handlePromote} className="flex flex-col items-center gap-0.5">
          <span className="text-2xl">{promoted ? '✅' : promoting ? '⏳' : '🔥'}</span>
          <span className="text-white text-[11px]">{promoted ? '已推' : '帮推'}</span>
        </button>

        {/* 收藏 */}
        <button onClick={handleFavorite} className="flex flex-col items-center gap-0.5">
          <span className="text-2xl">{favorited ? '⭐' : '☆'}</span>
          <span className="text-white text-[11px]">{formatStat(favCount)}</span>
        </button>

        {/* 分享 */}
        <button onClick={() => {
          const url = window.location.origin + '/content/' + content.id
          if (navigator.share) {
            navigator.share({ title: content.title, url })
          } else {
            navigator.clipboard.writeText(url)
            setToast('链接已复制 ✓')
          }
        }} className="flex flex-col items-center gap-0.5">
          <span className="text-2xl">↗️</span>
          <span className="text-white text-[11px]">{formatStat(content.stats.shares)}</span>
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-white/90 backdrop-blur-sm text-gray-900 text-sm font-medium px-5 py-2.5 rounded-full shadow-lg animate-bounce">
          {toast}
        </div>
      )}

      {/* 评论底部弹窗 */}
      {showComments && (
        <CommentSheet
          contentId={content.id}
          source={content.type === 'content' ? 'contents' : 'memes'}
          userId={user?.id}
          onClose={() => setShowComments(false)}
          onCommentAdded={() => setCommentCount(c => c + 1)}
        />
      )}
    </>
  )
}
