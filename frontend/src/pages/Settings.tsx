// ===== 璐﹀彿璁剧疆 =====

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut, signIn, updatePassword, getUserById } from '../lib/api/client'
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
    if (!oldPwd || !newPwd) { toast.warning('璇峰～鍐欏畬鏁?); return }
    if (newPwd.length < 6) { toast.warning('鏂板瘑鐮佽嚦灏?浣?); return }
    if (newPwd !== confirmPwd) { toast.warning('涓ゆ瀵嗙爜涓嶄竴鑷?); return }
    if (oldPwd === newPwd) { toast.warning('鏂版棫瀵嗙爜涓嶈兘鐩稿悓'); return }

    setChangingPwd(true)
    try {
      // 鍏堥獙璇佹棫瀵嗙爜
      const email = `${user.username}@julang.app`
      try {
        await signIn(user.username, oldPwd)
      } catch {
        toast.error('鍘熷瘑鐮侀敊璇?); return
      }

      // 鏇存柊瀵嗙爜
      try {
        await updatePassword(oldPwd, newPwd)
      } catch (err: any) { throw new Error(err.message || '淇敼澶辫触') }

      toast.success('瀵嗙爜淇敼鎴愬姛')
      setOldPwd('')
      setNewPwd('')
      setConfirmPwd('')
      setShowPwdForm(false)
    } catch (e: any) {
      toast.error(e.message || '淇敼澶辫触')
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
    toast.info('璇疯仈绯诲鏈嶅鐞嗚处鍙锋敞閿€')
    setShowDeleteConfirm(false)
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* 澶撮儴 */}
      <div className="bg-white px-5 pt-12 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-gray-400">鈫?杩斿洖</button>
          <h1 className="text-base font-bold text-gray-900">璁剧疆</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* 璐﹀彿淇℃伅 */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-3">璐﹀彿淇℃伅</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">鐢ㄦ埛鍚?/span>
              <span className="text-sm font-mono text-gray-900">{user?.username}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">閭</span>
              <span className="text-sm text-gray-900">{user?.username}@julang.app</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">娉ㄥ唽鏃堕棿</span>
              <span className="text-sm text-gray-900">{user?.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}</span>
            </div>
          </div>
        </div>

        {/* 瀹夊叏璁剧疆 */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <h3 className="text-sm font-bold text-gray-900 px-5 pt-5 pb-3">瀹夊叏璁剧疆</h3>

          <button onClick={() => setShowPwdForm(!showPwdForm)} className="w-full px-5 py-4 flex items-center justify-between border-t border-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-xl">馃敀</span>
              <span className="text-sm text-gray-900">淇敼瀵嗙爜</span>
            </div>
            <span className="text-gray-400">{showPwdForm ? '鈻? : '鈻?}</span>
          </button>

          {showPwdForm && (
            <div className="px-5 pb-5 space-y-3">
              <input type="password" placeholder="鍘熷瘑鐮? value={oldPwd} onChange={e => setOldPwd(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              <input type="password" placeholder="鏂板瘑鐮侊紙鑷冲皯6浣嶏級" value={newPwd} onChange={e => setNewPwd(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              <input type="password" placeholder="纭鏂板瘑鐮? value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              <button onClick={handleChangePassword} disabled={changingPwd}
                className={`w-full py-3 rounded-xl font-bold text-sm ${changingPwd ? 'bg-gray-200 text-gray-400' : 'bg-black text-white active:scale-[0.98]'}`}>
                {changingPwd ? '淇敼涓?..' : '纭淇敼'}
              </button>
            </div>
          )}

          <button onClick={() => navigate('/edit-profile')} className="w-full px-5 py-4 flex items-center justify-between border-t border-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-xl">鉁忥笍</span>
              <span className="text-sm text-gray-900">缂栬緫璧勬枡</span>
            </div>
            <span className="text-gray-400">鈫?/span>
          </button>
        </div>

        {/* 閫氱煡璁剧疆 */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <h3 className="text-sm font-bold text-gray-900 px-5 pt-5 pb-3">閫氱煡</h3>
          <button onClick={() => navigate('/notifications')} className="w-full px-5 py-4 flex items-center justify-between border-t border-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-xl">馃敂</span>
              <span className="text-sm text-gray-900">閫氱煡鍒楄〃</span>
            </div>
            <span className="text-gray-400">鈫?/span>
          </button>
        </div>

        {/* 鍏充簬 */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <h3 className="text-sm font-bold text-gray-900 px-5 pt-5 pb-3">鍏充簬</h3>
          <button onClick={() => navigate('/about')} className="w-full px-5 py-4 flex items-center justify-between border-t border-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-xl">鈩癸笍</span>
              <span className="text-sm text-gray-900">鍏充簬宸ㄦ氮</span>
            </div>
            <span className="text-gray-400">鈫?/span>
          </button>
          <button onClick={() => navigate('/terms')} className="w-full px-5 py-4 flex items-center justify-between border-t border-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-xl">馃搫</span>
              <span className="text-sm text-gray-900">鏈嶅姟鏉℃</span>
            </div>
            <span className="text-gray-400">鈫?/span>
          </button>
          <button onClick={() => navigate('/privacy')} className="w-full px-5 py-4 flex items-center justify-between border-t border-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-xl">馃洝锔?/span>
              <span className="text-sm text-gray-900">闅愮鏀跨瓥</span>
            </div>
            <span className="text-gray-400">鈫?/span>
          </button>
        </div>

        {/* 鍗遍櫓鎿嶄綔 */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <h3 className="text-sm font-bold text-red-500 px-5 pt-5 pb-3">鍗遍櫓鎿嶄綔</h3>
          <button onClick={handleLogout} className="w-full px-5 py-4 flex items-center justify-between border-t border-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-xl">馃毆</span>
              <span className="text-sm text-gray-900">閫€鍑虹櫥褰?/span>
            </div>
          </button>
          <button onClick={() => setShowDeleteConfirm(true)} className="w-full px-5 py-4 flex items-center justify-between border-t border-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-xl">鈿狅笍</span>
              <span className="text-sm text-red-500">娉ㄩ攢璐﹀彿</span>
            </div>
          </button>
        </div>

        {/* 鐗堟湰鍙?*/}
        <div className="text-center pt-4">
          <p className="text-xs text-gray-300">宸ㄦ氮 v1.0.0</p>
        </div>
      </div>

      {/* 娉ㄩ攢纭寮圭獥 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-5">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">纭娉ㄩ攢璐﹀彿锛?/h3>
            <p className="text-sm text-gray-500 mb-6">娉ㄩ攢鍚庢暟鎹皢鏃犳硶鎭㈠锛岃璋ㄦ厧鎿嶄綔銆傝鑱旂郴瀹㈡湇澶勭悊銆?/p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-gray-100 rounded-xl text-sm font-medium">鍙栨秷</button>
              <button onClick={handleDeleteAccount} className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-bold">纭娉ㄩ攢</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

