import { useState } from 'react'

export default function Points({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<'earn' | 'spend' | 'history' | 'level' | 'vip'>('earn')

  const currentPoints = user?.points || 0
  const currentMoney = user?.money || 0
  
  // 计算当前等级（100级，指数级）- 积分等级
  const calculateLevel = (points: number) => {
    if (points <= 0) return 1
    const level = Math.floor(Math.log(points / 10) / Math.log(1.15)) + 1
    return Math.min(100, Math.max(1, level))
  }
  
  // 计算VIP等级（100级，指数级）- 消费等级
  const calculateVIPLevel = (money: number) => {
    if (money <= 0) return 1
    const level = Math.floor(Math.log(money / 10) / Math.log(1.15)) + 1
    return Math.min(100, Math.max(1, level))
  }
  
  // 计算指定等级所需积分
  const getLevelPoints = (level: number) => {
    return Math.floor(10 * Math.pow(1.15, level - 1))
  }
  
  // 计算累计积分
  const getCumulativePoints = (level: number) => {
    let total = 0
    for (let i = 1; i <= level; i++) {
      total += getLevelPoints(i)
    }
    return total
  }
  
  const currentLevel = calculateLevel(currentPoints)
  const currentVIPLevel = calculateVIPLevel(currentMoney)
  const nextLevelPoints = getLevelPoints(currentLevel + 1)
  const nextVIPLevelPoints = getLevelPoints(currentVIPLevel + 1)
  const progress = ((currentPoints - getCumulativePoints(currentLevel - 1)) / (getCumulativePoints(currentLevel) - getCumulativePoints(currentLevel - 1))) * 100
  const vipProgress = ((currentMoney - getCumulativePoints(currentVIPLevel - 1)) / (getCumulativePoints(currentVIPLevel) - getCumulativePoints(currentVIPLevel - 1))) * 100

  const earnRules = [
    { id: '1', action: '发布内容', points: '+10', icon: '📝', desc: '每发布一条内容' },
    { id: '2', action: '被点赞', points: '+5', icon: '❤️', desc: '每被点赞一次' },
    { id: '3', action: '被评论', points: '+5', icon: '💬', desc: '每被评论一次' },
    { id: '4', action: '被转发', points: '+20', icon: '🔄', desc: '每被转发一次' },
    { id: '5', action: '被推荐', points: '+50', icon: '⭐', desc: '每被推荐一次' },
    { id: '6', action: '参与任务', points: '+50', icon: '📋', desc: '每参与一个任务' },
    { id: '7', action: '完成任务', points: '+100', icon: '✅', desc: '每完成一个任务' },
    { id: '8', action: '邀请好友', points: '+200', icon: '👥', desc: '每邀请一个好友注册' },
    { id: '9', action: '连续签到', points: '+10~50', icon: '📅', desc: '连续签到奖励递增' },
  ]

  const spendRules = [
    { id: '1', action: '普通推荐', points: '10', icon: '⭐', desc: '+100曝光' },
    { id: '2', action: '强力推荐', points: '50', icon: '⭐⭐', desc: '+500曝光' },
    { id: '3', action: '超级推荐', points: '100', icon: '⭐⭐⭐', desc: '+2000曝光' },
    { id: '4', action: '品牌推荐', points: '500', icon: '🏢', desc: '+10000曝光' },
    { id: '5', action: '发起任务', points: '自定义', icon: '📋', desc: '设置任务奖励' },
    { id: '6', action: '提升曝光', points: '100~1000', icon: '🚀', desc: '增加内容曝光' },
  ]

  const history = [
    { id: '1', action: '发布内容', points: '+10', time: '2分钟前', type: 'earn' },
    { id: '2', action: '被点赞', points: '+5', time: '5分钟前', type: 'earn' },
    { id: '3', action: '普通推荐', points: '-10', time: '1小时前', type: 'spend' },
    { id: '4', action: '参与任务', points: '+50', time: '2小时前', type: 'earn' },
    { id: '5', action: '被转发', points: '+20', time: '3小时前', type: 'earn' },
    { id: '6', action: '提升曝光', points: '-100', time: '1天前', type: 'spend' },
  ]

  // 生成等级预览（每10级显示）
  const levelPreview = Array.from({ length: 10 }, (_, i) => {
    const level = (i + 1) * 10
    return {
      level,
      points: getLevelPoints(level),
      cumulative: getCumulativePoints(level),
      isActive: currentLevel >= level
    }
  })

  return (
    <div className="max-w-lg mx-auto bg-black min-h-screen pb-16">
      <header className="sticky top-0 bg-black border-b border-white/10 z-40 px-4 py-3">
        <h1 className="text-xl font-bold text-white">积分中心</h1>
      </header>

      <div className="px-4 py-6">
        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-white/80 text-sm">我的积分</div>
              <div className="text-5xl font-bold text-white">{currentPoints}</div>
            </div>
            <div className="text-right">
              <div className="text-white/80 text-sm">当前等级</div>
              <div className="text-5xl font-bold text-white">Lv.{currentLevel}</div>
            </div>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-sm text-white/60 mb-1">
              <span>Lv.{currentLevel}</span>
              <span>Lv.{currentLevel + 1}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div className="bg-white h-3 rounded-full transition-all" style={{ width: `${Math.min(100, progress)}%` }} />
            </div>
            <div className="text-center text-sm text-white/60 mt-1">
              还需 {nextLevelPoints - currentPoints} 积分升级
            </div>
          </div>
        </div>
        
        <div className="mt-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-white/80 text-sm">累计消费</div>
              <div className="text-5xl font-bold text-white">¥{currentMoney}</div>
            </div>
            <div className="text-right">
              <div className="text-white/80 text-sm">VIP等级</div>
              <div className="text-5xl font-bold text-white">VIP.{currentVIPLevel}</div>
            </div>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-sm text-white/60 mb-1">
              <span>VIP.{currentVIPLevel}</span>
              <span>VIP.{currentVIPLevel + 1}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div className="bg-white h-3 rounded-full transition-all" style={{ width: `${Math.min(100, vipProgress)}%` }} />
            </div>
            <div className="text-center text-sm text-white/60 mt-1">
              还需 ¥{nextVIPLevelPoints - currentMoney} 消费升级
            </div>
          </div>
        </div>
      </div>

      <div className="bg-black px-4 py-2 border-b border-white/10">
        <div className="flex gap-3">
          <button onClick={() => setActiveTab('earn')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${activeTab === 'earn' ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`}>
            💰 赚积分
          </button>
          <button onClick={() => setActiveTab('spend')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${activeTab === 'spend' ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`}>
            💸 花积分
          </button>
          <button onClick={() => setActiveTab('level')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${activeTab === 'level' ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`}>
            📊 等级
          </button>
          <button onClick={() => setActiveTab('vip')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${activeTab === 'vip' ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`}>
            👑 VIP
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${activeTab === 'history' ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`}>
            📝 记录
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {activeTab === 'earn' && (
          <>
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4">
              <h3 className="text-green-400 font-bold mb-2">💰 如何赚取积分</h3>
              <p className="text-white/60 text-sm">通过发布内容、参与任务、被推荐等方式赚取积分</p>
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

        {activeTab === 'spend' && (
          <>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
              <h3 className="text-red-400 font-bold mb-2">💸 积分用途</h3>
              <p className="text-white/60 text-sm">积分可用于推荐、提升曝光、发起任务等</p>
            </div>
            {spendRules.map(rule => (
              <div key={rule.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <span className="text-2xl">{rule.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-white text-sm">{rule.action}</div>
                  <div className="text-xs text-white/40">{rule.desc}</div>
                </div>
                <span className="text-red-400 font-bold">{rule.points}</span>
              </div>
            ))}
          </>
        )}

        {activeTab === 'level' && (
          <>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-4">
              <h3 className="text-blue-400 font-bold mb-2">📊 等级系统</h3>
              <p className="text-white/60 text-sm">共100级，积分需求指数级增长</p>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <div className="text-center mb-4">
                <div className="text-6xl font-bold text-primary">Lv.{currentLevel}</div>
                <div className="text-white/60 text-sm">当前等级</div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">{currentPoints}</div>
                  <div className="text-xs text-white/40">当前积分</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{nextLevelPoints}</div>
                  <div className="text-xs text-white/40">下一级所需</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {levelPreview.map(item => (
                <div key={item.level} className={`flex items-center gap-3 p-3 rounded-xl ${item.isActive ? 'bg-primary/20 border border-primary/30' : 'bg-white/5'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${item.isActive ? 'bg-primary text-white' : 'bg-white/10 text-white/40'}`}>
                    {item.level}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white">Lv.{item.level}</div>
                    <div className="text-xs text-white/40">需要 {item.points} 积分</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-white/60">累计 {item.cumulative}</div>
                    {item.isActive && <div className="text-xs text-primary">✓ 已达成</div>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'vip' && (
          <>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-4">
              <h3 className="text-yellow-400 font-bold mb-2">👑 VIP等级</h3>
              <p className="text-white/60 text-sm">消费即可升级VIP，共100级</p>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <div className="text-center mb-4">
                <div className="text-6xl font-bold text-yellow-500">VIP.{currentVIPLevel}</div>
                <div className="text-white/60 text-sm">当前VIP等级</div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">¥{currentMoney}</div>
                  <div className="text-xs text-white/40">累计消费</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">¥{nextVIPLevelPoints}</div>
                  <div className="text-xs text-white/40">下一级所需</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {levelPreview.map(item => {
                const vipItem = { ...item, isActive: currentVIPLevel >= item.level }
                return (
                  <div key={item.level} className={`flex items-center gap-3 p-3 rounded-xl ${vipItem.isActive ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-white/5'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${vipItem.isActive ? 'bg-yellow-500 text-white' : 'bg-white/10 text-white/40'}`}>
                      {item.level}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-white">VIP.{item.level}</div>
                      <div className="text-xs text-white/40">需要消费 ¥{item.points}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-white/60">累计 ¥{item.cumulative}</div>
                      {vipItem.isActive && <div className="text-xs text-yellow-500">✓ 已达成</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <>
            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-400">+385</div>
                  <div className="text-xs text-white/40">本周获得</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-400">-110</div>
                  <div className="text-xs text-white/40">本周消耗</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{currentPoints}</div>
                  <div className="text-xs text-white/40">当前积分</div>
                </div>
              </div>
            </div>
            {history.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <span className="text-2xl">{item.type === 'earn' ? '💰' : '💸'}</span>
                <div className="flex-1">
                  <div className="font-medium text-white text-sm">{item.action}</div>
                  <div className="text-xs text-white/40">{item.time}</div>
                </div>
                <span className={`font-bold ${item.type === 'earn' ? 'text-green-400' : 'text-red-400'}`}>{item.points}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
