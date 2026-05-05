// ===== 首页 - 全屏内容 Feed（含活动） =====

import { useState, useEffect, useCallback } from 'react'
import FeedContainer from '../components/FeedContainer'
import MemeModal from '../components/MemeModal'
import { getContents, getMemes, getActivities, getUserById, createMeme } from '../lib/api/client'
import type { Content } from '../lib/contentData'

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
    fetchContents()
  }, [])

  const fetchContents = async (isLoadMore = false, silent = false) => {
    if (isLoadMore) setLoadingMore(true)
    else if (!silent) setLoading(true)

    const currentMemeOffset = isLoadMore ? memeOffset : 0
    const currentContentOffset = isLoadMore ? contentOffset : 0

    // 三个数据源并行：contents + memes + activities
    const [contentsRes, memesRes, activitiesRes] = await Promise.all([
      getContents(10, currentContentOffset).catch(() => []),
      getMemes({ status: 'published', limit: 10, offset: currentMemeOffset }).catch(() => []),
      isLoadMore ? [] : getActivities('active').then((list: any) => (Array.isArray(list) ? list.slice(0, 3) : [])).catch(() => []),
    ])

    const newContents = Array.isArray(contentsRes) ? contentsRes : (contentsRes?.data || [])
    const newMemes = Array.isArray(memesRes) ? memesRes : (memesRes?.data || [])
    const newActivities = Array.isArray(activitiesRes) ? activitiesRes : (activitiesRes?.data || [])

    if (newContents.length === 0 && newMemes.length === 0 && newActivities.length === 0) {
      setHasMore(false)
      if (!silent) setLoading(false)
      setLoadingMore(false)
      return
    }

    // 获取创作者信息
    const contentCreatorIds = [...new Set(newContents.map(c => c.creator_id).filter(Boolean))]
    let usersMap: Record<string, any> = {}
    if (contentCreatorIds.length > 0) {
      try {
        const usersData = await Promise.all(contentCreatorIds.map(id => getUserById(id).catch(() => null)))
        const validUsers = usersData.filter(Boolean)
        usersMap = Object.fromEntries(validUsers.map((u: any) => [u.id, u]))
      } catch {}
    }

    // 转换 contents
    const contentItems: Content[] = newContents.map(item => {
      const u = usersMap[item.creator_id] || {}
      return {
        id: item.id, type: item.type, title: item.title, description: item.description || '',
        cover: item.cover_url || '/placeholder-1.svg', tags: item.tags || [],
        _source: 'contents' as const,
        creator: { id: item.creator_id || '', name: u.name || '用户', avatar: u.avatar || '👤', level: u.level || 1 },
        stats: { views: item.view_count || 0, likes: item.like_count || 0, comments: item.comment_count || 0, shares: item.share_count || 0, favorites: item.favorite_count || 0, promotes: item.promote_count || 0 },
        renderConfig: { mode: (item.render_mode as any) || 'card', src: '', detail: {} },
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
        _source: 'memes' as const,
        creator: { id: item.creator_id || '', name: item.creator_name || u.name || '匿名用户', avatar: item.creator_avatar || u.avatar || '👤', level: u.level || 1 },
        stats: { views: item.view_count || 0, likes: item.like_count || 0, comments: item.comment_count || 0, shares: item.share_count || 0, favorites: 0, promotes: 0 },
        renderConfig: { mode: 'card', src: '', detail: {} },
        interactionConfig: { canLike: true, canComment: true, canShare: true, canFavorite: true, canPromote: true, canRemix: false },
        createdAt: item.created_at,
      }
    })

    // 转换 activities → Content 格式
    const activityItems: Content[] = newActivities.map((item: any) => ({
      id: item.id,
      type: 'content' as const,
      title: `🎯 ${item.title}`,
      description: `${item.description || ''}${item.reward ? `\n\n🎁 奖励：${item.reward}积分` : ''}${item.end_date ? `\n⏰ 截止：${new Date(item.end_date).toLocaleDateString('zh-CN')}` : ''}${item.participant_count ? `\n👥 ${item.participant_count}人已参与` : ''}`,
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
      {/* Top Action Cards */}
      <div className="pt-14 px-5 pb-2 flex gap-2 overflow-x-auto">
        <a href="/daily-challenge" className="flex-shrink-0 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-xl p-3 border border-purple-500/20 active:scale-95 transition-transform" style="min-width:45%">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔥</span>
            <div>
              <p className="text-white text-sm font-bold">每日造梗挑战</p>
              <p className="text-white/40 text-xs">今日话题参赛+10积分</p>
            </div>
            <span className="ml-auto text-white/30">→</span>
          </div>
        </a>
        <a href="/battle" className="flex-shrink-0 bg-gradient-to-r from-orange-600/30 to-red-600/30 rounded-xl p-3 border border-orange-500/20 active:scale-95 transition-transform" style="min-width:45%">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚔️</span>
            <div>
              <p className="text-white text-sm font-bold">每日PK大战</p>
              <p className="text-white/40 text-xs">投票站队赢+3积分</p>
            </div>
            <span className="ml-auto text-white/30">→</span>
          </div>
        </a>
      </div>
      <div className="px-5 pb-3">
        <a href="/leaderboard" className="flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl p-3 border border-blue-500/20 active:scale-95 transition-transform">
          <span className="text-lg">🏆</span>
          <div className="flex-1">
            <p className="text-white text-sm font-bold">热门排行榜</p>
            <p className="text-white/40 text-xs">今日最热梗·最强推广·积分富豪</p>
          </div>
          <span className="text-white/30">查看 →</span>
        </a>
      </div>
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
      {/* Top Action Cards */}
      <div className="pt-14 px-5 pb-2 flex gap-2 overflow-x-auto">
        <a href="/daily-challenge" className="flex-shrink-0 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-xl p-3 border border-purple-500/20 active:scale-95 transition-transform" style="min-width:45%">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔥</span>
            <div>
              <p className="text-white text-sm font-bold">每日造梗挑战</p>
              <p className="text-white/40 text-xs">今日话题参赛+10积分</p>
            </div>
            <span className="ml-auto text-white/30">→</span>
          </div>
        </a>
        <a href="/battle" className="flex-shrink-0 bg-gradient-to-r from-orange-600/30 to-red-600/30 rounded-xl p-3 border border-orange-500/20 active:scale-95 transition-transform" style="min-width:45%">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚔️</span>
            <div>
              <p className="text-white text-sm font-bold">每日PK大战</p>
              <p className="text-white/40 text-xs">投票站队赢+3积分</p>
            </div>
            <span className="ml-auto text-white/30">→</span>
          </div>
        </a>
      </div>
      <div className="px-5 pb-3">
        <a href="/leaderboard" className="flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl p-3 border border-blue-500/20 active:scale-95 transition-transform">
          <span className="text-lg">🏆</span>
          <div className="flex-1">
            <p className="text-white text-sm font-bold">热门排行榜</p>
            <p className="text-white/40 text-xs">今日最热梗·最强推广·积分富豪</p>
          </div>
          <span className="text-white/30">查看 →</span>
        </a>
      </div>
      <FeedContainer contents={contents} user={user} onMeme={(c) => setMemeTarget(c)} onLoadMore={handleLoadMore} loadingMore={loadingMore} />
      {memeTarget && (
        <MemeModal targetTitle={memeTarget.title} onClose={() => setMemeTarget(null)} onSuccess={async (meme) => {
          try {
            await createMeme({
              type: meme.type, title: meme.title, content: meme.content,
              hashtags: meme.hashtags, source_content_id: memeTarget.id,
            })
          } catch {}
          setMemeTarget(null)
        }} />
      )}
    </div>
  )
}
