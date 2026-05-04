// ===== 绛惧埌椤甸潰 =====

import { useState, useEffect, useCallback } from 'react'
import { checkIn as checkInDB, getTodaySignIn, getConsecutiveDays, getSignInHistory } from '../lib/api/client'
import { checkAndUnlockAchievements } from '../lib/achievements'
import { toast } from '../lib/toast'

interface CheckInProps {
  user: any
  setUser: (user: any) => void
}

export default function CheckIn({ user, setUser }: CheckInProps) {
  const [isCheckedToday, setIsCheckedToday] = useState(false)
  const [consecutiveDays, setConsecutiveDays] = useState(0)
  const [totalDays, setTotalDays] = useState(0)
  const [signInHistory, setSignInHistory] = useState<any[]>([])
  const [showReward, setShowReward] = useState(false)
  const [rewardInfo, setRewardInfo] = useState({ points: 0, bonus: 0 })
  const [loading, setLoading] = useState(false)
  const [newAchievements, setNewAchievements] = useState<string[]>([])

  const loadSignInData = useCallback(async () => {
    if (!user) return
    try {
      const [todaySigned, consecutive, history] = await Promise.all([
        getTodaySignIn(user.id),
        getConsecutiveDays(user.id),
        getSignInHistory(user.id, 60),
      ])
      setIsCheckedToday(todaySigned)
      setConsecutiveDays(consecutive)
      setSignInHistory(history)
      setTotalDays(history.length)
    } catch (err) {
      console.error('鍔犺浇绛惧埌鏁版嵁澶辫触:', err)
    }
  }, [user])

  useEffect(() => {
    loadSignInData()
  }, [loadSignInData])

  const handleCheckIn = async () => {
    if (!user || isCheckedToday || loading) return
    setLoading(true)

    try {
      const result = await checkInDB(user.id)
      setIsCheckedToday(true)
      setConsecutiveDays(result.consecutiveDays)
      setRewardInfo({ points: result.pointsEarned, bonus: result.bonusPoints })
      setShowReward(true)

      if (setUser && result.points !== undefined) {
        setUser((prev: any) => prev ? { ...prev, points: result.points } : prev)
      }

      const unlocked = await checkAndUnlockAchievements(user.id)
      if (unlocked.length > 0) {
        setNewAchievements(unlocked)
      }

      await loadSignInData()
      setTimeout(() => setShowReward(false), 3000)
    } catch (err: any) {
      toast.error(err.message || '绛惧埌澶辫触')
    } finally {
      setLoading(false)
    }
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const today = now.getDate()

  const signedDates = new Set(
    signInHistory.map((s: any) => {
      const d = new Date(s.sign_date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    })
  )

  const monthNames = ['1鏈?, '2鏈?, '3鏈?, '4鏈?, '5鏈?, '6鏈?, '7鏈?, '8鏈?, '9鏈?, '10鏈?, '11鏈?, '12鏈?]

  return (
    <div className="max-w-lg mx-auto bg-black min-h-screen pb-16">
      <header className="sticky top-0 bg-black border-b border-white/10 z-40 px-4 py-3">
        <h1 className="text-xl font-bold text-white">馃搮 绛惧埌鏃ュ巻</h1>
      </header>

      <div className="p-4">
        {/* 绛惧埌鍗＄墖 */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-white/80 text-sm">杩炵画绛惧埌</div>
              <div className="text-5xl font-bold text-white">{consecutiveDays} 澶?/div>
            </div>
            <div className="text-right">
              <div className="text-white/80 text-sm">绱绛惧埌</div>
              <div className="text-5xl font-bold text-white">{totalDays} 澶?/div>
            </div>
          </div>
          <button
            onClick={handleCheckIn}
            disabled={isCheckedToday || loading}
            className={`w-full py-3 rounded-xl font-bold transition-all ${
              isCheckedToday
                ? 'bg-white/20 text-white/60'
                : loading
                  ? 'bg-white/50 text-black/50'
                  : 'bg-white text-black active:scale-[0.98]'
            }`}
          >
            {loading ? '绛惧埌涓?..' : isCheckedToday ? '鉁?浠婃棩宸茬鍒? : '绛惧埌 +10绉垎'}
          </button>
        </div>

        {/* 杩炵画绛惧埌濂栧姳鎻愮ず */}
        <div className="bg-white/5 rounded-xl p-4 mb-4">
          <h3 className="text-white font-bold mb-3">馃挵 杩炵画绛惧埌濂栧姳</h3>
          <div className="space-y-2">
            {[
              { days: 3, reward: '+20绉垎', icon: '馃', active: consecutiveDays >= 3 },
              { days: 7, reward: '+50绉垎', icon: '馃', active: consecutiveDays >= 7 },
              { days: 30, reward: '+200绉垎', icon: '馃', active: consecutiveDays >= 30 },
            ].map(item => (
              <div
                key={item.days}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  item.active ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-white/5'
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <div className="text-sm text-white">杩炵画绛惧埌 {item.days} 澶?/div>
                  <div className="text-xs text-white/40">{item.reward}</div>
                </div>
                {item.active && <span className="text-xs text-purple-400">鉁?宸茶揪鎴?/span>}
                {!item.active && (
                  <div className="text-xs text-white/40">{consecutiveDays}/{item.days}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 鏃ュ巻 */}
        <div className="bg-white/5 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">{year}骞磠monthNames[month]}</h3>
            <div className="flex items-center gap-2 text-sm text-white/40">
              <span>宸茬鍒?{totalDays} 澶?/span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['鏃?, '涓€', '浜?, '涓?, '鍥?, '浜?, '鍏?].map(day => (
              <div key={day} className="text-center text-xs text-white/40 py-2">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfWeek }, (_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isChecked = signedDates.has(dateKey)
              const isToday = day === today
              return (
                <div
                  key={day}
                  className={`aspect-square rounded-lg flex items-center justify-center text-sm ${
                    isToday ? 'bg-purple-600 text-white font-bold' :
                    isChecked ? 'bg-purple-600/20 text-purple-400' :
                    'bg-white/5 text-white/40'
                  }`}
                >
                  {isChecked ? '鉁? : day}
                </div>
              )
            })}
          </div>
        </div>

        {/* 绛惧埌鍘嗗彶 */}
        {signInHistory.length > 0 && (
          <div className="bg-white/5 rounded-xl p-4">
            <h3 className="text-white font-bold mb-3">馃搵 绛惧埌璁板綍</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {signInHistory.slice(0, 10).map((record: any) => (
                <div key={record.id} className="flex items-center justify-between text-sm">
                  <span className="text-white/60">{record.sign_date}</span>
                  <span className="text-purple-400">+{record.points_earned}绉垎</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 绛惧埌鎴愬姛寮圭獥 */}
      {showReward && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 text-center mx-4 max-w-sm">
            <div className="text-6xl mb-4">馃帀</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">绛惧埌鎴愬姛锛?/h3>
            <p className="text-gray-600 mb-1">鑾峰緱 +{rewardInfo.points - rewardInfo.bonus} 绉垎</p>
            {rewardInfo.bonus > 0 && (
              <p className="text-purple-600 font-bold">杩炵画绛惧埌棰濆 +{rewardInfo.bonus} 绉垎</p>
            )}
            <p className="text-sm text-gray-400 mt-2">杩炵画绛惧埌 {consecutiveDays} 澶?/p>
          </div>
        </div>
      )}

      {/* 鏂版垚灏卞脊绐?*/}
      {newAchievements.length > 0 && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={() => setNewAchievements([])}>
          <div className="bg-white rounded-2xl p-8 text-center mx-4 max-w-sm">
            <div className="text-6xl mb-4">馃弳</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">鎴愬氨瑙ｉ攣锛?/h3>
            <p className="text-gray-600">瑙ｉ攣浜?{newAchievements.length} 涓柊鎴愬氨</p>
            <button
              onClick={() => setNewAchievements([])}
              className="mt-4 px-6 py-2 bg-black text-white rounded-full text-sm"
            >
              澶浜嗭紒
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

