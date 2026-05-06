import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { signUp } from '../lib/api/client'

export default function Register({ setUser }: { setUser: any }) {
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
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
    if (password !== confirm) { setError('两次密码不一致'); return }
    if (password.length < 6) { setError('密码至少6位'); return }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError('用户名只能包含英文、数字和下划线'); return }
    if (username.length < 3 || username.length > 20) { setError('用户名3-20个字符'); return }

    setLoading(true)
    setError('')

    try {
      const data = await signUp(username.toLowerCase(), password, name || username, refCode || undefined)
      // 注册成功 = 自动登录，设置 user 状态
      setUser({
        id: data.user.id,
        name: data.user.name,
        username: data.user.username,
        avatar: data.user.avatar,
        bio: data.user.bio || '',
        tags: data.user.tags || [],
        points: data.user.points || 0,
        level: data.user.level || 1,
      })
      nav('/')
    } catch (err: any) {
      const msg = err.message || ''
      if (msg.includes('用户名已存在')) setError('该用户名已被注册')
      else setError(msg || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-8 max-w-lg mx-auto w-full">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/20">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 18C6 12 14 6 18 6C22 6 30 12 32 18C30 24 22 30 18 30C14 30 6 24 4 18Z" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M4 18C8 14 14 12 18 12C22 12 28 14 32 18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M10 18C12 15 15 14 18 14C21 14 24 15 26 18" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">加入巨浪</h1>
          <p className="text-gray-400 text-sm">创建账号，开始你的造梗之旅</p>
        </div>

        <div className="space-y-4 mb-6">
          <input
            type="text" placeholder="昵称（显示名称，可不填）" value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
            className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          <input
            type="text" placeholder="账号（英文，3-20位）" value={username}
            onChange={e => setUsername(e.target.value.toLowerCase())}
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
            className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          <input type="password" placeholder="密码（至少6位）" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
            className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-gray-200" />
          <input type="password" placeholder="确认密码" value={confirm}
            onChange={e => setConfirm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
            className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-gray-200" />
          <div>
            <input type="text" placeholder="邀请码（可选，多得50积分）" value={refCode}
              onChange={e => setRefCode(e.target.value.toUpperCase())} maxLength={6}
              className="w-full px-5 py-4 bg-purple-50 rounded-2xl text-base font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-200" />
            {refCode && <p className="text-xs text-purple-500 mt-1 ml-2">✅ 使用邀请码注册，额外获得50积分！</p>}
          </div>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl text-center">{error}</div>}

        <button onClick={handleRegister} disabled={loading || !username || !password}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${loading || !username || !password ? 'bg-gray-200 text-gray-400' : 'bg-black text-white active:scale-[0.98]'}`}>
          {loading ? '注册中...' : '注册'}
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          注册即表示你同意我们的 <button onClick={() => nav('/terms')} className="underline">服务条款</button> 和 <button onClick={() => nav('/privacy')} className="underline">隐私政策</button>
        </p>

        <div className="text-center mt-6">
          <span className="text-gray-400 text-sm">已有账号？</span>
          <button onClick={() => nav('/login')} className="text-sm font-medium text-gray-900 ml-1">登录</button>
        </div>
      </div>
    </div>
  )
}
