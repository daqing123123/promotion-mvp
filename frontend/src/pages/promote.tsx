// ===== 推广广场 =====

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MOCK_USER, getLevelTitle, getLevelBadge, getLevelColor, SPEND_ACTIONS } from '../lib/rewardSystem'
import PointsCenter from '../components/PointsCenter'

interface PromoteProps {
  user: any
  setUser: (user: any) => void
  isMobile: boolean
}

export default function Promote({ user, setUser: _setUser, isMobile: _isMobile }: PromoteProps) {
  useNavigate() // keep hook used
  const [showPoints, setShowPoints] = useState(false)
  const [filter, setFilter] = useState<'all' | 'hot' | 'new' | 'ending'>('all')

  const userData = user || MOCK_USER

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* 等级卡片 */}
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
            {userData.points} 积分
          </button>
        </div>

        {/* 快捷操作 */}
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

      {/* 筛选 */}
      <div className="px-5 py-3 bg-white border-b border-gray-100 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {[
            { key: 'all' as const, label: '全部' },
            { key: 'hot' as const, label: '🔥 热门' },
            { key: 'new' as const, label: '🆕 最新' },
            { key: 'ending' as const, label: '⏰ 即将结束' },
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

      {/* 推广列表 */}
      <div className="p-5 space-y-3">
        {[
          { id: 'p1', title: '街头歌手老张', type: '人物', views: '23万', likes: '1.2万', status: 'hot' },
          { id: 'p2', title: '国产平替耳机', type: '产品', views: '5.6万', likes: '4500', status: 'active' },
          { id: 'p3', title: '10元挑战', type: '挑战', views: '8.9万', likes: '6000', status: 'active' },
          { id: 'p4', title: '独立音乐推荐', type: '音乐', views: '3.2万', likes: '2800', status: 'new' },
          { id: 'p5', title: '古装剧讨论', type: '影视', views: '12万', likes: '8000', status: 'hot' },
        ].map(promo => (
          <div key={promo.id} className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-600">
                {promo.type}
              </span>
              {promo.status === 'hot' && (
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-red-100 text-red-600">
                  🔥 热门
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">{promo.title}</h3>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>👁 {promo.views}</span>
              <span>❤️ {promo.likes}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 积分中心弹窗 */}
      {showPoints && <PointsCenter onClose={() => setShowPoints(false)} />}
    </div>
  )
}
