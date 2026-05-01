import { useState } from 'react'

export default function CheckIn() {
  const [checkedDays, setCheckedDays] = useState<Set<number>>(new Set([1, 2, 3, 5, 7, 8, 10, 12, 15, 18, 20, 22, 25, 28]))
  const [today] = useState(30)
  const [showReward, setShowReward] = useState(false)

  const daysInMonth = 30
  const firstDayOfWeek = 3 // 0=周日, 1=周一, ...

  const handleCheckIn = () => {
    if (checkedDays.has(today)) return
    setCheckedDays(prev => new Set([...prev, today]))
    setShowReward(true)
    setTimeout(() => setShowReward(false), 2000)
  }

  const getConsecutiveDays = () => {
    let count = 0
    for (let i = today; i >= 1; i--) {
      if (checkedDays.has(i)) count++
      else break
    }
    return count
  }

  const consecutiveDays = getConsecutiveDays()
  const isCheckedToday = checkedDays.has(today)

  return (
    <div className="max-w-lg mx-auto bg-black min-h-screen pb-16">
      <header className="sticky top-0 bg-black border-b border-white/10 z-40 px-4 py-3">
        <h1 className="text-xl font-bold text-white">📅 签到日历</h1>
      </header>

      <div className="p-4">
        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-white/80 text-sm">连续签到</div>
              <div className="text-5xl font-bold text-white">{consecutiveDays} 天</div>
            </div>
            <div className="text-right">
              <div className="text-white/80 text-sm">累计签到</div>
              <div className="text-5xl font-bold text-white">{checkedDays.size} 天</div>
            </div>
          </div>
          <button
            onClick={handleCheckIn}
            disabled={isCheckedToday}
            className={`w-full py-3 rounded-xl font-bold ${isCheckedToday ? 'bg-white/20 text-white/60' : 'bg-white text-black'}`}
          >
            {isCheckedToday ? '✓ 今日已签到' : '签到 +10积分'}
          </button>
        </div>

        <div className="bg-white/5 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">2026年4月</h3>
            <div className="flex items-center gap-2 text-sm text-white/40">
              <span>已签到 {checkedDays.size} 天</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['日', '一', '二', '三', '四', '五', '六'].map(day => (
              <div key={day} className="text-center text-xs text-white/40 py-2">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfWeek }, (_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const isChecked = checkedDays.has(day)
              const isToday = day === today
              return (
                <div
                  key={day}
                  className={`aspect-square rounded-lg flex items-center justify-center text-sm ${
                    isToday ? 'bg-primary text-white font-bold' :
                    isChecked ? 'bg-primary/20 text-primary' :
                    'bg-white/5 text-white/40'
                  }`}
                >
                  {isChecked ? '✓' : day}
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-4">
          <h3 className="text-white font-bold mb-4">🎁 签到奖励</h3>
          <div className="space-y-3">
            {[
              { days: 1, reward: '10积分', icon: '🌱' },
              { days: 3, reward: '30积分', icon: '🌿' },
              { days: 7, reward: '100积分', icon: '🌳' },
              { days: 14, reward: '200积分', icon: '🎄' },
              { days: 21, reward: '500积分', icon: '🏆' },
              { days: 30, reward: '1000积分', icon: '👑' },
            ].map(item => (
              <div key={item.days} className={`flex items-center gap-3 p-3 rounded-xl ${checkedDays.size >= item.days ? 'bg-primary/10 border border-primary/20' : 'bg-white/5'}`}>
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <div className="text-sm text-white">连续签到 {item.days} 天</div>
                  <div className="text-xs text-white/40">{item.reward}</div>
                </div>
                {checkedDays.size >= item.days && <span className="text-xs text-primary">✓ 已达成</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showReward && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">签到成功！</h3>
            <p className="text-gray-600">获得 +10 积分</p>
          </div>
        </div>
      )}
    </div>
  )
}
