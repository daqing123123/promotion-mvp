// ===== 签到页面 =====

import { useState, useEffect, useCallback } from 'react'
import { checkIn as checkInDB, getTodaySignIn, getConsecutiveDays, getSignInHistory } from '../lib/supabase/client'
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
      console.error('加载签到数据失败:', err)
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
      toast.error(err.message || '签到失败')
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

  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

  return (
    <div className="max-w-lg mx-auto bg-black min-h-screen pb-16">
      <header className="sticky top-0 bg-black border-b border-white/10 z-40 px-4 py-3">
        <h1 className="text-xl font-bold text-white">📅 签到日历</h1>
      </header>

      <div className="p-4">
        {/* 签到卡片 */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-white/80 text-sm">连续签到</div>
              <div className="text-5xl font-bold text-white">{consecutiveDays} 天</div>
            </div>
            <div className="text-right">
              <div className="text-white/80 text-sm">累计签到</div>
              <div className="text-5xl font-bold text-white">{totalDays} 天</div>
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
            {loading ? '签到中...' : isCheckedToday ? '✅ 今日已签到' : '签到 +10积分'}
          </button>
        </div>

        {/* 连续签到奖励提示 */}
        <div className="bg-white/5 rounded-xl p-4 mb-4">
          <h3 className="text-white font-bold mb-3">💰 连续签到奖励</h3>
          <div className="space-y-2">
            {[
              { days: 3, reward: '+20积分', icon: '🥉', active: consecutiveDays >= 3 },
              { days: 7, reward: '+50积分', icon: '🥈', active: consecutiveDays >= 7 },
              { days: 30, reward: '+200积分', icon: '🥇', active: consecutiveDays >= 30 },
            ].map(item => (
              <div
                key={item.days}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  item.active ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-white/5'
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <div className="text-sm text-white">连续签到 {item.days} 天</div>
                  <div className="text-xs text-white/40">{item.reward}</div>
                </div>
                {item.active && <span className="text-xs text-purple-400">✅ 已达成</span>}
                {!item.active && (
                  <div className="text-xs text-white/40">{consecutiveDays}/{item.days}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 日历 */}
        <div className="bg-white/5 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">{year}年{monthNames[month]}</h3>
            <div className="flex items-center gap-2 text-sm text-white/40">
              <span>已签到 {totalDays} 天</span>
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
                  {isChecked ? '✓' : day}
                </div>
              )
            })}
          </div>
        </div>

        {/* 签到历史 */}
        {signInHistory.length > 0 && (
          <div className="bg-white/5 rounded-xl p-4">
            <h3 className="text-white font-bold mb-3">📋 签到记录</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {signInHistory.slice(0, 10).map((record: any) => (
                <div key={record.id} className="flex items-center justify-between text-sm">
                  <span className="text-white/60">{record.sign_date}</span>
                  <span className="text-purple-400">+{record.points_earned}积分</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 签到成功弹窗 */}
      {showReward && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 text-center mx-4 max-w-sm">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">签到成功！</h3>
            <p className="text-gray-600 mb-1">获得 +{rewardInfo.points - rewardInfo.bonus} 积分</p>
            {rewardInfo.bonus > 0 && (
              <p className="text-purple-600 font-bold">连续签到额外 +{rewardInfo.bonus} 积分</p>
            )}
            <p className="text-sm text-gray-400 mt-2">连续签到 {consecutiveDays} 天</p>
          </div>
        </div>
      )}

      {/* 新成就弹窗 */}
      {newAchievements.length > 0 && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={() => setNewAchievements([])}>
          <div className="bg-white rounded-2xl p-8 text-center mx-4 max-w-sm">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">成就解锁！</h3>
            <p className="text-gray-600">解锁了 {newAchievements.length} 个新成就</p>
            <button
              onClick={() => setNewAchievements([])}
              className="mt-4 px-6 py-2 bg-black text-white rounded-full text-sm"
            >
              太棒了！
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
