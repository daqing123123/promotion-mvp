// @ts-nocheck
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { signUp } from '../lib/api/client'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [name, setName] = useState('')
  const [refCode, setRefCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const nav = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) setRefCode(ref.toUpperCase())
  }, [searchParams])

  const handleRegister = async () => {
    if (!username || !password) return
    if (password !== confirm) { setError('涓ゆ瀵嗙爜涓嶄竴鑷?); return }
    if (password.length < 6) { setError('瀵嗙爜鑷冲皯6浣?); return }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError('鐢ㄦ埛鍚嶅彧鑳藉寘鍚嫳鏂囥€佹暟瀛楀拰涓嬪垝绾?); return }
    if (username.length < 3 || username.length > 20) { setError('鐢ㄦ埛鍚?-20涓瓧绗?); return }

    setLoading(true)
    setError('')

    try {
      await signUp(username.toLowerCase(), password, name || username)
      nav('/')
    } catch (err: any) {
      const msg = err.message || ''
      if (msg.includes('宸插瓨鍦?)) setError('鐢ㄦ埛鍚嶅凡瀛樺湪')
      else setError(msg || '娉ㄥ唽澶辫触')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-8 max-w-lg mx-auto w-full">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-black/10">
            <span className="text-3xl text-white font-bold">娴?/span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">鍔犲叆宸ㄦ氮</h1>
          <p className="text-gray-400 text-sm">娉ㄥ唽璐﹀彿锛屽紑濮嬩綘鐨勯€犳涔嬫梾</p>
        </div>

        <div className="space-y-4 mb-6">
          <input
            type="text" placeholder="璐﹀彿锛堣嫳鏂囷紝3-20浣嶏級" value={username}
            onChange={e => setUsername(e.target.value.toLowerCase())}
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
            className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          <input
            type="text" placeholder="鏄电О锛堝彲閫夛級" value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
            className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          <input type="password" placeholder="瀵嗙爜锛堣嚦灏?浣嶏級" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
            className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-gray-200" />
          <input type="password" placeholder="纭瀵嗙爜" value={confirm}
            onChange={e => setConfirm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
            className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-gray-200" />
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl text-center">{error}</div>}

        <button onClick={handleRegister} disabled={loading || !username || !password}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${loading || !username || !password ? 'bg-gray-200 text-gray-400' : 'bg-black text-white active:scale-[0.98]'}`}>
          {loading ? '娉ㄥ唽涓?..' : '娉ㄥ唽'}
        </button>

        <div className="text-center mt-6">
          <span className="text-gray-400 text-sm">宸叉湁璐﹀彿锛?/span>
          <button onClick={() => nav('/login')} className="text-sm font-medium text-gray-900 ml-1">鐧诲綍</button>
        </div>
      </div>
    </div>
  )
}
