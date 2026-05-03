// ===== Feed 右侧按钮 — 真实数据交互 =====

import { useState, useEffect } from 'react'
import { type Content } from '../lib/contentData'
import { formatStat } from '../lib/memeSystem'
import { supabase, toggleLikeWithPoints, toggleFavorite, promoteContent } from '../lib/supabase/client'
import { checkAndUnlockAchievements } from '../lib/achievements'
import CommentSheet from './CommentSheet'

export default function FeedControls({ content, user, onMeme }: { content: Content; user: any; onMeme?: () => void }) {
  const [liked, setLiked] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [likeCount, setLikeCount] = useState(content.stats.likes)
  const [favCount, setFavCount] = useState(content.stats.favorites)
  const [promoting, setPromoting] = useState(false)
  const [promoted, setPromoted] = useState(false)

  const targetType = content.type === 'content' ? 'content' : 'meme'

  // 检查当前用户是否已点赞/收藏
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
  }, [content.id, content.stats.likes, content.stats.favorites])

  const handleLike = async () => {
    if (!user?.id) return alert('请先登录')
    const prev = liked
    setLiked(!prev)
    setLikeCount(c => c + (prev ? -1 : 1))
    try {
      await toggleLikeWithPoints(targetType, content.id)
      checkAndUnlockAchievements(user.id).catch(() => {})
    } catch {
      setLiked(prev)
      setLikeCount(c => c + (prev ? 1 : -1))
    }
  }

  const handleFavorite = async () => {
    if (!user?.id) return alert('请先登录')
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
    if (!user?.id) return alert('请先登录')
    if (promoted || promoting) return
    setPromoting(true)
    try {
      await promoteContent(user.id, content.id)
      setPromoted(true)
      checkAndUnlockAchievements(user.id).catch(() => {})
    } catch (e: any) {
      if (e.message !== '已经帮推过该内容') {
        alert(e.message || '帮推失败')
      } else {
        setPromoted(true)
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
          <span className="text-white text-[11px]">{formatStat(content.stats.comments)}</span>
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
            alert('链接已复制')
          }
        }} className="flex flex-col items-center gap-0.5">
          <span className="text-2xl">↗️</span>
          <span className="text-white text-[11px]">{formatStat(content.stats.shares)}</span>
        </button>
      </div>

      {/* 评论底部弹窗 */}
      {showComments && (
        <CommentSheet
          contentId={content.id}
          source={content.type === 'content' ? 'contents' : 'memes'}
          userId={user?.id}
          onClose={() => setShowComments(false)}
        />
      )}
    </>
  )
}
