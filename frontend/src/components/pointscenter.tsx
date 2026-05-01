// ===== 积分中心 =====

import { useState } from 'react'
import { MOCK_USER, getLevelTitle, getLevelBadge, getLevelColor, getLevelProgress, SPEND_ACTIONS, EARN_RULES, LEVEL_TITLES, pointsForLevel } from '../lib/rewardSystem'

export default function PointsCenter({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'overview' | 'spend' | 'history' | 'levels'>('overview')
  const user = MOCK_USER
  const progress = getLevelProgress(user.points, user.level)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white px-5 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">积分中心</h2>
            <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {[{ key: 'overview' as const, label: '概览' }, { key: 'spend' as const, label: '使用' }, { key: 'history' as const, label: '记录' }, { key: 'levels' as const, label: '等级表' }].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>{t.label}</button>
            ))}
          </div>
        </div>
        <div className="p-5 overflow-y-auto max-h-[60vh]">
          {tab === 'overview' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-2xl p-5 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div><div className="flex items-center gap-2"><span className="text-3xl">{getLevelBadge(user.level)}</span><span className={`text-xl font-bold ${getLevelColor(user.level)}`}>{getLevelTitle(user.level)}</span></div><p className="text-white/50 text-xs mt-1">Lv.{user.level}</p></div>
                  <div className="text-right"><div className="text-2xl font-bold">{user.points}</div><p className="text-white/50 text-xs">当前积分</p></div>
                </div>
                <div className="mb-2"><div className="flex justify-between text-xs text-white/50 mb-1"><span>Lv.{user.level}</span><span>Lv.{user.level + 1}</span></div><div className="w-full bg-white/20 rounded-full h-2"><div className="bg-white rounded-full h-2 transition-all" style={{ width: `${progress.progress}%` }} /></div><p className="text-center text-xs text-white/50 mt-1">{user.points} / {progress.nextLevelPoints} 积分</p></div>
              </div>
              <div><h3 className="text-sm font-bold text-gray-900 mb-3">赚取积分</h3><div className="space-y-2">{EARN_RULES.map(r => <div key={r.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3"><span className="text-xl">{r.icon}</span><div className="flex-1"><div className="text-sm font-medium text-gray-900">{r.name}</div><div className="text-xs text-gray-400">{r.description}</div></div><span className="text-sm font-bold text-green-500">+{r.points}</span></div>)}</div></div>
            </div>
          )}
          {tab === 'spend' && (
            <div className="space-y-4">
              {[{ cat: 'promote' as const, label: '🌊 推广' }, { cat: 'boost' as const, label: '🚀 加速' }, { cat: 'feature' as const, label: '✨ 特权' }].map(group => (
                <div key={group.cat}><h3 className="text-sm font-bold text-gray-900 mb-3">{group.label}</h3><div className="space-y-2">{SPEND_ACTIONS.filter(a => a.category === group.cat).map(a => <div key={a.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100"><span className="text-xl">{a.icon}</span><div className="flex-1"><div className="text-sm font-medium text-gray-900">{a.name}</div><div className="text-xs text-gray-400">{a.description}</div></div><button className={`px-3 py-1.5 rounded-full text-xs font-medium ${user.points >= a.cost ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'}`} disabled={user.points < a.cost}>{a.cost} 积分</button></div>)}</div></div>
              ))}
            </div>
          )}
          {tab === 'history' && (
            <div className="space-y-2">
              {[{ type: 'earn', name: '推广内容', points: 10, time: '2小时前' }, { type: 'earn', name: '曝光奖励', points: 5, time: '5小时前' }, { type: 'spend', name: '发起小浪', points: -100, time: '1天前' }, { type: 'earn', name: '每日签到', points: 5, time: '1天前' }].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100"><span className="text-xl">{item.type === 'earn' ? '📈' : '📉'}</span><div className="flex-1"><div className="text-sm font-medium text-gray-900">{item.name}</div><div className="text-xs text-gray-400">{item.time}</div></div><span className={`text-sm font-bold ${item.type === 'earn' ? 'text-green-500' : 'text-red-500'}`}>{item.type === 'earn' ? '+' : ''}{item.points}</span></div>
              ))}
            </div>
          )}
          {tab === 'levels' && (
            <div className="space-y-2">
              {LEVEL_TITLES.map((l, i) => (
                <div key={i} className={`flex items-center gap-3 rounded-xl p-3 ${user.level >= l.min && user.level <= l.max ? 'bg-black text-white' : 'bg-gray-50'}`}>
                  <span className="text-xl">{getLevelBadge(l.min)}</span>
                  <div className="flex-1"><div className={`text-sm font-bold ${user.level >= l.min && user.level <= l.max ? 'text-white' : l.color}`}>{l.title}</div><div className={`text-xs ${user.level >= l.min && user.level <= l.max ? 'text-white/50' : 'text-gray-400'}`}>Lv.{l.min} - Lv.{l.max}</div></div>
                  <div className={`text-xs ${user.level >= l.min && user.level <= l.max ? 'text-white/50' : 'text-gray-400'}`}>{pointsForLevel(l.min)} 积分</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
