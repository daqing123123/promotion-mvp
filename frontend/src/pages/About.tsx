// ===== 关于巨浪 =====

import { useNavigate } from 'react-router-dom'

export default function About() {
  const navigate = useNavigate()

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="px-5 pt-12 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-gray-400">← 返回</button>
          <h1 className="text-base font-bold text-gray-900">关于巨浪</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-5">
        {/* Logo */}
        <div className="text-center py-10">
          <div className="w-24 h-24 bg-black rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-black/10">
            <span className="text-4xl text-white font-bold">浪</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">巨浪</h1>
          <p className="text-gray-400 text-sm">内容帮推平台</p>
          <p className="text-xs text-gray-300 mt-2">v1.0.0</p>
        </div>

        {/* 介绍 */}
        <div className="bg-gray-50 rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-bold text-gray-900 mb-3">🌊 我们是谁</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            巨浪是一个内容帮推平台。我们相信好的内容值得被更多人看到。
            在这里，你可以发布内容、帮推好物、参与话题、赚取积分，
            和一群有趣的人一起创造互联网上最有趣的梗。
          </p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-bold text-gray-900 mb-3">💡 怎么玩</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>📱 <strong>刷内容</strong> — 上下滑动发现有趣内容</p>
            <p>❤️ <strong>点赞</strong> — 喜欢就点个心，还能赚积分</p>
            <p>🔥 <strong>帮推</strong> — 帮好内容获得更多曝光</p>
            <p>💡 <strong>造梗</strong> — 在话题下创作你的梗</p>
            <p>📤 <strong>分享</strong> — 分享到站外赚积分</p>
            <p>👥 <strong>邀请</strong> — 邀请好友双方都得奖励</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-bold text-gray-900 mb-3">📧 联系我们</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>客服邮箱：support@julang.app</p>
            <p>商务合作：biz@julang.app</p>
            <p>意见反馈：feedback@julang.app</p>
          </div>
        </div>

        {/* 版本信息 */}
        <div className="text-center pt-4 space-y-2">
          <p className="text-xs text-gray-300">© 2026 巨浪 All rights reserved.</p>
          <div className="flex justify-center gap-4 text-xs text-gray-400">
            <button onClick={() => navigate('/terms')} className="underline">服务条款</button>
            <button onClick={() => navigate('/privacy')} className="underline">隐私政策</button>
          </div>
        </div>
      </div>
    </div>
  )
}
