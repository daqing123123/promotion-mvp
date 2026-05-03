// ===== 首页 - 全屏内容 Feed（含活动） =====

import { useState, useEffect, useCallback } from 'react'
import FeedContainer from '../components/FeedContainer'
import MemeModal from '../components/MemeModal'
import { supabase } from '../lib/supabase/client'
import type { Content } from '../lib/contentData'

const CACHE_KEY = 'julang_feed_cache'
const CACHE_TIME_KEY = 'julang_feed_time'
const CACHE_MAX = 80

function getCachedFeed(): Content[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    const time = localStorage.getItem(CACHE_TIME_KEY)
    if (!cached || !time) return null
    if (Date.now() - Number(time) > 30 * 60 * 1000) return null
    return JSON.parse(cached)
  } catch { return null }
}

function setCachedFeed(items: Content[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(items.slice(0, CACHE_MAX)))
    localStorage.setItem(CACHE_TIME_KEY, String(Date.now()))
  } catch {}
}

interface HomeV2Props {
  user: any
  setUser: (user: any) => void
  isMobile: boolean
}

export default function HomeV2({ user, setUser: _setUser, isMobile: _isMobile }: HomeV2Props) {
  const [contents, setContents] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [memeTarget, setMemeTarget] = useState<Content | null>(null)
  const [memeOffset, setMemeOffset] = useState(0)
  const [contentOffset, setContentOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    const cached = getCachedFeed()
    if (cached && cached.length > 0) {
      setContents(cached)
      setLoading(false)
      fetchContents(false, true)
    } else {
      fetchContents()
    }
  }, [])

  const fetchContents = async (isLoadMore = false, silent = false) => {
    if (isLoadMore) setLoadingMore(true)
    else if (!silent) setLoading(true)

    const currentMemeOffset = isLoadMore ? memeOffset : 0
    const currentContentOffset = isLoadMore ? contentOffset : 0

    // 三个数据源并行：contents + memes + activities
    const [contentsRes, memesRes, activitiesRes] = await Promise.all([
      supabase.from('contents')
        .select('id, type, title, description, cover_url, tags, creator_id, render_mode, render_src, render_config, view_count, like_count, promote_count, share_count, comment_count, favorite_count, created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(currentContentOffset, currentContentOffset + 14),
      supabase.from('memes')
        .select('id, title, content, image_url, hashtags, creator_id, creator_name, creator_avatar, like_count, view_count, share_count, created_at')
        .eq('status', 'published')
        .order('hot_score', { ascending: false })
        .range(currentMemeOffset, currentMemeOffset + 19),
      // 活动只在首页加载时获取（不分页）
      isLoadMore ? { data: [] } : supabase.from('activities')
        .select('id, type, title, description, reward, participant_count, end_date, status, created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    const newContents = contentsRes.data || []
    const newMemes = memesRes.data || []
    const newActivities = activitiesRes.data || []

    if (newContents.length === 0 && newMemes.length === 0 && newActivities.length === 0) {
      setHasMore(false)
      if (!silent) setLoading(false)
      setLoadingMore(false)
      return
    }

    // 获取 contents 的创作者信息
    const contentCreatorIds = [...new Set(newContents.map(c => c.creator_id).filter(Boolean))]
    let usersMap: Record<string, any> = {}
    if (contentCreatorIds.length > 0) {
      const { data: usersData } = await supabase.from('users').select('id, name, avatar, level').in('id', contentCreatorIds)
      if (usersData) usersMap = Object.fromEntries(usersData.map(u => [u.id, u]))
    }

    // 转换 contents
    const contentItems: Content[] = newContents.map(item => {
      const u = usersMap[item.creator_id] || {}
      return {
        id: item.id, type: item.type, title: item.title, description: item.description || '',
        cover: item.cover_url || '/placeholder-1.svg', tags: item.tags || [],
        creator: { id: item.creator_id || '', name: u.name || '用户', avatar: u.avatar || '👤', level: u.level || 1 },
        stats: { views: item.view_count || 0, likes: item.like_count || 0, comments: item.comment_count || 0, shares: item.share_count || 0, favorites: item.favorite_count || 0, promotes: item.promote_count || 0 },
        renderConfig: { mode: (item.render_mode as any) || 'card', src: item.render_src || '', detail: item.render_config || {} },
        interactionConfig: { canLike: true, canComment: true, canShare: true, canFavorite: true, canPromote: true, canRemix: true },
        createdAt: item.created_at,
      }
    })

    // 转换 memes
    const memeItems: Content[] = newMemes.map(item => {
      const u = usersMap[item.creator_id] || {}
      return {
        id: item.id, type: 'content', title: item.title || item.content?.substring(0, 30) || '',
        description: item.content || '', cover: item.image_url || '/placeholder-1.svg', tags: item.hashtags || [],
        creator: { id: item.creator_id || '', name: item.creator_name || u.name || '匿名用户', avatar: item.creator_avatar || u.avatar || '👤', level: u.level || 1 },
        stats: { views: item.view_count || 0, likes: item.like_count || 0, comments: 0, shares: item.share_count || 0, favorites: 0, promotes: 0 },
        renderConfig: { mode: 'card', src: '', detail: {} },
        interactionConfig: { canLike: true, canComment: true, canShare: true, canFavorite: true, canPromote: true, canRemix: false },
        createdAt: item.created_at,
      }
    })

    // 转换 activities → Content 格式
    const activityItems: Content[] = newActivities.map(item => ({
      id: item.id,
      type: 'content' as const,
      title: `🎯 ${item.title}`,
      description: `${item.description}${item.reward ? `\n\n🎁 奖励：${item.reward}积分` : ''}${item.end_date ? `\n⏰ 截止：${new Date(item.end_date).toLocaleDateString('zh-CN')}` : ''}${item.participant_count ? `\n👥 ${item.participant_count}人已参与` : ''}`,
      cover: '/placeholder-1.svg',
      tags: ['活动', item.type],
      creator: { id: '', name: '巨浪官方', avatar: '🌊', level: 99 },
      stats: { views: 0, likes: 0, comments: 0, shares: 0, favorites: 0, promotes: 0 },
      renderConfig: { mode: 'card' as const, src: '', detail: { isActivity: true, activityId: item.id, reward: item.reward } },
      interactionConfig: { canLike: true, canComment: true, canShare: true, canFavorite: false, canPromote: false, canRemix: false },
      createdAt: item.created_at,
    }))

    // 合并并随机打散
    const allNew = [...contentItems, ...memeItems]
    // 活动插到前面（优先展示）
    if (activityItems.length > 0 && !isLoadMore) {
      allNew.splice(Math.min(2, allNew.length), 0, ...activityItems)
    }
    const newItems = allNew.sort(() => Math.random() - 0.5)

    if (isLoadMore) {
      setContents(prev => [...prev, ...newItems])
      setMemeOffset(currentMemeOffset + newMemes.length)
      setContentOffset(currentContentOffset + newContents.length)
    } else {
      setContents(newItems)
      setMemeOffset(newMemes.length)
      setContentOffset(newContents.length)
      setCachedFeed(newItems)
    }

    if (newItems.length < 10) setHasMore(false)
    if (!silent) setLoading(false)
    setLoadingMore(false)
  }

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) fetchContents(true)
  }, [loadingMore, hasMore, memeOffset, contentOffset])

  if (loading && contents.length === 0) {
    return (
      <div className="w-full h-screen bg-black">
        <div className="pt-14 px-5 pb-4">
          <div className="h-8 w-32 bg-white/10 rounded mb-4 animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/5 rounded-2xl p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white/10 rounded-full" />
                  <div className="flex-1"><div className="h-4 w-24 bg-white/10 rounded mb-1" /><div className="h-3 w-16 bg-white/10 rounded" /></div>
                </div>
                <div className="h-4 w-3/4 bg-white/10 rounded mb-2" />
                <div className="h-40 bg-white/10 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (contents.length === 0) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-center"><div className="text-4xl mb-4">🌊</div><div className="text-white/50 text-sm">暂无内容</div></div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-black">
      <FeedContainer contents={contents} user={user} onMeme={(c) => setMemeTarget(c)} onLoadMore={handleLoadMore} loadingMore={loadingMore} />
      {memeTarget && (
        <MemeModal targetTitle={memeTarget.title} onClose={() => setMemeTarget(null)} onSuccess={async (meme) => {
          const { data: { user: authUser } } = await supabase.auth.getUser()
          if (!authUser) return
          await supabase.from('memes').insert({ type: meme.type, title: meme.title, content: meme.content, hashtags: meme.hashtags, source_content_id: memeTarget.id, creator_id: authUser.id })
          setMemeTarget(null)
        }} />
      )}
    </div>
  )
}
