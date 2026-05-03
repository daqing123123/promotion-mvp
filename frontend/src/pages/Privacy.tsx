// ===== 隐私政策 =====

import { useNavigate } from 'react-router-dom'

export default function Privacy() {
  const navigate = useNavigate()

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="px-5 pt-12 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-gray-400">← 返回</button>
          <h1 className="text-base font-bold text-gray-900">隐私政策</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-5 prose prose-sm max-w-none">
        <p className="text-xs text-gray-400 mb-6">最后更新：2026年5月</p>

        <h3 className="text-sm font-bold text-gray-900 mt-6 mb-2">1. 信息收集</h3>
        <p className="text-sm text-gray-600 mb-4">
          我们收集的信息包括：注册信息（用户名、昵称）、使用数据（浏览、点赞、分享等行为）、
          设备信息（设备型号、操作系统）。
        </p>

        <h3 className="text-sm font-bold text-gray-900 mt-6 mb-2">2. 信息使用</h3>
        <p className="text-sm text-gray-600 mb-4">
          我们使用收集的信息来：提供和改进服务、个性化内容推荐、发送通知、
          防止欺诈和滥用。
        </p>

        <h3 className="text-sm font-bold text-gray-900 mt-6 mb-2">3. 信息共享</h3>
        <p className="text-sm text-gray-600 mb-4">
          我们不会将您的个人信息出售给第三方。仅在以下情况下共享：
          获得您的同意、法律要求、保护平台安全。
        </p>

        <h3 className="text-sm font-bold text-gray-900 mt-6 mb-2">4. 信息安全</h3>
        <p className="text-sm text-gray-600 mb-4">
          我们采用加密存储、访问控制等技术手段保护您的信息安全。
          但无法保证100%的安全性。
        </p>

        <h3 className="text-sm font-bold text-gray-900 mt-6 mb-2">5. 您的权利</h3>
        <p className="text-sm text-gray-600 mb-4">
          您可以随时查看、修改、删除您的个人信息。
          您可以注销账号，注销后数据将被删除。
        </p>

        <h3 className="text-sm font-bold text-gray-900 mt-6 mb-2">6. Cookie</h3>
        <p className="text-sm text-gray-600 mb-4">
          我们使用 Cookie 和类似技术来保持登录状态、记住偏好设置。
        </p>

        <h3 className="text-sm font-bold text-gray-900 mt-6 mb-2">7. 联系我们</h3>
        <p className="text-sm text-gray-600 mb-4">
          如有隐私相关问题，请联系：privacy@julang.app
        </p>
      </div>
    </div>
  )
}
