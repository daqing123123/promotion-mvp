// @ts-nocheck
// ===== 鎺ㄥ箍骞垮満 鈥?鐪熷疄鏁版嵁鐗?=====

import { useState, useEffect } from 'react'
import { getContents, getMemes, getPromoteHistory, promoteContent, toggleLikeWithPoints } from '../lib/api/client'
import { getLevelTitle, getLevelBadge, getLevelColor, SPEND_ACTIONS } from '../lib/rewardSystem'
import { checkAndUnlockAchievements } from '../lib/achievements'
import PointsCenter from '../components/PointsCenter'
import { toast } from '../lib/toast'

interface PromoteProps {
  user: any
  setUser: (user: any) => void
  isMobile: boolean
}

export default function Promote({ user, setUser, isMobile: _isMobile }: PromoteProps) {
  const [showPoints, setShowPoints] = useState(false)
  const [filter, setFilter] = useState<'all' | 'hot' | 'new' | 'ending'>('all')
  const [promotableItems, setPromotableItems] = useState<any[]>([])
  const [myPromotes, setMyPromotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [promotingId, setPromotingId] = useState<string | null>(null)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})

  const userData = user || { level: 1, points: 0 }

  useEffect(() => {
    if (user?.id) {
      loadData()
    } else {
      loadPublicData()
    }
  }, [user?.id])

  const loadPublicData = async () => {
    setLoading(true)
    try {
      const [contents, memes] = await Promise.all([
        getContents(20, 0, 'published'),
        getMemes({ status: 'published', limit: 20 }),
      ])

      const items = [
        ...(contents || []).map((c: any) => ({ ...c, _source: 'contents' })),
        ...(memes || []).map((m: any) => ({ ...m, _source: 'memes', type: 'meme' })),
      ].sort(() => Math.random() - 0.5)

      setPromotableItems(items)
    } catch {}
    setLoading(false)
  }

  const loadData = async () => {
    setLoading(true)
    await Promise.all([loadPublicData(), loadMyPromotes()])
    setLoading(false)
  }

  const loadMyPromotes = async () => {
    if (!user?.id) return
    try {
      const history = await getPromoteHistory(20)
      setMyPromotes(history)
    } catch {
      // ignore
    }
  }

  const handlePromote = async (itemId: string, source: string) => {
    if (!user?.id) { toast.warning('璇峰厛鐧诲綍'); return }
    setPromotingId(itemId)
    try {
      if (source !== 'contents') {
        toast.info('甯帹浠呮敮鎸佸唴瀹?)
        return
      }
      const result = await promoteContent(user.id, itemId)
      setPromotableItems(prev => prev.map(item =>
        item.id === itemId
          ? { ...item, promote_count: (item.promote_count || 0) + 1 }
          : item
      ))
      if (setUser && result.points) {
        setUser((prev: any) => prev ? { ...prev, points: result.points.points, level: result.points.level } : prev)
      }
      toast.success('馃敟 甯帹鎴愬姛 +20绉垎')
      checkAndUnlockAchievements(user.id).catch(() => {})
    } catch (e: any) {
      if (e.message === '宸茬粡甯帹杩囪鍐呭') {
        toast.info('宸茬粡甯帹杩囪鍐呭')
      } else {
        toast.error(e.message || '甯帹澶辫触')
      }
    } finally {
      setPromotingId(null)
    }
  }

  const handleLike = async (itemId: string, source: string) => {
    if (!user?.id) { toast.warning('璇峰厛鐧诲綍'); return }
    const targetType = source === 'memes' ? 'meme' : 'content'
    const wasLiked = likedIds.has(itemId)
    const delta = wasLiked ? -1 : 1
    setLikedIds(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
    setLikeCounts(prev => ({ ...prev, [itemId]: (prev[itemId] ?? 0) + delta }))
    try {
      await toggleLikeWithPoints(targetType, itemId)
      if (!wasLiked) toast.points(5)
    } catch {
      setLikedIds(prev => {
        const next = new Set(prev)
        if (next.has(itemId)) next.delete(itemId)
        else next.add(itemId)
        return next
      })
      setLikeCounts(prev => ({ ...prev, [itemId]: (prev[itemId] ?? 0) - delta }))
    }
  }

  const filteredItems = promotableItems.filter(item => {
    if (filter === 'all') return true
    if (filter === 'hot') return (item.like_count || 0) > 100
    if (filter === 'new') return true
    if (filter === 'ending') return false
    return true
  })

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* 绛夌骇鍗＄墖 */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-700 px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl">{getLevelBadge(userData.level)}</span>
              <span className={`text-xl font-bold ${getLevelColor(userData.level)}`}>
                {getLevelTitle(userData.level)}
              </span>
            </div>
            <p className="text-white/50 text-xs mt-1">Lv.{userData.level}</p>
          </div>
          <button
            onClick={() => setShowPoints(true)}
            className="px-4 py-2 bg-white/20 text-white rounded-full text-sm"
          >
            {userData.points} 绉垎
          </button>
        </div>

        {/* 蹇嵎鎿嶄綔 */}
        <div className="grid grid-cols-4 gap-3">
          {SPEND_ACTIONS.slice(0, 4).map(action => (
            <button
              key={action.id}
              className="flex flex-col items-center gap-1 bg-white/10 rounded-xl p-3"
            >
              <span className="text-xl">{action.icon}</span>
              <span className="text-white text-[10px]">{action.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 绛涢€?*/}
      <div className="px-5 py-3 bg-white border-b border-gray-100 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {[
            { key: 'all' as const, label: '鍏ㄩ儴' },
            { key: 'hot' as const, label: '馃敟 鐑棬' },
            { key: 'new' as const, label: '馃啎 鏈€鏂? },
            { key: 'ending' as const, label: '鈴?鍗冲皢缁撴潫' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === f.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 鎴戠殑甯帹璁板綍 */}
      {user?.id && myPromotes.length > 0 && (
        <div className="px-5 pt-4">
          <h2 className="text-sm font-bold text-gray-900 mb-3">馃摙 鎴戠殑甯帹 ({myPromotes.length})</h2>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {myPromotes.slice(0, 5).map((p: any) => (
              <div key={p.id} className="shrink-0 bg-white rounded-xl p-3 border border-gray-100 min-w-[140px]">
                <div className="text-xs text-gray-400 mb-1">{p.contents?.type || '鍐呭'}</div>
                <div className="text-sm font-medium text-gray-900 truncate">{p.contents?.title || '宸插府鎺ㄥ唴瀹?}</div>
                <div className="text-xs text-green-600 mt-1">+{p.points_earned} 绉垎</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 鎺ㄥ箍鍒楄〃 */}
      <div className="p-5 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="h-4 w-16 bg-gray-100 rounded mb-2" />
                <div className="h-5 w-3/4 bg-gray-100 rounded mb-2" />
                <div className="h-3 w-1/2 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">鏆傛棤鍙府鎺ㄧ殑鍐呭</div>
        ) : (
          filteredItems.map(item => {
            const isMeme = item._source === 'memes'
            const title = isMeme ? (item.title || item.content?.substring(0, 30)) : item.title
            const description = isMeme ? item.content : item.description
            const isLiked = likedIds.has(item.id)
            const displayLikeCount = (likeCounts[item.id] ?? item.like_count) || 0

            return (
              <div key={item.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-600">
                    {isMeme ? '馃幁 娈靛瓙' : item.type}
                  </span>
                  {(item.like_count || 0) > 100 && (
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-red-100 text-red-600">
                      馃敟 鐑棬
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-2">{title}</h3>
                {description && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>馃憗 {item.view_count || 0}</span>
                    <button
                      onClick={() => handleLike(item.id, item._source)}
                      className="flex items-center gap-1 active:scale-95 transition-transform"
                    >
                      <span>{isLiked ? '鉂わ笍' : '馃'}</span>
                      <span>{displayLikeCount}</span>
                    </button>
                    <button
                      onClick={() => window.location.href = `/content/${item.id}`}
                      className="flex items-center gap-1 active:scale-95 transition-transform"
                    >
                      <span>馃挰</span>
                      <span>{item.comment_count || 0}</span>
                    </button>
                  </div>
                  {!isMeme && (
                    <button
                      onClick={() => handlePromote(item.id, item._source)}
                      disabled={promotingId === item.id}
                      className="px-4 py-1.5 bg-black text-white text-xs rounded-full active:scale-[0.95] transition-transform"
                    >
                      {promotingId === item.id ? '...' : '甯帹'}
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 绉垎涓績寮圭獥 */}
      {showPoints && <PointsCenter onClose={() => setShowPoints(false)} />}
    </div>
  )
}
