// ===== Feed 右侧按钮 — 真实数据交互 =====

import { useState, useEffect } from 'react'
import { type Content } from '../lib/contentData'
import { formatStat } from '../lib/memeSystem'
import { checkInteraction, toggleLikeWithPoints, toggleFavorite, promoteContent, shareContent } from '../lib/api/client'
import { checkAndUnlockAchievements } from '../lib/achievements'
import { toast } from '../lib/toast'
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

  // 用 _source 判断 targetType，兜底用 type 判断
  const targetType = content._source === 'memes' ? 'meme' : 'content'
  const isMeme = content._source === 'memes'

  // 弹窗状态同步到 FeedContainer
  useEffect(() => {
    onModalToggle?.(showComments)
  }, [showComments])

  // 检查当前用户是否已点赞/收藏/帮推
  useEffect(() => {
    if (!user?.id) return
    const checkInteractions = async () => {
      const [hasLiked, hasFav] = await Promise.all([
        checkInteraction(targetType, content.id, 'like'),
        checkInteraction(targetType, content.id, 'favorite'),
      ])
      if (hasLiked) setLiked(true)
      if (hasFav) setFavorited(true)
    }
    checkInteractions()
  }, [user?.id, content.id, targetType])

  // 同步外部数据变化
  useEffect(() => {
    setLikeCount(content.stats.likes)
    setFavCount(content.stats.favorites)
    setCommentCount(content.stats.comments)
  }, [content.id])

  const handleLike = async () => {
    if (!user?.id) { toast.warning('请先登录'); return }
    const prev = liked
    setLiked(!prev)
    setLikeCount(c => c + (prev ? -1 : 1))
    try {
      await toggleLikeWithPoints(targetType, content.id)
      if (!prev) toast.points(5)
      checkAndUnlockAchievements(user.id).catch(() => {})
    } catch {
      setLiked(prev)
      setLikeCount(c => c + (prev ? 1 : -1))
    }
  }

  const handleFavorite = async () => {
    if (!user?.id) { toast.warning('请先登录'); return }
    const prev = favorited
    setFavorited(!prev)
    setFavCount(c => Math.max(0, c + (prev ? -1 : 1)))
    try {
      await toggleFavorite(targetType, content.id)
    } catch {
      setFavorited(prev)
      setFavCount(c => c + (prev ? 1 : -1))
    }
  }

  const handlePromote = async () => {
    if (!user?.id) { toast.warning('请先登录'); return }
    if (promoted || promoting) return
    setPromoting(true)
    try {
      await promoteContent(user.id, content.id)
      setPromoted(true)
      toast.points(20)
      checkAndUnlockAchievements(user.id).catch(() => {})
    } catch (e: any) {
      if (e.message === '已经帮推过该内容') {
        setPromoted(true)
      } else {
        toast.error(e.message || '帮推失败')
      }
    } finally {
      setPromoting(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.origin + '/content/' + content.id
    try {
      if (navigator.share) {
        await navigator.share({ title: content.title, url })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success('链接已复制 ✓')
      }
      // 分享计数+积分（后端统一处理）
      if (user?.id) {
        try {
          const shareResult = await shareContent(content.id)
          if (shareResult.reward) toast.points(shareResult.reward)
        } catch {}
      }
    } catch {}
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

        {/* 帮推 — 仅 contents 可用，memes 无 FK */}
        {!isMeme && (
          <button onClick={handlePromote} className="flex flex-col items-center gap-0.5">
            <span className="text-2xl">{promoted ? '✅' : promoting ? '⏳' : '🔥'}</span>
            <span className="text-white text-[11px]">{promoted ? '已推' : '帮推'}</span>
          </button>
        )}

        {/* 收藏 */}
        <button onClick={handleFavorite} className="flex flex-col items-center gap-0.5">
          <span className="text-2xl">{favorited ? '⭐' : '☆'}</span>
          <span className="text-white text-[11px]">{formatStat(favCount)}</span>
        </button>

        {/* 分享 */}
        <button onClick={handleShare} className="flex flex-col items-center gap-0.5">
          <span className="text-2xl">↗️</span>
          <span className="text-white text-[11px]">{formatStat(content.stats.shares)}</span>
        </button>
      </div>

      {/* 评论底部弹窗 */}
      {showComments && (
        <CommentSheet
          contentId={content.id}
          source={isMeme ? 'memes' : 'contents'}
          userId={user?.id}
          onClose={() => setShowComments(false)}
          onCommentAdded={() => setCommentCount(c => c + 1)}
        />
      )}
    </>
  )
}
