// ===== 首页 - 全屏内容 Feed（含活动） =====

import { useState, useEffect, useCallback } from 'react'
import FeedContainer from '../components/FeedContainer'
import MemeModal from '../components/MemeModal'
import { getContents, getMemes, getActivities, getUserById, createMeme } from '../lib/api/client'
import type { Content } from '../lib/contentData'

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240'%3E%3Crect fill='%231e293b' width='400' height='240'/%3E%3Ccircle cx='200' cy='120' r='40' fill='%23334155'/%3E%3C/svg%3E"

// 快捷入口 SVG 图标
const FireIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 2c-4 4-7 7-7 11a7 7 0 0014 0c0-4-3-9-7-11z" fill="#f97316" fillOpacity="0.3"/>
    <path d="M12 2c-4 4-7 7-7 11 0 3.9 3.1 7 7 7s7-3.1 7-7c0-4-3-9-7-11z" fill="none" stroke="#f97316" strokeWidth="1.5"/>
    <path d="M10 14.5c0-1 2-3 2-3s2 2 2 3a2 2 0 01-4 0z" fill="#fbbf24"/>
  </svg>
)

const SwordsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M7 3l-4 4 3 3 1-1 3 3-1 1 3 3 4-4" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 21l4-4-3-3-1 1-3-3 1-1-3-3-4 4" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const TrophyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M6 4h12v3a4 4 0 01-4 4h-4a4 4 0 01-4-4V4z" fill="#eab308" fillOpacity="0.3"/>
    <path d="M6 4h12M6 4H4v3a4 4 0 004 4h1M18 4h2v3a4 4 0 01-4 4h-1" stroke="#eab308" strokeWidth="1.5"/>
    <path d="M10 15v5m4-5v5M8 20h8" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

// 快捷入口卡片（loading 和 内容状态共用）
const ActionCards = () => (
  <>
    <div className="pt-14 px-5 pb-2 flex gap-2 overflow-x-auto">
      <a href="/daily-challenge" className="flex-shrink-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-3 border border-purple-500/20 active:scale-95 transition-transform min-w-[45%]">
        <div className="flex items-center gap-2">
          <FireIcon />
          <div>
            <p className="text-white text-sm font-bold">每日造梗挑战</p>
            <p className="text-white/40 text-xs">今日话题参赛+10积分</p>
          </div>
          <span className="ml-auto text-white/30">→</span>
        </div>
      </a>
      <a href="/battle" className="flex-shrink-0 bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-xl p-3 border border-orange-500/20 active:scale-95 transition-transform min-w-[45%]">
        <div className="flex items-center gap-2">
          <SwordsIcon />
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
        <TrophyIcon />
        <div className="flex-1">
          <p className="text-white text-sm font-bold">热门排行榜</p>
          <p className="text-white/40 text-xs">今日最热梗·最强推广·积分富豪</p>
        </div>
        <span className="text-white/30">查看 →</span>
      </a>
    </div>
  </>
)

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
        cover: item.cover_url || PLACEHOLDER, tags: item.tags || [],
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
        description: item.content || '', cover: item.image_url || PLACEHOLDER, tags: item.hashtags || [],
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
      title: item.title,
      description: `${item.description || ''}${item.reward ? `\n\n奖励：${item.reward}积分` : ''}${item.end_date ? `\n截止：${new Date(item.end_date).toLocaleDateString('zh-CN')}` : ''}${item.participant_count ? `\n${item.participant_count}人已参与` : ''}`,
      cover: PLACEHOLDER,
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

  // ===== 加载骨架屏 =====
  if (loading && contents.length === 0) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="pt-14 px-5 pb-2 flex gap-2 overflow-x-auto">
          <div className="flex-shrink-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-3 border border-purple-500/20 min-w-[45%]">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-purple-500/30 rounded" />
              <div className="flex-1"><div className="h-4 w-24 bg-purple-500/20 rounded mb-1" /><div className="h-3 w-32 bg-purple-500/10 rounded" /></div>
            </div>
          </div>
          <div className="flex-shrink-0 bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-xl p-3 border border-orange-500/20 min-w-[45%]">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-orange-500/30 rounded" />
              <div className="flex-1"><div className="h-4 w-20 bg-orange-500/20 rounded mb-1" /><div className="h-3 w-28 bg-orange-500/10 rounded" /></div>
            </div>
          </div>
        </div>
        <div className="px-5 pb-3">
          <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl p-3 border border-blue-500/20">
            <div className="w-5 h-5 bg-blue-500/30 rounded" />
            <div className="flex-1"><div className="h-4 w-20 bg-blue-500/20 rounded mb-1" /><div className="h-3 w-40 bg-blue-500/10 rounded" /></div>
          </div>
        </div>
        <div className="pt-14 px-5 pb-4">
          <div className="h-8 w-32 bg-slate-800/50 rounded mb-4 animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-slate-800/40 rounded-2xl p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-slate-700/50 rounded-full" />
                  <div className="flex-1"><div className="h-4 w-24 bg-slate-700/50 rounded mb-1" /><div className="h-3 w-16 bg-slate-700/50 rounded" /></div>
                </div>
                <div className="h-4 w-3/4 bg-slate-700/50 rounded mb-2" />
                <div className="h-40 bg-slate-700/50 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ===== 空状态 =====
  if (contents.length === 0) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center px-8">
          <div className="mb-6">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="mx-auto">
              <circle cx="36" cy="36" r="30" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" opacity="0.5"/>
              <circle cx="36" cy="36" r="24" stroke="#475569" strokeWidth="1" opacity="0.3"/>
              <path d="M14 44 Q24 34 36 38 Q48 42 58 30" stroke="#6366f1" strokeWidth="2" fill="none" opacity="0.5"/>
              <path d="M20 50 Q28 42 38 44 Q48 46 56 38" stroke="#8b5cf6" strokeWidth="1.5" fill="none" opacity="0.3"/>
              <circle cx="36" cy="38" r="3" fill="#6366f1" opacity="0.6"/>
            </svg>
          </div>
          <p className="text-slate-400 text-base font-medium mb-1">还没有内容</p>
          <p className="text-slate-600 text-sm mb-6">去话题广场发现感兴趣的话题，<br/>或成为第一个发布的人</p>
          <a href="/topics" className="inline-block px-6 py-2.5 bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 rounded-xl text-sm font-medium border border-indigo-500/20 transition-colors">
            探索话题广场
          </a>
        </div>
      </div>
    )
  }

  // ===== 内容流 =====
  return (
    <div className="w-full h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <ActionCards />
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
