// ===== 账号设置 =====

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut, signIn, updatePassword } from '../lib/api/client'
import { toast } from '../lib/toast'

export default function Settings({ user, setUser }: { user: any; setUser: (u: any) => void }) {
  const navigate = useNavigate()
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [changingPwd, setChangingPwd] = useState(false)
  const [showPwdForm, setShowPwdForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleChangePassword = async () => {
    if (!oldPwd || !newPwd) { toast.warning('请填写完整'); return }
    if (newPwd.length < 6) { toast.warning('新密码至少6位'); return }
    if (newPwd !== confirmPwd) { toast.warning('两次密码不一致'); return }
    if (oldPwd === newPwd) { toast.warning('新旧密码不能相同'); return }

    setChangingPwd(true)
    try {
      // 先验证旧密码
      try {
        await signIn(user.username, oldPwd)
      } catch {
        toast.error('原密码错误'); return
      }

      // 更新密码
      try {
        await updatePassword(oldPwd, newPwd)
      } catch (err: any) { throw new Error(err.message || '修改失败') }

      toast.success('密码修改成功')
      setOldPwd('')
      setNewPwd('')
      setConfirmPwd('')
      setShowPwdForm(false)
    } catch (e: any) {
      toast.error(e.message || '修改失败')
    } finally {
      setChangingPwd(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    setUser(null)
    localStorage.removeItem('julang_user')
    navigate('/login')
  }

  const handleDeleteAccount = async () => {
    // 当前不支持客户端删除账号，只能提示联系客服
    toast.info('请联系客服处理账号注销')
    setShowDeleteConfirm(false)
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* 头部 */}
      <div className="bg-white px-5 pt-12 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-gray-400">← 返回</button>
          <h1 className="text-base font-bold text-gray-900">设置</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* 账号信息 */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-3">账号信息</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">用户名</span>
              <span className="text-sm font-mono text-gray-900">{user?.username}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">邮箱</span>
              <span className="text-sm text-gray-900">{user?.username}@julang.app</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">注册时间</span>
              <span className="text-sm text-gray-900">{user?.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}</span>
            </div>
          </div>
        </div>

        {/* 安全设置 */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <h3 className="text-sm font-bold text-gray-900 px-5 pt-5 pb-3">安全设置</h3>

          <button onClick={() => setShowPwdForm(!showPwdForm)} className="w-full px-5 py-4 flex items-center justify-between border-t border-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔒</span>
              <span className="text-sm text-gray-900">修改密码</span>
            </div>
            <span className="text-gray-400">{showPwdForm ? '▲' : '▼'}</span>
          </button>

          {showPwdForm && (
            <div className="px-5 pb-5 space-y-3">
              <input type="password" placeholder="原密码" value={oldPwd} onChange={e => setOldPwd(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              <input type="password" placeholder="新密码（至少6位）" value={newPwd} onChange={e => setNewPwd(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              <input type="password" placeholder="确认新密码" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              <button onClick={handleChangePassword} disabled={changingPwd}
                className={`w-full py-3 rounded-xl font-bold text-sm ${changingPwd ? 'bg-gray-200 text-gray-400' : 'bg-black text-white active:scale-[0.98]'}`}>
                {changingPwd ? '修改中...' : '确认修改'}
              </button>
            </div>
          )}

          <button onClick={() => navigate('/edit-profile')} className="w-full px-5 py-4 flex items-center justify-between border-t border-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-xl">✏️</span>
              <span className="text-sm text-gray-900">编辑资料</span>
            </div>
            <span className="text-gray-400">→</span>
          </button>
        </div>

        {/* 通知设置 */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <h3 className="text-sm font-bold text-gray-900 px-5 pt-5 pb-3">通知</h3>
          <button onClick={() => navigate('/notifications')} className="w-full px-5 py-4 flex items-center justify-between border-t border-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔔</span>
              <span className="text-sm text-gray-900">通知列表</span>
            </div>
            <span className="text-gray-400">→</span>
          </button>
        </div>

        {/* 关于 */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <h3 className="text-sm font-bold text-gray-900 px-5 pt-5 pb-3">关于</h3>
          <button onClick={() => navigate('/about')} className="w-full px-5 py-4 flex items-center justify-between border-t border-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-xl">ℹ️</span>
              <span className="text-sm text-gray-900">关于巨浪</span>
            </div>
            <span className="text-gray-400">→</span>
          </button>
          <button onClick={() => navigate('/terms')} className="w-full px-5 py-4 flex items-center justify-between border-t border-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-xl">📄</span>
              <span className="text-sm text-gray-900">服务条款</span>
            </div>
            <span className="text-gray-400">→</span>
          </button>
          <button onClick={() => navigate('/privacy')} className="w-full px-5 py-4 flex items-center justify-between border-t border-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-xl">🛡️</span>
              <span className="text-sm text-gray-900">隐私政策</span>
            </div>
            <span className="text-gray-400">→</span>
          </button>
        </div>

        {/* 危险操作 */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <h3 className="text-sm font-bold text-red-500 px-5 pt-5 pb-3">危险操作</h3>
          <button onClick={handleLogout} className="w-full px-5 py-4 flex items-center justify-between border-t border-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-xl">🚪</span>
              <span className="text-sm text-gray-900">退出登录</span>
            </div>
          </button>
          <button onClick={() => setShowDeleteConfirm(true)} className="w-full px-5 py-4 flex items-center justify-between border-t border-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <span className="text-sm text-red-500">注销账号</span>
            </div>
          </button>
        </div>

        {/* 版本号 */}
        <div className="text-center pt-4">
          <p className="text-xs text-gray-300">巨浪 v1.0.0</p>
        </div>
      </div>

      {/* 注销确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-5">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">确认注销账号？</h3>
            <p className="text-sm text-gray-500 mb-6">注销后数据将无法恢复，请谨慎操作。请联系客服处理。</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-gray-100 rounded-xl text-sm font-medium">取消</button>
              <button onClick={handleDeleteAccount} className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-bold">确认注销</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
