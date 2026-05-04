// ===== 绉垎涓績锛堢湡瀹炴暟鎹増锛?=====

import { useState, useEffect, useCallback } from 'react'
import { getPointsHistory, getPointsBalance } from '../lib/api/client'
import { getLevelTitle, getLevelBadge, getLevelColor } from '../lib/rewardSystem'

interface PointsProps {
  user: any
}

export default function Points({ user }: PointsProps) {
  const [activeTab, setActiveTab] = useState<'earn' | 'spend' | 'history' | 'level'>('earn')
  const [pointsBalance, setPointsBalance] = useState(0)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadPointsData = useCallback(async () => {
    if (!user) return
    try {
      const [balance, historyData] = await Promise.all([
        getPointsBalance(user.id),
        getPointsHistory(user.id, 50),
      ])
      setPointsBalance(balance)
      setHistory(historyData)
    } catch (err) {
      console.error('鍔犺浇绉垎鏁版嵁澶辫触:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadPointsData()
  }, [loadPointsData])

  const currentLevel = user?.level || 1

  const earnRules = [
    { id: '1', action: '姣忔棩绛惧埌', points: '+10', icon: '馃搮', desc: '姣忓ぉ绛惧埌鑾峰緱绉垎' },
    { id: '2', action: '鍙戝竷鍐呭', points: '+10', icon: '馃摑', desc: '姣忓彂甯冧竴鏉″唴瀹? },
    { id: '3', action: '鐐硅禐', points: '+5', icon: '鉂わ笍', desc: '姣忔鐐硅禐鑾峰緱绉垎' },
    { id: '4', action: '甯帹鍐呭', points: '+20', icon: '馃殌', desc: '姣忔甯帹鑾峰緱绉垎' },
    { id: '5', action: '璇勮', points: '+5', icon: '馃挰', desc: '姣忔璇勮鑾峰緱绉垎' },
    { id: '6', action: '瀹屾垚浠诲姟', points: '鎸変换鍔?, icon: '馃搵', desc: '瀹屾垚浠诲姟鑾峰緱绉垎' },
    { id: '7', action: '鍙備笌娲诲姩', points: '+10', icon: '馃幆', desc: '鍙備笌娲诲姩鑾峰緱绉垎' },
    { id: '8', action: '瑙ｉ攣鎴愬氨', points: '鎸夋垚灏?, icon: '馃弳', desc: '瑙ｉ攣鎴愬氨鑾峰緱绉垎' },
    { id: '9', action: '杩炵画绛惧埌', points: '+20~200', icon: '馃敟', desc: '杩炵画绛惧埌棰濆濂栧姳' },
  ]

  const spendRules = [
    { id: '1', action: '鎶曠エ', points: '鎸夋姇绁?, icon: '馃棾锔?, desc: '鍙備笌鎶曠エ娑堣€楃Н鍒? },
    { id: '2', action: '鍙戣捣灏忔氮', points: '100', icon: '馃寠', desc: '鍩虹鎺ㄥ箍' },
    { id: '3', action: '鍙戣捣涓氮', points: '300', icon: '馃寠', desc: '涓瓑鎺ㄥ箍' },
    { id: '4', action: '鍙戣捣宸ㄦ氮', points: '800', icon: '馃寠', desc: '澶ц妯℃帹骞? },
    { id: '5', action: '鏇濆厜鍔犻€?, points: '50', icon: '馃殌', desc: '24h鏇濆厜缈诲€? },
    { id: '6', action: '缃《', points: '150', icon: '馃搶', desc: '缃《24灏忔椂' },
  ]

  // 璁＄畻鏈懆缁熻
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const weekEarned = history
    .filter(h => h.amount > 0 && new Date(h.created_at) >= weekStart)
    .reduce((sum, h) => sum + h.amount, 0)

  const weekSpent = history
    .filter(h => h.amount < 0 && new Date(h.created_at) >= weekStart)
    .reduce((sum, h) => sum + Math.abs(h.amount), 0)

  return (
    <div className="max-w-lg mx-auto bg-black min-h-screen pb-16">
      <header className="sticky top-0 bg-black border-b border-white/10 z-40 px-4 py-3">
        <h1 className="text-xl font-bold text-white">绉垎涓績</h1>
      </header>

      {/* 绉垎姒傝 */}
      <div className="px-4 py-6">
        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-white/80 text-sm">鎴戠殑绉垎</div>
              <div className="text-5xl font-bold text-white">{loading ? '...' : pointsBalance}</div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{getLevelBadge(currentLevel)}</span>
                <span className={`text-xl font-bold ${getLevelColor(currentLevel)}`}>
                  {getLevelTitle(currentLevel)}
                </span>
              </div>
              <div className="text-white/60 text-sm">Lv.{currentLevel}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 鏍囩椤?*/}
      <div className="bg-black px-4 py-2 border-b border-white/10">
        <div className="flex gap-2">
          {[
            { key: 'earn' as const, label: '馃挵 璧氱Н鍒? },
            { key: 'spend' as const, label: '馃捀 鑺辩Н鍒? },
            { key: 'level' as const, label: '馃搳 绛夌骇' },
            { key: 'history' as const, label: '馃摑 璁板綍' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                activeTab === tab.key ? 'bg-white text-black' : 'bg-white/10 text-white/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* 璧氱Н鍒?*/}
        {activeTab === 'earn' && (
          <>
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4">
              <h3 className="text-green-400 font-bold mb-2">馃挵 濡備綍璧氬彇绉垎</h3>
              <p className="text-white/60 text-sm">閫氳繃绛惧埌銆佸彂甯冨唴瀹广€佸府鎺ㄣ€佽瘎璁虹瓑鏂瑰紡璧氬彇绉垎</p>
            </div>
            {earnRules.map(rule => (
              <div key={rule.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <span className="text-2xl">{rule.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-white text-sm">{rule.action}</div>
                  <div className="text-xs text-white/40">{rule.desc}</div>
                </div>
                <span className="text-green-400 font-bold">{rule.points}</span>
              </div>
            ))}
          </>
        )}

        {/* 鑺辩Н鍒?*/}
        {activeTab === 'spend' && (
          <>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
              <h3 className="text-red-400 font-bold mb-2">馃捀 绉垎鐢ㄩ€?/h3>
              <p className="text-white/60 text-sm">绉垎鍙敤浜庢帹骞裤€佹姇绁ㄣ€佺疆椤剁瓑</p>
            </div>
            {spendRules.map(rule => (
              <div key={rule.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl opacity-60">
                <span className="text-2xl">{rule.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-white text-sm">{rule.action}</div>
                  <div className="text-xs text-white/40">{rule.desc}</div>
                </div>
                <div className="text-right">
                  <span className="text-red-400 font-bold">{rule.points}</span>
                  <div className="text-[10px] text-white/30 mt-0.5">鍗冲皢涓婄嚎</div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* 绛夌骇 */}
        {activeTab === 'level' && (
          <>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-4">
              <h3 className="text-blue-400 font-bold mb-2">馃搳 绛夌骇绯荤粺</h3>
              <p className="text-white/60 text-sm">绉垎瓒婂绛夌骇瓒婇珮锛岃В閿佹洿澶氱壒鏉?/p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <div className="text-center mb-4">
                <div className="text-6xl mb-2">{getLevelBadge(currentLevel)}</div>
                <div className="text-3xl font-bold text-white">{getLevelTitle(currentLevel)}</div>
                <div className="text-white/60 text-sm">Lv.{currentLevel}</div>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { level: 1, title: '娉℃搏', icon: '馃' },
                { level: 5, title: '姘存淮', icon: '馃挧' },
                { level: 10, title: '灏忔氮鑺?, icon: '馃拵' },
                { level: 20, title: '涓祦鍑绘按', icon: '猸? },
                { level: 30, title: '涔橀鐮存氮', icon: '馃殌' },
                { level: 40, title: '娴皷鑸炶€?, icon: '鉁? },
                { level: 50, title: '宸ㄦ氮琛岃€?, icon: '馃挭' },
                { level: 60, title: '娼睈澶у笀', icon: '馃敟' },
                { level: 70, title: '椋庢毚棰嗕富', icon: '鈿? },
                { level: 80, title: '娴锋磱涔嬬帇', icon: '馃憫' },
                { level: 90, title: '浼犲宸ㄦ氮', icon: '馃寠' },
              ].map(item => (
                <div
                  key={item.level}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    currentLevel >= item.level
                      ? 'bg-primary/20 border border-primary/30'
                      : 'bg-white/5'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentLevel >= item.level ? 'bg-primary text-white' : 'bg-white/10 text-white/40'
                  }`}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white">Lv.{item.level} {item.title}</div>
                  </div>
                  {currentLevel >= item.level && (
                    <div className="text-xs text-primary">鉁?宸茶揪鎴?/div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* 鍘嗗彶璁板綍 */}
        {activeTab === 'history' && (
          <>
            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-400">+{weekEarned}</div>
                  <div className="text-xs text-white/40">鏈懆鑾峰緱</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-400">-{weekSpent}</div>
                  <div className="text-xs text-white/40">鏈懆娑堣€?/div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{pointsBalance}</div>
                  <div className="text-xs text-white/40">褰撳墠绉垎</div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-10 text-white/40">鍔犺浇涓?..</div>
            ) : history.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-white/60">鏆傛棤绉垎璁板綍</div>
              </div>
            ) : (
              history.map(record => (
                <div key={record.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <span className="text-2xl">{record.amount > 0 ? '馃挵' : '馃捀'}</span>
                  <div className="flex-1">
                    <div className="font-medium text-white text-sm">{record.description}</div>
                    <div className="text-xs text-white/40">
                      {new Date(record.created_at).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <span className={`font-bold ${record.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {record.amount > 0 ? '+' : ''}{record.amount}
                  </span>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
}

