// ===== 评论底部弹窗 =====

import { useState, useEffect, useRef } from 'react'
import { getComments, addCommentWithPoints, getUserById, getCurrentUser } from '../lib/api/client'
import { checkAndUnlockAchievements } from '../lib/achievements'
import { toast } from '../lib/toast'

interface CommentSheetProps {
  contentId: string
  source: 'memes' | 'contents' | 'topic'
  userId?: string
  onClose: () => void
  onCommentAdded?: () => void
}

export default function CommentSheet({ contentId, source, userId, onClose, onCommentAdded }: CommentSheetProps) {
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadComments()
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [])

  useEffect(() => {
    const stop = (e: Event) => e.stopPropagation()
    const el = sheetRef.current
    if (el) {
      el.addEventListener('touchstart', stop, { passive: false })
      el.addEventListener('touchmove', stop, { passive: false })
      el.addEventListener('touchend', stop, { passive: false })
      el.addEventListener('wheel', stop, { passive: false })
    }
    return () => {
      if (el) {
        el.removeEventListener('touchstart', stop)
        el.removeEventListener('touchmove', stop)
        el.removeEventListener('touchend', stop)
        el.removeEventListener('wheel', stop)
      }
    }
  }, [])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === sheetRef.current) onClose()
  }

  const loadComments = async () => {
    setLoading(true)
    let targetType: string
    if (source === 'memes') targetType = 'meme'
    else if (source === 'topic') targetType = 'topic'
    else targetType = 'content'

    try {
      const cmts = await getComments(targetType, contentId)

      const userIds = [...new Set((cmts || []).map((c: any) => c.user_id).filter(Boolean))]
      let usersMap: Record<string, any> = {}
      for (const uid of userIds) {
        try {
          const u = await getUserById(uid)
          if (u) usersMap[uid] = u
        } catch {}
      }

      setComments((cmts || []).map((c: any) => ({
        ...c,
        user_name: usersMap[c.user_id]?.name || '匿名用户',
        user_avatar: usersMap[c.user_id]?.avatar || '👤',
      })))
    } catch (err) {
      console.error('加载评论失败:', err)
    }
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return
    setSubmitting(true)

    let uid = userId
    if (!uid) {
      try {
        const currentUser = await getCurrentUser()
        uid = currentUser?.id
      } catch {}
    }
    if (!uid) {
      toast.warning('请先登录')
      setSubmitting(false)
      return
    }

    try {
      let targetType: string
      if (source === 'memes') targetType = 'meme'
      else if (source === 'topic') targetType = 'topic'
      else targetType = 'content'

      const inserted = await addCommentWithPoints(targetType, contentId, newComment.trim())

      // 获取当前用户信息
      let userName = '匿名用户'
      let userAvatar = '👤'
      try {
        const u = await getUserById(uid)
        if (u) { userName = u.name; userAvatar = u.avatar }
      } catch {}

      setComments([{
        ...inserted,
        user_name: userName,
        user_avatar: userAvatar,
      }, ...comments])
      setNewComment('')
      onCommentAdded?.()
      if (uid) checkAndUnlockAchievements(uid).catch(() => {})
    } catch (e: any) {
      toast.error(e.message || '评论失败')
    }
    setSubmitting(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div
      ref={sheetRef}
      className="fixed inset-0 z-[100] flex items-end"
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-black/50" onClick={(e) => { e.stopPropagation(); onClose() }} />
      <div className="relative w-full bg-white rounded-t-3xl max-h-[70vh] flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-5 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold">💬 评论 ({comments.length})</h3>
            <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3" style={{ maxHeight: 'calc(70vh - 160px)' }}>
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">加载中...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">还没有评论，来说两句吧 💬</div>
          ) : (
            comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm shrink-0">
                  {c.user_avatar || '👤'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{c.user_name || '匿名用户'}</span>
                    <span className="text-[10px] text-gray-400">{new Date(c.created_at).toLocaleDateString('zh-CN')}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{c.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-100 px-5 py-3 bg-white">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="说说你的看法..."
              rows={1}
              className="flex-1 text-sm resize-none focus:outline-none bg-gray-100 rounded-2xl px-4 py-2.5 max-h-20"
              style={{ minHeight: '40px' }}
            />
            <button
              onClick={handleSubmit}
              disabled={!newComment.trim() || submitting}
              className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                newComment.trim() ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'
              }`}
            >
              {submitting ? '...' : '↑'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
