// ===== 服务条款 =====

import { useNavigate } from 'react-router-dom'

export default function Terms() {
  const navigate = useNavigate()

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="px-5 pt-12 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-gray-400">← 返回</button>
          <h1 className="text-base font-bold text-gray-900">服务条款</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-5 prose prose-sm max-w-none">
        <p className="text-xs text-gray-400 mb-6">最后更新：2026年5月</p>

        <h3 className="text-sm font-bold text-gray-900 mt-6 mb-2">1. 服务说明</h3>
        <p className="text-sm text-gray-600 mb-4">
          巨浪（以下简称"本平台"）是一个内容帮推平台，为用户提供内容发布、帮推、互动等服务。
          使用本平台即表示您同意遵守本条款。
        </p>

        <h3 className="text-sm font-bold text-gray-900 mt-6 mb-2">2. 用户注册</h3>
        <p className="text-sm text-gray-600 mb-4">
          您需要提供真实、准确的注册信息。您有责任保护您的账号安全。
          未满18周岁的用户需在监护人指导下使用本平台。
        </p>

        <h3 className="text-sm font-bold text-gray-900 mt-6 mb-2">3. 内容规范</h3>
        <p className="text-sm text-gray-600 mb-4">
          您发布的内容不得包含：违法信息、色情暴力、虚假广告、侵权内容、恶意代码等。
          本平台有权删除违规内容并封禁账号。
        </p>

        <h3 className="text-sm font-bold text-gray-900 mt-6 mb-2">4. 积分与奖励</h3>
        <p className="text-sm text-gray-600 mb-4">
          积分是平台内的虚拟奖励，不可兑换现金。实物奖品需提供真实收货地址。
          本平台保留调整积分规则的权利。
        </p>

        <h3 className="text-sm font-bold text-gray-900 mt-6 mb-2">5. 知识产权</h3>
        <p className="text-sm text-gray-600 mb-4">
          您发布的内容版权归您所有，但您同意授权本平台在平台内展示和推广。
          未经授权不得转载平台内容。
        </p>

        <h3 className="text-sm font-bold text-gray-900 mt-6 mb-2">6. 免责声明</h3>
        <p className="text-sm text-gray-600 mb-4">
          本平台不对用户发布的内容负责。因不可抗力导致的服务中断，本平台不承担责任。
        </p>

        <h3 className="text-sm font-bold text-gray-900 mt-6 mb-2">7. 条款变更</h3>
        <p className="text-sm text-gray-600 mb-4">
          本平台有权随时修改本条款，修改后的条款将在平台上公布。
          继续使用本平台即表示您接受修改后的条款。
        </p>
      </div>
    </div>
  )
}
