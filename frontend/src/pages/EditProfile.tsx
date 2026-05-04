// ===== 编辑资料 =====

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateUser } from '../lib/api/client'
import { toast } from '../lib/toast'

const AVATAR_OPTIONS = ['👤', '😎', '🤠', '👻', '🐱', '🐶', '🦊', '🐼', '🦁', '🐸', '🌸', '⚡', '🔥', '🌊', '💎', '🎮', '🎸', '🎨', '🚀', '🌙']

export default function EditProfile({ user, setUser }: { user: any; setUser: (u: any) => void }) {
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [avatar, setAvatar] = useState(user?.avatar || '👤')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) { toast.warning('昵称不能为空'); return }
    if (name.length > 20) { toast.warning('昵称最多20个字'); return }
    if (bio.length > 100) { toast.warning('简介最多100个字'); return }

    setSaving(true)
    try {
      await updateUser(user.id, { name: name.trim(), bio: bio.trim(), avatar })

      setUser({ ...user, name: name.trim(), bio: bio.trim(), avatar })
      toast.success('保存成功')
      navigate(-1)
    } catch (e: any) {
      toast.error(e.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* 头部 */}
      <div className="bg-white px-5 pt-12 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-gray-400">← 取消</button>
          <h1 className="text-base font-bold text-gray-900">编辑资料</h1>
          <button onClick={handleSave} disabled={saving} className={`text-sm font-bold ${saving ? 'text-gray-400' : 'text-blue-500'}`}>
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* 头像选择 */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-3">头像</h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-5xl">{avatar}</div>
            <div>
              <p className="text-sm text-gray-600">选择一个头像</p>
              <p className="text-xs text-gray-400">或者上传自定义头像（即将支持）</p>
            </div>
          </div>
          <div className="grid grid-cols-10 gap-2">
            {AVATAR_OPTIONS.map(a => (
              <button
                key={a}
                onClick={() => setAvatar(a)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl transition-all ${
                  avatar === a ? 'bg-blue-100 ring-2 ring-blue-500 scale-110' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* 昵称 */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-3">昵称</h3>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="输入昵称"
            maxLength={20}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{name.length}/20</p>
        </div>

        {/* 简介 */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-3">简介</h3>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="介绍一下自己..."
            maxLength={100}
            rows={3}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{bio.length}/100</p>
        </div>

        {/* 用户名（只读） */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-3">用户名</h3>
          <div className="px-4 py-3 bg-gray-100 rounded-xl text-base text-gray-500">{user?.username}</div>
          <p className="text-xs text-gray-400 mt-1">用户名不可修改</p>
        </div>

        {/* 账号信息 */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-3">账号信息</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">注册时间</span>
              <span className="text-sm text-gray-900">{user?.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">用户ID</span>
              <span className="text-xs text-gray-400 font-mono">{user?.id?.slice(0, 8)}...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
