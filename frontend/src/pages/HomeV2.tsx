// @ts-nocheck
// ===== 棣栭〉 - 鍏ㄥ睆鍐呭 Feed锛堝惈娲诲姩锛?=====

import { useState, useEffect, useCallback } from 'react'
import FeedContainer from '../components/FeedContainer'
import MemeModal from '../components/MemeModal'
import { getContents, getMemes, getActivities, getComments, getUserById, createMeme } from '../lib/api/client'
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

    try {
      // 涓変釜鏁版嵁婧愬苟琛岋細contents + memes + activities
      const [newContents, newMemes, newActivities] = await Promise.all([
        getContents(10, currentContentOffset),
        getMemes({ limit: 10, offset: currentMemeOffset }),
        isLoadMore ? Promise.resolve([]) : getActivities('active').catch(() => []),
      ])

      if (newContents.length === 0 && newMemes.length === 0 && (!newActivities || newActivities.length === 0)) {
        setHasMore(false)
        if (!silent) setLoading(false)
        setLoadingMore(false)
        return
      }

      // 鑾峰彇 contents 鐨勫垱浣滆€呬俊鎭?      const contentCreatorIds = [...new Set(newContents.map((c: any) => c.creator_id).filter(Boolean))]
      let usersMap: Record<string, any> = {}
      for (const cid of contentCreatorIds) {
        try {
          const u = await getUserById(cid)
          if (u) usersMap[cid] = u
        } catch {}
      }

      // 杞崲 contents
      const contentItems: Content[] = newContents.map((item: any) => {
        const u = usersMap[item.creator_id] || {}
        return {
          id: item.id, type: item.type, title: item.title, description: item.description || '',
          cover: item.cover_url || '/placeholder-1.svg', tags: item.tags || [],
          _source: 'contents' as const,
          creator: { id: item.creator_id || '', name: u.name || '鐢ㄦ埛', avatar: u.avatar || '馃懁', level: u.level || 1 },
          stats: { views: item.view_count || 0, likes: item.like_count || 0, comments: item.comment_count || 0, shares: 0, favorites: item.favorite_count || 0, promotes: item.promote_count || 0 },
          renderConfig: { mode: (item.render_mode as any) || 'card', src: '', detail: {} },
          interactionConfig: { canLike: true, canComment: true, canShare: true, canFavorite: true, canPromote: true, canRemix: true },
          createdAt: item.created_at,
        }
      })

      // 杞崲 memes
      const memeItems: Content[] = newMemes.map((item: any) => ({
        id: item.id, type: 'content', title: item.title || item.content?.substring(0, 30) || '',
        description: item.content || '', cover: item.cover_url || '/placeholder-1.svg', tags: item.hashtags || [],
        _source: 'memes' as const,
        creator: { id: item.creator_id || '', name: item.creator_name || '鍖垮悕鐢ㄦ埛', avatar: item.creator_avatar || '馃懁', level: 1 },
        stats: { views: 0, likes: item.like_count || 0, comments: item.comment_count || 0, shares: 0, favorites: 0, promotes: 0 },
        renderConfig: { mode: 'card', src: '', detail: {} },
        interactionConfig: { canLike: true, canComment: true, canShare: true, canFavorite: true, canPromote: true, canRemix: false },
        createdAt: item.created_at,
      }))

      // 杞崲 activities 鈫?Content 鏍煎紡
      const activityItems: Content[] = (newActivities || []).map((item: any) => ({
        id: item.id,
        type: 'content' as const,
        title: `馃幆 ${item.title}`,
        description: `${item.description || ''}${item.reward_points ? `\n\n馃巵 濂栧姳锛?{item.reward_points}绉垎` : ''}${item.end_date ? `\n鈴?鎴锛?{new Date(item.end_date).toLocaleDateString('zh-CN')}` : ''}${item.current_participants ? `\n馃懃 ${item.current_participants}浜哄凡鍙備笌` : ''}`,
        cover: '/placeholder-1.svg',
        tags: ['娲诲姩', item.type],
        creator: { id: '', name: '宸ㄦ氮瀹樻柟', avatar: '馃寠', level: 99 },
        stats: { views: 0, likes: 0, comments: 0, shares: 0, favorites: 0, promotes: 0 },
        renderConfig: { mode: 'card' as const, src: '', detail: { isActivity: true, activityId: item.id, reward: item.reward_points } },
        interactionConfig: { canLike: true, canComment: true, canShare: true, canFavorite: false, canPromote: false, canRemix: false },
        createdAt: item.created_at,
      }))

      // 鍚堝苟骞堕殢鏈烘墦鏁?      const allNew = [...contentItems, ...memeItems]
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
    } catch (err) {
      console.error('鍔犺浇鍐呭澶辫触:', err)
    } finally {
      if (!silent) setLoading(false)
      setLoadingMore(false)
    }
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
        <div className="text-center"><div className="text-4xl mb-4">馃寠</div><div className="text-white/50 text-sm">鏆傛棤鍐呭</div></div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-black">
      <FeedContainer contents={contents} user={user} onMeme={(c) => setMemeTarget(c)} onLoadMore={handleLoadMore} loadingMore={loadingMore} />
      {memeTarget && (
        <MemeModal targetTitle={memeTarget.title} onClose={() => setMemeTarget(null)} onSuccess={async (meme) => {
          if (!user) return
          await createMeme({ type: meme.type, title: meme.title, content: meme.content, hashtags: meme.hashtags, source_content_id: memeTarget.id })
          setMemeTarget(null)
        }} />
      )}
    </div>
  )
}
