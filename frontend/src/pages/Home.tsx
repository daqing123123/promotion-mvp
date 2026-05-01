import { useState, useRef, useCallback, useEffect } from 'react'
import { type RecommendableItem, CATEGORY_INFO, calcRecommendScore } from '../lib/recommendation'
import { getWaveInfo } from '../lib/wave'
import { makeFeedBatch, makeBlindBox } from '../lib/mockData'

type UserProfile = { id: string; name: string; username: string; avatar: string; bio: string; tags: string[]; points: number }

const RARITY: Record<string, { label: string; color: string; bg: string }> = {
  common: { label: '普通', color: 'text-gray-400', bg: 'bg-gray-500/10' },
  rare: { label: '稀有', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  epic: { label: '史诗', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  legendary: { label: '传说', color: 'text-amber-400', bg: 'bg-amber-500/10' },
}

const BG_GRADIENTS = [
  'from-gray-900 via-gray-800 to-black', 'from-slate-900 via-slate-800 to-gray-900',
  'from-zinc-900 via-zinc-800 to-neutral-900', 'from-stone-900 via-stone-800 to-gray-900',
  'from-neutral-900 via-neutral-800 to-zinc-900',
]

const rand = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]

export default function Home({ user, setUser: _setUser, isMobile }: { user: UserProfile | null; setUser: any; isMobile: boolean }) {
  const [items, setItems] = useState<RecommendableItem[]>(() => makeFeedBatch(20))
  const [page, setPage] = useState(1)
  const [idx, setIdx] = useState(0)
  const [liked, setLiked] = useState<Set<string>>(new Set())
  const [promoted, setPromoted] = useState<Set<string>>(new Set())
  const [openedBoxes, setOpenedBoxes] = useState<Set<string>>(new Set())
  const [opening, setOpening] = useState(false)
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; c: string }>>([])
  const [totalOpens, setTotalOpens] = useState(47)
  const [totalPromotes, setTotalPromotes] = useState(12)
  const [loading, setLoading] = useState(false)
  const [loginPrompt, setLoginPrompt] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [streak] = useState(3)
  const pId = useRef(0)
  const tY0 = useRef(0)
  const tY1 = useRef(0)

  const TITLES = [
    { name: '萌新探员', icon: '🔍', min: 0 },
    { name: '初级星探', icon: '⭐', min: 10 },
    { name: '内容猎手', icon: '🎯', min: 50 },
    { name: '爆款推手', icon: '🔥', min: 100 },
    { name: '发现大师', icon: '💎', min: 200 },
    { name: '传奇星探', icon: '👑', min: 500 },
  ]
  const title = (() => { for (let i = TITLES.length - 1; i >= 0; i--) if (totalOpens >= TITLES[i].min) return TITLES[i]; return TITLES[0] })()
  const nxt = (() => { for (const t of TITLES) if (totalOpens < t.min) return t; return null })()

  const spawnP = useCallback((rarity: string) => {
    const colors: Record<string, string[]> = { common: ['#6b7280'], rare: ['#3b82f6'], epic: ['#a855f7'], legendary: ['#f59e0b'] }
    const arr = Array.from({ length: rarity === 'legendary' ? 25 : rarity === 'epic' ? 15 : 8 }, () => ({
      id: pId.current++, x: 50 + (Math.random() - 0.5) * 60, y: 50 + (Math.random() - 0.5) * 40, c: rand(colors[rarity] || colors.common) }))
    setParticles(p => [...p, ...arr]); setTimeout(() => setParticles(p => p.filter(x => !arr.find(a => a.id === x.id))), 1500)
  }, [])

  const openBox = useCallback(() => {
    if (opening) return; const item = items[idx]; if (!item?.isBlindBox || openedBoxes.has(item.id)) return
    setOpening(true); setTimeout(() => { setOpenedBoxes(p => new Set([...p, item.id])); setOpening(false); setTotalOpens(p => p + 1); spawnP(item.rarity) }, 800)
  }, [opening, items, idx, openedBoxes, spawnP])

  const doLike = useCallback((id: string) => {
    if (!user) { setLoginPrompt(true); return }
    setLiked(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  }, [user])

  const doPromote = useCallback((id: string) => {
    if (!user) { setLoginPrompt(true); return }; if (promoted.has(id)) return
    setPromoted(p => new Set([...p, id])); setTotalPromotes(p => p + 1); spawnP('rare')
  }, [user, promoted, spawnP])

  const onTouch = (e: React.TouchEvent) => { tY0.current = e.touches[0].clientY }
  const onMove = (e: React.TouchEvent) => { tY1.current = e.touches[0].clientY }
  const onEnd = () => { const d = tY0.current - tY1.current; if (Math.abs(d) > 50) setIdx(p => d > 0 ? Math.min(p + 1, items.length - 1) : Math.max(p - 1, 0)) }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); openBox() }
      if (e.key === 'ArrowDown' || e.key === 'j') setIdx(p => Math.min(p + 1, items.length - 1))
      if (e.key === 'ArrowUp' || e.key === 'k') setIdx(p => Math.max(p - 1, 0))
    }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [openBox, items.length])

  useEffect(() => {
    if (idx < items.length - 3 || loading) return
    setLoading(true); setTimeout(() => { setItems(p => [...p, ...makeFeedBatch(20)]); setPage(p => p + 1); setLoading(false) }, 300)
  }, [idx, items.length, loading, page])

  // ===== 渲染单个内容 =====
  const renderItem = (item: RecommendableItem, i: number) => {
    const active = i === idx
    const isBox = !!item.isBlindBox
    const isOpened = openedBoxes.has(item.id)
    const isPromo = !!item.promoTopic
    const isLiked = liked.has(item.id)
    const isPromoted = promoted.has(item.id)
    const rc = RARITY[item.rarity]
    const cat = CATEGORY_INFO[item.category]
    const bg = BG_GRADIENTS[i % BG_GRADIENTS.length]
    const score = calcRecommendScore(item, null)

    // 盲盒未拆
    if (isBox && !isOpened) {
      return (
        <div key={item.id} className="h-screen w-full relative snap-start snap-always flex items-center justify-center">
          <div className={`absolute inset-0 bg-gradient-to-b ${bg}`} /><div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10 text-center">
            <button onClick={() => { if (active) openBox() }} className={active ? 'cursor-pointer' : 'cursor-default'}>
              <div className={`w-44 h-52 rounded-3xl relative overflow-hidden mx-auto bg-gradient-to-br from-white/10 to-white/5 border border-white/20 backdrop-blur-sm ${active ? 'animate-float' : ''}`}>
                <div className="absolute inset-0 flex items-center justify-center"><span className="text-6xl">❓</span></div>
                {active && <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10 animate-shimmer" />}
              </div>
            </button>
            {active && <div className="mt-6 text-white/70 text-sm font-medium">点击拆开盲盒</div>}
            <div className="mt-2 text-white/30 text-xs">可能是电影、书籍、产品、人物...</div>
          </div>
        </div>
      )
    }

    // 盲盒开盒中
    if (isBox && opening && active) {
      return (
        <div key={item.id} className="h-screen w-full relative snap-start snap-always flex items-center justify-center">
          <div className={`absolute inset-0 bg-gradient-to-b ${bg}`} />
          <div className="relative z-10 w-44 h-52 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 animate-box-open flex items-center justify-center">
            <span className="text-6xl animate-spin-slow">✨</span>
          </div>
        </div>
      )
    }

    // 推广话题
    if (isPromo && item.promoTopic) {
      const p = item.promoTopic
      const wave = getWaveInfo(p.totalExposure)
      const isBoosted = promoted.has(item.id)

      if (isMobile) {
        return (
          <div key={item.id} className="h-screen w-full relative snap-start snap-always">
            <div className="absolute inset-0 bg-gradient-to-b from-orange-950/80 via-gray-900 to-red-950/80" /><div className="absolute inset-0 bg-black/20" />
            <div className="relative z-10 h-full flex flex-col justify-center px-6">
              <div className="max-w-lg mx-auto w-full">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-full">{wave.icon} {wave.name}</span>
                  <span className="px-2 py-0.5 bg-white/10 text-white/50 text-xs rounded-full">{cat.icon} {cat.label}</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">{p.targetName}</h2>
                <p className="text-base text-white/60 mb-6">{p.targetDesc}</p>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 text-center"><div className="text-xl font-bold text-orange-400">{p.promoterCount}</div><div className="text-[10px] text-white/40">帮推</div></div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 text-center"><div className="text-xl font-bold text-blue-400">{p.totalExposure.toLocaleString()}</div><div className="text-[10px] text-white/40">曝光</div></div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 text-center"><div className="text-xl font-bold text-green-400">{p.rewardPool}</div><div className="text-[10px] text-white/40">奖池</div></div>
                </div>
                <button onClick={() => doPromote(item.id)} disabled={isBoosted}
                  className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${isBoosted ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white text-black hover:bg-white/90 active:scale-[0.98]'}`}>
                  {isBoosted ? '✅ 已帮推' : '🔥 一键帮推'}
                </button>
                <div className="mt-3 text-center text-xs text-white/30">{p.createdBy} 发起 · 帮推 +50曝光 +10积分</div>
              </div>
            </div>
          </div>
        )
      }

      // 桌面端推广话题
      return (
        <div key={item.id} className="h-screen w-full relative snap-start snap-always flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-950/80 via-gray-900 to-red-950/80" /><div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10 flex-1 h-full flex flex-col justify-end p-10 pb-20">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-full">{wave.icon} {wave.name}</span>
              <span className="px-2 py-0.5 bg-white/10 text-white/50 text-xs rounded-full">{cat.icon} {cat.label}</span>
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">{p.targetName}</h2>
            <p className="text-base text-white/60 mb-5">{p.targetDesc}</p>
            <div className="flex gap-3 mb-5">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl px-4 py-2 text-center"><div className="text-lg font-bold text-orange-400">{p.promoterCount}</div><div className="text-[10px] text-white/40">帮推</div></div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl px-4 py-2 text-center"><div className="text-lg font-bold text-blue-400">{p.totalExposure.toLocaleString()}</div><div className="text-[10px] text-white/40">曝光</div></div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl px-4 py-2 text-center"><div className="text-lg font-bold text-green-400">{p.rewardPool}</div><div className="text-[10px] text-white/40">奖池</div></div>
            </div>
            <button onClick={() => doPromote(item.id)} disabled={isBoosted}
              className={`px-8 py-3 rounded-2xl font-bold text-sm transition-all ${isBoosted ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white text-black hover:bg-white/90 active:scale-[0.98]'}`}>
              {isBoosted ? '✅ 已帮推' : '🔥 一键帮推'}
            </button>
            <div className="mt-2 text-xs text-white/30">{p.createdBy} 发起 · 推荐分 {score.toFixed(0)}</div>
          </div>
        </div>
      )
    }

    // 普通内容 / 已拆盲盒
    if (isMobile) {
      return (
        <div key={item.id} className="h-screen w-full relative snap-start snap-always">
          <div className={`absolute inset-0 bg-gradient-to-b ${bg}`} /><div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10 h-full flex flex-col justify-center px-6">
            <div className="max-w-lg mx-auto w-full">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{cat.icon}</span>
                <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded-full">{cat.label}</span>
                {(isBox || item.rarity !== 'common') && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${rc.bg} ${rc.color}`}>
                    {item.rarity === 'legendary' ? '👑' : item.rarity === 'epic' ? '💜' : item.rarity === 'rare' ? '💙' : '⚪'}{rc.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-2xl border border-white/20">{item.creator.avatar}</div>
                <div>
                  <div className="flex items-center gap-2"><span className="font-bold text-white">{item.creator.name}</span><span className="text-[10px] text-white/40 bg-white/10 px-1.5 py-0.5 rounded">Lv.{item.creator.level}</span></div>
                  <div className="text-xs text-white/40">{item.stats.views.toLocaleString()} 人看过</div>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 mb-4">
                <h2 className="text-2xl font-bold text-white mb-2">{item.title}</h2>
                <p className="text-sm text-white/50 leading-relaxed">{item.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {item.tags.map(tag => <span key={tag} className="px-2 py-0.5 bg-white/10 text-white/40 text-[11px] rounded-full">#{tag}</span>)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => doLike(item.id)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-medium transition-all ${isLiked ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/10 text-white/70 hover:bg-white/15'}`}>
                  <span>{isLiked ? '❤️' : '🤍'}</span><span>{isLiked ? '已赞' : '点赞'}</span>
                </button>
                <button onClick={() => doPromote(item.id)} disabled={isPromoted} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-all ${isPromoted ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white text-black hover:bg-white/90 active:scale-[0.98]'}`}>
                  <span>{isPromoted ? '✅' : '🔥'}</span><span>{isPromoted ? '已帮推' : '帮TA火'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // 桌面端普通内容
    return (
      <div key={item.id} className="h-screen w-full relative snap-start snap-always flex items-center justify-center">
        <div className={`absolute inset-0 bg-gradient-to-b ${bg}`} /><div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex-1 h-full flex flex-col justify-end p-10 pb-20">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{cat.icon}</span>
            <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded-full">{cat.label}</span>
            {(isBox || item.rarity !== 'common') && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${rc.bg} ${rc.color}`}>
                {item.rarity === 'legendary' ? '👑' : item.rarity === 'epic' ? '💜' : item.rarity === 'rare' ? '💙' : '⚪'}{rc.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-xl border border-white/20">{item.creator.avatar}</div>
            <div>
              <div className="flex items-center gap-2"><span className="font-bold text-white">{item.creator.name}</span><span className="text-[10px] text-white/40 bg-white/10 px-1.5 py-0.5 rounded">Lv.{item.creator.level}</span></div>
              <div className="text-xs text-white/40">{item.stats.views.toLocaleString()} 人看过 · 推荐分 {score.toFixed(0)}</div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">{item.title}</h2>
          <p className="text-sm text-white/50 leading-relaxed mb-3">{item.description}</p>
          <div className="flex flex-wrap gap-1.5">{item.tags.map(tag => <span key={tag} className="px-2 py-0.5 bg-white/10 text-white/40 text-[11px] rounded-full">#{tag}</span>)}</div>
        </div>
        <div className="relative z-10 flex flex-col items-center gap-5 mr-12">
          <button onClick={() => doLike(item.id)} className="flex flex-col items-center gap-1 group">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${isLiked ? 'bg-red-500/20' : 'bg-white/10 hover:bg-white/15'}`}>{isLiked ? '❤️' : '🤍'}</div>
            <span className={`text-[10px] ${isLiked ? 'text-red-400' : 'text-white/50'}`}>{item.stats.likes + (isLiked ? 1 : 0)}</span>
          </button>
          <button onClick={() => doPromote(item.id)} disabled={isPromoted} className="flex flex-col items-center gap-1 group">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${isPromoted ? 'bg-green-500/20' : 'bg-white/10 hover:bg-white/15'}`}>{isPromoted ? '✅' : '🔥'}</div>
            <span className={`text-[10px] ${isPromoted ? 'text-green-400' : 'text-white/50'}`}>{item.stats.promotes + (isPromoted ? 1 : 0)}</span>
          </button>
          <button className="flex flex-col items-center gap-1 group">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl hover:bg-white/15 transition-all">💬</div>
            <span className="text-[10px] text-white/50">{item.stats.comments}</span>
          </button>
          <button className="flex flex-col items-center gap-1 group">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl hover:bg-white/15 transition-all">⭐</div>
            <span className="text-[10px] text-white/50">{item.stats.favorites}</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black min-h-screen">
      <div className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth" onTouchStart={onTouch} onTouchMove={onMove} onTouchEnd={onEnd}>
        <div className="fixed inset-0 pointer-events-none z-50">
          {particles.map(p => <div key={p.id} className="absolute w-2 h-2 rounded-full" style={{ left: `${p.x}%`, top: `${p.y}%`, backgroundColor: p.c, animation: 'particle-fly 1.5s ease-out forwards' }} />)}
        </div>

        <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <div className={`mx-auto px-6 pt-3 pb-6 flex items-center justify-between pointer-events-auto ${isMobile ? 'max-w-lg' : 'w-full'}`}>
            <h1 className="text-xl font-bold text-white tracking-tight">巨浪</h1>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowInfo(true)} className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 hover:bg-white/15 transition-colors">
                <span className="text-sm">{title.icon}</span>
                <span className="text-xs font-medium text-white">{title.name}</span>
              </button>
            </div>
          </div>
        </header>

        {items.map((item, i) => renderItem(item, i))}

        {loading && <div className="h-screen flex items-center justify-center"><div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" /></div>}
      </div>

      <div className={`fixed left-0 right-0 z-40 pointer-events-none ${isMobile ? 'bottom-16' : 'bottom-14'}`}>
        <div className={`mx-auto px-6 flex items-center justify-between ${isMobile ? 'max-w-lg' : 'w-full'}`}>
          <span className="text-[11px] text-white/30">{idx + 1} / ∞ · 推荐分 {items[idx] ? calcRecommendScore(items[idx], null).toFixed(0) : '-'}</span>
          <span className="text-[11px] text-white/30">🔥 {totalPromotes} · 📦 {totalOpens}</span>
        </div>
      </div>

      {/* 信息面板 */}
      {showInfo && (
        <div className="fixed inset-0 z-50" onClick={() => setShowInfo(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-gray-900 shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">称号 & 成就</h3>
                <button onClick={() => setShowInfo(false)} className="text-white/40 hover:text-white text-xl">✕</button>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-4xl">{title.icon}</div>
                  <div><div className="text-lg font-bold text-white">{title.name}</div><div className="text-sm text-white/50">已拆 {totalOpens} · 帮推 {totalPromotes} · 连续 {streak} 天</div></div>
                </div>
                {nxt && <div><div className="flex justify-between text-xs text-white/40 mb-1"><span>距离「{nxt.name}」</span><span>{totalOpens}/{nxt.min}</span></div><div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-white rounded-full" style={{ width: `${Math.min(100, (totalOpens / nxt.min) * 100)}%` }} /></div></div>}
              </div>
              <div className="space-y-2">
                {TITLES.map((t, i) => { const has = totalOpens >= t.min; const cur = title.name === t.name; return (
                  <div key={i} className={`p-3 rounded-xl flex items-center gap-3 ${cur ? 'bg-white/10' : has ? 'bg-white/5' : 'bg-white/5 opacity-40'}`}>
                    <span className="text-xl">{t.icon}</span>
                    <div className="flex-1"><div className="text-sm font-semibold text-white">{t.name}</div><div className="text-[10px] text-white/40">{t.min} 盒</div></div>
                    {cur && <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">当前</span>}
                    {has && !cur && <span className="text-green-400 text-xs">✓</span>}
                  </div>
                )})}
              </div>
            </div>
          </div>
        </div>
      )}

      {loginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={() => setLoginPrompt(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-1">需要登录</h3>
            <p className="text-sm text-gray-500 mb-5">登录后才能帮推和点赞</p>
            <a href="/login" className="block w-full py-3 bg-black text-white rounded-2xl text-center font-semibold">去登录</a>
            <button onClick={() => setLoginPrompt(false)} className="w-full py-2 text-gray-400 text-sm mt-1">先看看</button>
          </div>
        </div>
      )}
    </div>
  )
}
