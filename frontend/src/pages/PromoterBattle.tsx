// ===== 推广者战绩 =====
// 展示推广者个人战绩：推广历史、积分收入、排名

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPromoterStats } from '../lib/api/client'
import { getLevelBadge, getLevelTitle, getLevelColor } from '../lib/rewardSystem'

export default function PromoterBattle({ user }: { user?: any }) {
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'topic' | 'content'>('topic')

  useEffect(() => {
    if (user?.id) loadStats()
    else setLoading(false)
  }, [user?.id])

  const loadStats = async () => {
    setLoading(true)
    try {
      const data = await getPromoterStats()
      setStats(data)
    } catch (err) {
      console.error('加载战绩失败', err)
    }
    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">
      加载中...
    </div>
  )

  if (!user?.id) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <p className="text-gray-500">请先登录查看战绩</p>
      <button onClick={() => navigate('/login')} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium">
        去登录
      </button>
    </div>
  )

  const totalPromotes = stats?.total_promotes || 0
  const totalEarned = stats?.total_earned || 0
  const rank = stats?.rank || 0
  const topicHistory = stats?.topic_history || []
  const contentHistory = stats?.content_history || []

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* 头部 */}
      <div className="bg-gradient-to-br from-green-600 to-teal-600 px-5 pt-12 pb-8 text-white">
        <button onClick={() => navigate(-1)} className="text-white/70 mb-4">← 返回</button>
        <h1 className="text-2xl font-bold mb-1">📊 我的战绩</h1>
        <p className="text-white/70 text-sm">每一次推广，都是一朵浪花</p>

        {/* 战绩概览 */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{totalPromotes}</div>
            <div className="text-xs text-white/60 mt-1">总推广次数</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-300">+{totalEarned}</div>
            <div className="text-xs text-white/60 mt-1">累计获得积分</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">#{rank || '-'}</div>
            <div className="text-xs text-white/60 mt-1">推广排名</div>
          </div>
        </div>
      </div>

      {/* 分类 tab */}
      <div className="mx-5 mt-4 flex bg-white rounded-xl p-1">
        <button
          onClick={() => setTab('topic')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${tab === 'topic' ? 'bg-green-500 text-white' : 'text-gray-500'}`}
        >
          🏷️ 话题推广 ({topicHistory.length})
        </button>
        <button
          onClick={() => setTab('content')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${tab === 'content' ? 'bg-green-500 text-white' : 'text-gray-500'}`}
        >
          📣 内容帮推 ({contentHistory.length})
        </button>
      </div>

      {/* 推广历史列表 */}
      <div className="mx-5 mt-3 space-y-2">
        {(tab === 'topic' ? topicHistory : contentHistory).length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
            <div className="text-4xl mb-2">🌊</div>
            <p className="text-sm">还没有{tbText(tab)}记录</p>
            <button onClick={() => navigate('/topics')} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm">
              去发现话题
            </button>
          </div>
        ) : (
          (tab === 'topic' ? topicHistory : contentHistory).map((item: any) => (
            <div key={item.id} className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[10px] rounded-full ${
                    item.status === 'completed' ? 'bg-green-50 text-green-600' :
                    item.status === 'accepted' ? 'bg-blue-50 text-blue-600' :
                    item.status === 'shared' ? 'bg-purple-50 text-purple-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {statusText(item.status)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(item.created_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <span className="text-sm font-bold text-green-600">+{item.points_earned || 0}分</span>
              </div>
              <h3 className="text-sm font-medium text-gray-900">
                {tab === 'topic' ? item.topic_title : item.content_title || '内容'}
              </h3>
              {item.brand_name && (
                <span className="text-xs text-blue-500 mt-0.5">🏷️ {item.brand_name}</span>
              )}
            </div>
          ))
        )}
      </div>

      {/* 底部操作 */}
      {totalPromotes > 0 && (
        <div className="mx-5 mt-6">
          <button
            onClick={() => navigate('/topics')}
            className="w-full py-3 bg-green-600 text-white rounded-2xl font-bold text-sm active:scale-[0.98] transition-transform"
          >
            🔥 继续推广赚积分
          </button>
        </div>
      )}
    </div>
  )
}

function statusText(status: string) {
  switch (status) {
    case 'accepted': return '已接受'
    case 'shared': return '已分享'
    case 'address_submitted': return '待发货'
    case 'shipped': return '已发货'
    case 'received': return '已收货'
    case 'completed': return '已完成'
    default: return status || '进行中'
  }
}

function tbText(tab: string) {
  return tab === 'topic' ? '话题推广' : '内容帮推'
}
