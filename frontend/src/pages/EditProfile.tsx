// ===== 缂栬緫璧勬枡 =====

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from '../lib/toast'
import { updateUser } from '../lib/api/client'

const AVATAR_OPTIONS = ['馃懁', '馃槑', '馃', '馃懟', '馃惐', '馃惗', '馃', '馃惣', '馃', '馃惛', '馃尭', '鈿?, '馃敟', '馃寠', '馃拵', '馃幃', '馃幐', '馃帹', '馃殌', '馃寵']

export default function EditProfile({ user, setUser }: { user: any; setUser: (u: any) => void }) {
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [avatar, setAvatar] = useState(user?.avatar || '馃懁')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) { toast.warning('鏄电О涓嶈兘涓虹┖'); return }
    if (name.length > 20) { toast.warning('鏄电О鏈€澶?0涓瓧'); return }
    if (bio.length > 100) { toast.warning('绠€浠嬫渶澶?00涓瓧'); return }

    setSaving(true)
    try {
      await updateUser(user.id, { name: name.trim(), bio: bio.trim(), avatar })

      setUser({ ...user, name: name.trim(), bio: bio.trim(), avatar })
      toast.success('淇濆瓨鎴愬姛')
      navigate(-1)
    } catch (e: any) {
      toast.error(e.message || '淇濆瓨澶辫触')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* 澶撮儴 */}
      <div className="bg-white px-5 pt-12 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-gray-400">鈫?鍙栨秷</button>
          <h1 className="text-base font-bold text-gray-900">缂栬緫璧勬枡</h1>
          <button onClick={handleSave} disabled={saving} className={`text-sm font-bold ${saving ? 'text-gray-400' : 'text-blue-500'}`}>
            {saving ? '淇濆瓨涓?..' : '淇濆瓨'}
          </button>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* 澶村儚閫夋嫨 */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-3">澶村儚</h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-5xl">{avatar}</div>
            <div>
              <p className="text-sm text-gray-600">閫夋嫨涓€涓ご鍍?/p>
              <p className="text-xs text-gray-400">鎴栬€呬笂浼犺嚜瀹氫箟澶村儚锛堝嵆灏嗘敮鎸侊級</p>
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

        {/* 鏄电О */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-3">鏄电О</h3>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="杈撳叆鏄电О"
            maxLength={20}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{name.length}/20</p>
        </div>

        {/* 绠€浠?*/}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-3">绠€浠?/h3>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="浠嬬粛涓€涓嬭嚜宸?.."
            maxLength={100}
            rows={3}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{bio.length}/100</p>
        </div>

        {/* 鐢ㄦ埛鍚嶏紙鍙锛?*/}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-3">鐢ㄦ埛鍚?/h3>
          <div className="px-4 py-3 bg-gray-100 rounded-xl text-base text-gray-500">{user?.username}</div>
          <p className="text-xs text-gray-400 mt-1">鐢ㄦ埛鍚嶄笉鍙慨鏀?/p>
        </div>

        {/* 璐﹀彿淇℃伅 */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-3">璐﹀彿淇℃伅</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">娉ㄥ唽鏃堕棿</span>
              <span className="text-sm text-gray-900">{user?.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">鐢ㄦ埛ID</span>
              <span className="text-xs text-gray-400 font-mono">{user?.id?.slice(0, 8)}...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

