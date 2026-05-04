// ===== 绉垎涓績 鈥?鎵€鏈夎禋绉垎鐨勬柟寮?=====

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTodayShareCount, getTodaySignIn, getPointLogsCount } from '../lib/api/client'

interface PointTask {
  id: string
  icon: string
  name: string
  desc: string
  points: number
  limit: string
  done: boolean
  action?: () => void
}

export default function PointsCenter({ user }: { user: any }) {
  const navigate = useNavigate()
  const [todayShared, setTodayShared] = useState(0)
  const [todaySigned, setTodaySigned] = useState(false)
  const [todayLikes, setTodayLikes] = useState(0)
  const [todayComments, setTodayComments] = useState(0)

  useEffect(() => {
    if (user?.id) loadProgress()
  }, [user?.id])

  const loadProgress = async () => {
    if (!user?.id) return
    try {
      const [shareCount, signed] = await Promise.all([
        getTodayShareCount(user.id),
        getTodaySignIn(user.id),
      ])
      setTodayShared(shareCount)
      setTodaySigned(signed)

      // 浠婃棩鐐硅禐/璇勮鏁?
      const today = new Date().toISOString().split('T')[0]
      const [likes, comments] = await Promise.all([
        getPointLogsCount(user.id, 'like', today),
        getPointLogsCount(user.id, 'comment', today),
      ]).catch(() => [0, 0])
      setTodayLikes(typeof likes === 'number' ? likes : 0)
      setTodayComments(typeof comments === 'number' ? comments : 0)
    } catch {}
  }

  const dailyTasks: PointTask[] = [
    { id: 'signin', icon: '馃搮', name: '姣忔棩绛惧埌', desc: todaySigned ? '浠婃棩宸茬鍒? : '杩炵画绛惧埌鏇村澶╂暟锛屽鍔辫秺楂?, points: todaySigned ? 0 : 10, limit: '姣忔棩1娆?, done: todaySigned, action: () => navigate('/checkin') },
    { id: 'share', icon: '馃摛', name: '鍒嗕韩鍐呭', desc: `浠婃棩宸插垎浜?${todayShared}/10 娆, points: 3, limit: '姣忔棩10娆?, done: todayShared >= 10 },
    { id: 'like', icon: '鉂わ笍', name: '鐐硅禐鍐呭', desc: `浠婃棩宸茬偣璧?${todayLikes}/25 娆, points: 5, limit: '姣忔棩25娆?, done: todayLikes >= 25 },
    { id: 'comment', icon: '馃挰', name: '璇勮鍐呭', desc: `浠婃棩宸茶瘎璁?${todayComments}/5 娆, points: 5, limit: '姣忔棩5娆?, done: todayComments >= 5 },
    { id: 'promote', icon: '馃敟', name: '甯帹鍐呭', desc: '甯帹濂藉唴瀹癸紝璧氱Н鍒?, points: 20, limit: '姣忔棩5娆?, done: false },
  ]

  const bonusTasks: PointTask[] = [
    { id: 'invite', icon: '馃懃', name: '閭€璇峰ソ鍙嬫敞鍐?, desc: '濂藉弸鐢ㄤ綘鐨勭爜娉ㄥ唽锛屽弻鏂归兘寰楃Н鍒?, points: 100, limit: '鏃犱笂闄?, done: false, action: () => navigate('/invite') },
    { id: 'publish', icon: '鉁忥笍', name: '鍙戝竷鍐呭', desc: '鍙戝竷鍘熷垱鍐呭', points: 50, limit: '姣忔棩3娆?, done: false, action: () => navigate('/publish') },
    { id: 'viral', icon: '馃殌', name: '鍐呭鐖嗕簡', desc: '鍐呭鑾峰緱100+鐐硅禐', points: 500, limit: '鑷姩瑙﹀彂', done: false },
    { id: 'achievement', icon: '馃弳', name: '瑙ｉ攣鎴愬氨', desc: '瀹屾垚鎴愬氨鑾峰緱棰濆绉垎', points: 100, limit: '鎸夋垚灏?, done: false, action: () => navigate('/profile') },
  ]

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* 澶撮儴 */}
      <div className="bg-gradient-to-br from-yellow-500 to-orange-500 px-5 pt-12 pb-8 text-white">
        <button onClick={() => navigate(-1)} className="text-white/70 mb-4">鈫?杩斿洖</button>
        <h1 className="text-2xl font-bold mb-1">绉垎涓績</h1>
        <p className="text-white/70 text-sm">鍋氫换鍔¤禋绉垎锛岀Н鍒嗗彲鍏戞崲濂栧姳</p>
        <div className="mt-4 bg-white/10 backdrop-blur-xl rounded-2xl p-5 text-center">
          <div className="text-4xl font-bold">{user?.points || 0}</div>
          <div className="text-xs text-white/60 mt-1">褰撳墠绉垎</div>
        </div>
      </div>

      {/* 姣忔棩浠诲姟 */}
      <div className="mx-5 -mt-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-3">馃搵 姣忔棩浠诲姟</h3>
        <div className="space-y-3">
          {dailyTasks.map(task => (
            <div key={task.id} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl">{task.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{task.name}</div>
                <div className="text-xs text-gray-400">{task.desc}</div>
              </div>
              <div className="text-right">
                {task.done ? (
                  <span className="text-xs text-green-500 font-medium">鉁?瀹屾垚</span>
                ) : (
                  <div>
                    <div className="text-sm font-bold text-orange-500">+{task.points}</div>
                    <div className="text-[10px] text-gray-300">{task.limit}</div>
                  </div>
                )}
              </div>
              {task.action && !task.done && (
                <button onClick={task.action} className="px-3 py-1.5 bg-orange-50 text-orange-600 text-xs rounded-lg font-medium">
                  鍘诲仛
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 棰濆濂栧姳 */}
      <div className="mx-5 mt-4 bg-white rounded-2xl p-5 border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-3">馃巵 棰濆濂栧姳</h3>
        <div className="space-y-3">
          {bonusTasks.map(task => (
            <div key={task.id} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl">{task.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{task.name}</div>
                <div className="text-xs text-gray-400">{task.desc}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-purple-500">+{task.points}</div>
                <div className="text-[10px] text-gray-300">{task.limit}</div>
              </div>
              {task.action && (
                <button onClick={task.action} className="px-3 py-1.5 bg-purple-50 text-purple-600 text-xs rounded-lg font-medium">
                  鍘诲仛
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 绉垎瑙勫垯 */}
      <div className="mx-5 mt-4 bg-white rounded-2xl p-5 border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-3">馃摉 绉垎瑙勫垯</h3>
        <div className="space-y-2 text-xs text-gray-500">
          <p>鈥?姣忔棩绉垎涓婇檺 500 绉垎</p>
          <p>鈥?鍚屼竴鍐呭閲嶅鐐硅禐/鍒嗕韩涓嶉噸澶嶈鍒?/p>
          <p>鈥?閭€璇峰ソ鍙嬫敞鍐屾棤涓婇檺</p>
          <p>鈥?鍐呭鐖嗘濂栧姳鑷姩瑙﹀彂</p>
          <p>鈥?绉垎鍙敤浜庡厬鎹紭鎯犲埜銆佸弬涓庢姇绁ㄣ€佸厬鎹㈠疄鐗╁鍝?/p>
        </div>
      </div>
    </div>
  )
}

