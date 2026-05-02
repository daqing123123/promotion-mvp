// ===== 内容详情页 — 真实数据版 =====

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase/client'

export default function ContentDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [content, setContent] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [liked, setLiked] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (id) loadContent(id)
  }, [id])

  const loadContent = async (contentId: string) => {
    setLoading(true)

    // 先查 contents 表
    let { data } = await supabase.from('contents').select('*').eq('id', contentId).single()
    let source = 'contents'

    // 没找到就查 memes 表
    if (!data) {
      const res = await supabase.from('memes').select('*').eq('id', contentId).single()
      data = res.data
      source = 'memes'
    }

    if (data) {
      setContent({ ...data, _source: source })
      // 加载评论（关联用户信息）
      const { data: cmts } = await supabase
        .from('comments')
        .select('*')
        .eq('target_type', source === 'memes' ? 'meme' : 'content')
        .eq('target_id', data.id)
        .order('created_at', { ascending: false })
        .limit(50)

      // 获取评论者的用户信息
      const userIds = [...new Set((cmts || []).map(c => c.user_id).filter(Boolean))]
      let usersMap: Record<string, any> = {}
      if (userIds.length > 0) {
        const { data: usersData } = await supabase.from('users').select('id, name, avatar').in('id', userIds)
        if (usersData) usersMap = Object.fromEntries(usersData.map(u => [u.id, u]))
      }

      const commentsWithUser = (cmts || []).map(c => ({
        ...c,
        user_name: usersMap[c.user_id]?.name || '匿名用户',
        user_avatar: usersMap[c.user_id]?.avatar || '👤',
      }))
      setComments(commentsWithUser)
    }
    setLoading(false)
  }

  const handleLike = async () => {
    if (!content) return
    setLiked(!liked)
    const table = content._source === 'memes' ? 'memes' : 'contents'
    const field = content._source === 'memes' ? 'like_count' : 'like_count'
    await supabase.from(table).update({ [field]: (content.like_count || 0) + (liked ? -1 : 1) }).eq('id', content.id)
    setContent({ ...content, [field]: (content.like_count || 0) + (liked ? -1 : 1) })
  }

  const handleComment = async () => {
    if (!newComment.trim() || !content) return
    setSubmitting(true)

    // 获取当前用户（简化：用第一个用户）
    const { data: users } = await supabase.from('users').select('id, name, avatar').limit(1)
    const user = users?.[0]
    if (!user) { setSubmitting(false); return }

    const { data: inserted, error } = await supabase.from('comments').insert({
      user_id: user.id,
      target_type: content._source === 'memes' ? 'meme' : 'content',
      target_id: content.id,
      content: newComment.trim(),
    }).select().single()

    if (!error && inserted) {
      setComments([{ ...inserted, user_name: user.name, user_avatar: user.avatar }, ...comments])
      setNewComment('')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">🌊</div>
          <p className="text-gray-400 text-sm">加载中...</p>
        </div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <div className="text-4xl mb-3">😢</div>
        <p className="text-gray-500 mb-4">内容不存在</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-black text-white rounded-full text-sm">返回</button>
      </div>
    )
  }

  const isMeme = content._source === 'memes'
  const title = isMeme ? (content.title || content.content?.substring(0, 30)) : content.title
  const description = isMeme ? content.content : (content.description || '')
  const tags = isMeme ? (content.hashtags || []) : (content.tags || [])
  const creatorName = isMeme ? content.creator_name : content.creator_name
  const creatorAvatar = isMeme ? content.creator_avatar : content.creator_avatar

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* 顶部封面/标题区 */}
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-700 px-5 pt-14 pb-6">
        <button onClick={() => navigate(-1)} className="absolute top-12 left-4 text-white/80 text-lg">← 返回</button>
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 bg-white/20 text-white text-xs rounded-full">
              {isMeme ? '📝 段子' : `📦 ${content.type}`}
            </span>
            {tags.slice(0, 3).map((tag: string) => (
              <span key={tag} className="px-2 py-0.5 bg-white/10 text-white/70 text-[11px] rounded-full">#{tag}</span>
            ))}
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
            <span className="text-xl">🔄</span>
            <span className="text-sm text-gray-600">{content.share_count || 0}</span>
          </button>
          <button className="flex items-center gap-1.5">
            <span className="text-xl">🔥</span>
            <span className="text-sm text-gray-600">{content.view_count || 0} 浏览</span>
          </button>
        </div>
        <button onClick={() => setFavorited(!favorited)} className="text-xl">
          {favorited ? '⭐' : '☆'}
        </button>
      </div>

      {/* 创作者信息 */}
      <div className="bg-white px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
            {creatorAvatar || '👤'}
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-gray-900">{creatorName || '匿名用户'}</div>
            <div className="text-xs text-gray-400">
              {isMeme ? `${content.view_count || 0} 浏览` : `${content.type} · ${content.view_count || 0} 浏览`}
            </div>
          </div>
          <button className="px-4 py-1.5 bg-black text-white text-xs rounded-full">关注</button>
        </div>
      </div>

      {/* 帮推按钮 */}
      <div className="px-5 py-4">
        <button className="w-full py-3.5 bg-black text-white rounded-2xl font-bold text-base active:scale-[0.98] transition-transform">
          🔥 帮推这条内容 (+20积分)
        </button>
      </div>

      {/* 评论区 */}
      <div className="px-5">
        <h2 className="text-sm font-bold text-gray-900 mb-3">💬 评论 ({comments.length})</h2>

        {/* 发表评论 */}
        <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="说说你的看法..."
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
              {submitting ? '发送中...' : '发表'}
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
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">
                    {c.user_avatar || '👤'}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{c.user_name || '匿名用户'}</span>
                  <span className="text-[11px] text-gray-400">{new Date(c.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{c.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
