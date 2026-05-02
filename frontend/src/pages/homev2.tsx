// ===== 首页 - 全屏内容 Feed =====

import { useState, useEffect } from 'react'
import FeedContainer from '../components/FeedContainer'
import MemeModal from '../components/MemeModal'
import { supabase } from '../lib/supabase/client'
import type { Content } from '../lib/contentData'

interface HomeV2Props {
  user: any
  setUser: (user: any) => void
  isMobile: boolean
}

export default function HomeV2({ user, setUser: _setUser, isMobile: _isMobile }: HomeV2Props) {
  const [contents, setContents] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [memeTarget, setMemeTarget] = useState<Content | null>(null)

  useEffect(() => {
    fetchContents()
  }, [])

  const fetchContents = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('contents')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) {
      console.error('Fetch contents error:', error)
    }

    // 转换为 Content 格式
    const items: Content[] = (data || []).map(item => ({
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.description || '',
      cover: item.cover_url || '/placeholder-1.svg',
      tags: item.tags || [],
      creator: {
        id: item.creator_id || '',
        name: '用户',
        avatar: '👤',
        level: 1,
      },
      stats: {
        views: item.view_count || 0,
        likes: item.like_count || 0,
        comments: item.comment_count || 0,
        shares: item.share_count || 0,
        favorites: item.favorite_count || 0,
        promotes: item.promote_count || 0,
      },
      renderConfig: {
        mode: (item.render_mode as any) || 'card',
        src: item.render_src || '',
        detail: item.render_config || {},
      },
      interactionConfig: {
        canLike: true,
        canComment: true,
        canShare: true,
        canFavorite: true,
        canPromote: true,
        canRemix: true,
      },
      createdAt: item.created_at,
    }))

    setContents(items)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white/50 text-sm">加载中...</div>
      </div>
    )
  }

  if (contents.length === 0) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🌊</div>
          <div className="text-white/50 text-sm">暂无内容</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-black">
      <FeedContainer
        contents={contents}
        user={user}
        onMeme={(c) => setMemeTarget(c)}
      />

      {/* 造梗弹窗 */}
      {memeTarget && (
        <MemeModal
          targetTitle={memeTarget.title}
          onClose={() => setMemeTarget(null)}
          onSuccess={async (meme) => {
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (!authUser) return
            await supabase.from('memes').insert({
              type: meme.type,
              title: meme.title,
              content: meme.content,
              hashtags: meme.hashtags,
              source_content_id: memeTarget.id,
              creator_id: authUser.id,
            })
            setMemeTarget(null)
          }}
        />
      )}
    </div>
  )
}
