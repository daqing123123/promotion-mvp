// @ts-nocheck
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn } from '../lib/api/client'
import { toast } from '../lib/toast'

export default function Login({ setUser }: { setUser: any }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const nav = useNavigate()

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) return
    setLoading(true)
    setError('')

    try {
      const { user, token } = await signIn(username.trim().toLowerCase(), password)

      setUser({
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        tags: user.tags || [],
        points: user.points,
        level: user.level,
      })
      nav('/')
    } catch (err: any) {
      const msg = err.message || ''
      if (msg.includes('鐢ㄦ埛鍚嶆垨瀵嗙爜閿欒')) setError('鐢ㄦ埛鍚嶆垨瀵嗙爜閿欒')
      else if (msg.includes('浠婃棩璇ョ被绉垎宸茶揪涓婇檺')) setError('浠婃棩绉垎宸茶揪涓婇檺')
      else setError(msg || '鐧诲綍澶辫触')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    toast.warning('璇疯仈绯荤鐞嗗憳閲嶇疆瀵嗙爜')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-8 max-w-lg mx-auto w-full">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-black/10">
            <span className="text-3xl text-white font-bold">娴?/span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">娆㈣繋鍥炴潵</h1>
          <p className="text-gray-400 text-sm">鐧诲綍浣犵殑宸ㄦ氮璐﹀彿</p>
        </div>

        <div className="space-y-4 mb-6">
          <input
            type="text" placeholder="璐﹀彿" value={username}
            onChange={e => setUsername(e.target.value.toLowerCase())}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          <input
            type="password" placeholder="瀵嗙爜" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl text-center">{error}</div>}

        <button onClick={handleLogin} disabled={loading || !username.trim() || !password.trim()}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${loading || !username.trim() || !password.trim() ? 'bg-gray-200 text-gray-400' : 'bg-black text-white active:scale-[0.98]'}`}>
          {loading ? '鐧诲綍涓?..' : '鐧诲綍'}
        </button>

        <div className="flex justify-between items-center mt-4">
          <button onClick={() => nav('/register')} className="text-sm text-gray-400">
            娌℃湁璐﹀彿锛?span className="text-gray-900 font-medium">娉ㄥ唽</span>
          </button>
          <button onClick={handleForgotPassword} className="text-sm text-gray-400 underline">
            蹇樿瀵嗙爜锛?          </button>
        </div>
      </div>
    </div>
  )
}
