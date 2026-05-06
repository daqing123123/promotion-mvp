import React, { useState, useEffect, useCallback } from 'react'
import { getBlindBoxItems, openBlindBox, getBlindBoxHistory, getBlindBoxEffects, combineFragments, getFragments, getPointsBalance } from '../lib/api/client'
import BottomNav from '../components/BottomNav'

const RARITY_COLORS: Record<string, string> = {
  common: '#9e9e9e',
  uncommon: '#4caf50',
  rare: '#2196f3',
  epic: '#9c27b0',
  legendary: '#ff9800',
}

const RARITY_LABELS: Record<string, string> = {
  common: '普通',
  uncommon: '稀有',
  rare: '珍贵',
  epic: '史诗',
  legendary: '传说',
}

const FRAGMENT_INFO: Record<string, { icon: string; name: string; color: string }> = {
  star: { icon: '⭐', name: '星星碎片', color: '#ffd700' },
  moon: { icon: '🌙', name: '月亮碎片', color: '#90caf9' },
  sun: { icon: '☀️', name: '太阳碎片', color: '#ff9800' },
  diamond: { icon: '💠', name: '钻石碎片', color: '#00bcd4' },
}

export default function BlindBox() {
  const [items, setItems] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [effects, setEffects] = useState<any[]>([])
  const [fragments, setFragments] = useState<any[]>([])
  const [points, setPoints] = useState(0)
  const [opening, setOpening] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [showResult, setShowResult] = useState(false)
  const [tab, setTab] = useState<'box' | 'history' | 'fragments'>('box')
  const [combining, setCombining] = useState<string | null>(null)

  const COST = 30

  const loadData = useCallback(async () => {
    try {
      const [pts, boxItems, hist, eff, frags] = await Promise.all([
        getPointsBalance(),
        getBlindBoxItems(),
        getBlindBoxHistory(),
        getBlindBoxEffects(),
        getFragments(),
      ])
      setPoints(pts || 0)
      setItems(boxItems || [])
      setHistory(hist || [])
      setEffects(eff || [])
      setFragments(frags || [])
    } catch (e) {}
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleOpen = async () => {
    if (opening || points < COST) return
    setOpening(true)
    setShowResult(false)
    // 摇晃动画
    await new Promise(r => setTimeout(r, 1200))
    try {
      const res = await openBlindBox()
      setResult(res)
      setShowResult(true)
      setPoints(res.remaining_points)
      loadData()
    } catch (e: any) {
      alert(e.message || '开盒失败')
    }
    setOpening(false)
  }

  const handleCombine = async (fragType: string) => {
    setCombining(fragType)
    try {
      const res = await combineFragments(fragType)
      alert(res.message)
      loadData()
    } catch (e: any) {
      alert(e.message || '合成失败')
    }
    setCombining(null)
  }

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.rarity]) acc[item.rarity] = []
    acc[item.rarity].push(item)
    return acc
  }, {} as Record<string, any[]>)

  const rarityOrder = ['legendary', 'epic', 'rare', 'uncommon', 'common']

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#fff', paddingBottom: 80 }}>
      {/* 顶部 */}
      <div style={{ padding: '16px 16px 0', textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>🎁 盲盒中心</h1>
        <p style={{ color: '#aaa', fontSize: 13, margin: '4px 0 0' }}>
          💰 余额: <b style={{ color: '#ffd700' }}>{points}</b> 积分
          {points >= COST && <span> · 还能开 <b style={{ color: '#ff9800' }}>{Math.floor(points / COST)}</b> 次</span>}
        </p>
        {effects.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
            {effects.map((e: any) => (
              <span key={e.id} style={{ background: 'rgba(255,215,0,0.15)', padding: '2px 10px', borderRadius: 12, fontSize: 12, color: '#ffd700' }}>
                {JSON.parse(e.effect_data || '{}').icon} {JSON.parse(e.effect_data || '{}').title}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 开盒区域 */}
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <div
          onClick={handleOpen}
          style={{
            width: 160, height: 160, margin: '0 auto', borderRadius: 20,
            background: 'linear-gradient(135deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: points >= COST && !opening ? 'pointer' : 'not-allowed',
            opacity: points >= COST && !opening ? 1 : 0.6,
            animation: opening ? 'shake 0.2s infinite' : 'float 3s ease-in-out infinite',
            transition: 'transform 0.2s',
            boxShadow: '0 0 40px rgba(255,107,107,0.3)',
          }}
          onMouseEnter={e => { if (points >= COST && !opening) e.currentTarget.style.transform = 'scale(1.05)' }}
          onMouseLeave={e => { if (points >= COST && !opening) e.currentTarget.style.transform = 'scale(1)' }}
        >
          <span style={{ fontSize: 64, filter: opening ? 'blur(2px)' : 'none' }}>
            {opening ? '❓' : '🎁'}
          </span>
        </div>

        {opening && (
          <p style={{ color: '#ffd93d', marginTop: 12, animation: 'pulse 0.5s infinite' }}>
            正在开启中... ✨
          </p>
        )}
        {!opening && !showResult && (
          <p style={{ color: '#aaa', marginTop: 12, fontSize: 13 }}>
            {points >= COST
              ? `点击盲盒，消耗 ${COST} 积分开启！`
              : `需要 ${COST} 积分才能开，快去赚积分吧！`}
          </p>
        )}

        {/* 开盒结果 */}
        {showResult && result && (
          <div style={{
            marginTop: 16, padding: 20, borderRadius: 16,
            background: `linear-gradient(135deg, ${RARITY_COLORS[result.box.rarity]}22, ${RARITY_COLORS[result.box.rarity]}08)`,
            border: `2px solid ${RARITY_COLORS[result.box.rarity]}44`,
            animation: 'slideUp 0.5s ease-out',
          }}>
            <div style={{ fontSize: 48 }}>{result.box.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', marginTop: 4, color: RARITY_COLORS[result.box.rarity] }}>
              {RARITY_LABELS[result.box.rarity]} · {result.box.title}
            </div>
            <div style={{ fontSize: 13, color: '#aaa', marginTop: 4 }}>{result.box.description}</div>
            {result.points_earned > 0 && (
              <div style={{ marginTop: 8, color: '#ffd700', fontWeight: 'bold', fontSize: 16 }}>
                +{result.points_earned} 积分！
              </div>
            )}
            {result.effect && (
              <div style={{ marginTop: 8, color: '#4d96ff', fontSize: 14 }}>
                ✨ 获得特效: {result.effect.title}
              </div>
            )}
            {result.fragment && (
              <div style={{ marginTop: 8, color: '#ff9800', fontSize: 14 }}>
                🧩 获得碎片: {result.fragment.icon} {result.fragment.title}
              </div>
            )}
            {result.surprise && (
              <div style={{ marginTop: 8, color: '#aaa', fontSize: 14 }}>
                {result.surprise.icon} {result.surprise.title}
                {result.surprise.description && <div style={{ fontSize: 12, marginTop: 2 }}>{result.surprise.description}</div>}
              </div>
            )}
            <button
              onClick={() => setShowResult(false)}
              style={{
                marginTop: 12, padding: '8px 24px', borderRadius: 20,
                background: RARITY_COLORS[result.box.rarity], color: '#fff',
                border: 'none', fontSize: 14, cursor: 'pointer',
              }}
            >
              再来一次！
            </button>
          </div>
        )}
      </div>

      {/* 标签切换 */}
      <div style={{ display: 'flex', gap: 0, margin: '0 16px', borderRadius: 12, overflow: 'hidden', background: '#1a1a2e' }}>
        {(['box', 'fragments', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '10px 0', border: 'none', fontSize: 14, cursor: 'pointer',
              background: tab === t ? '#2a2a4e' : 'transparent',
              color: tab === t ? '#ffd700' : '#888',
              fontWeight: tab === t ? 'bold' : 'normal',
              transition: 'all 0.2s',
            }}
          >
            {t === 'box' ? '🎁 奖品池' : t === 'fragments' ? '🧩 碎片合成' : '📋 开盒记录'}
          </button>
        ))}
      </div>

      {/* 奖品池 */}
      {tab === 'box' && (
        <div style={{ padding: '12px 16px' }}>
          {rarityOrder.map(rarity => {
            const groupItems = groupedItems[rarity]
            if (!groupItems || groupItems.length === 0) return null
            return (
              <div key={rarity} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 'bold', color: RARITY_COLORS[rarity], marginBottom: 8 }}>
                  {RARITY_LABELS[rarity]} ({groupItems.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {groupItems.map((item: any) => (
                    <div key={item.id} style={{
                      padding: '8px 12px', borderRadius: 10, fontSize: 13,
                      background: `${RARITY_COLORS[rarity]}15`,
                      border: `1px solid ${RARITY_COLORS[rarity]}33`,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span style={{ fontSize: 20 }}>{item.icon}</span>
                      <span>{item.title || item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 碎片合成 */}
      {tab === 'fragments' && (
        <div style={{ padding: '12px 16px' }}>
          {fragments.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888', padding: 40 }}>
              🧩 还没有碎片，开盲盒有概率获得！
            </p>
          ) : (
            Object.entries(FRAGMENT_INFO).map(([key, info]) => {
              const frag = fragments.find((f: any) => f.fragment_type === key)
              const qty = frag?.quantity || 0
              return (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderRadius: 12, marginBottom: 8,
                  background: qty >= 3 ? `${info.color}15` : '#1a1a2e',
                  border: `1px solid ${qty >= 3 ? info.color : '#333'}44`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 28 }}>{info.icon}</span>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{info.name}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>
                        持有: <b style={{ color: info.color }}>{qty}</b>/3
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCombine(key)}
                    disabled={qty < 3 || combining === key}
                    style={{
                      padding: '6px 16px', borderRadius: 16, border: 'none', fontSize: 13,
                      cursor: qty >= 3 && combining !== key ? 'pointer' : 'not-allowed',
                      background: qty >= 3 ? info.color : '#333',
                      color: '#fff', opacity: combining === key ? 0.6 : 1,
                    }}
                  >
                    {combining === key ? '合成中...' : '合成'}
                  </button>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* 开盒历史 */}
      {tab === 'history' && (
        <div style={{ padding: '12px 16px' }}>
          {history.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888', padding: 40 }}>
              📋 还没有开盒记录，快去试试手气！
            </p>
          ) : (
            history.map((h: any) => (
              <div key={h.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10, marginBottom: 6,
                background: '#1a1a2e',
              }}>
                <span style={{ fontSize: 28 }}>{h.box_icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14 }}>{h.box_title}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>
                    {new Date(h.opened_at).toLocaleString('zh-CN')}
                  </div>
                </div>
                {h.points_earned > 0 && (
                  <span style={{ color: '#ffd700', fontWeight: 'bold' }}>+{h.points_earned}</span>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 动画样式 */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-8deg) scale(1.05); }
          75% { transform: rotate(8deg) scale(1.05); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <BottomNav />
    </div>
  )
}
