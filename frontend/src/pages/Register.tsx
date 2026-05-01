import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase/client'

export default function Register({ setUser }: { setUser: any }) {
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const nav = useNavigate()

  const handleRegister = async () => {
    if (!username || !name || !password) return
    if (password !== confirm) { setError('两次密码不一致'); return }
    if (password.length < 6) { setError('密码至少6位'); return }

    setLoading(true)
    setError('')

    try {
      const email = `${username}@julang.app`
      const { data, error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) throw authError

      if (data.user) {
        const { error: dbError } = await supabase.from('users').insert({
          id: data.user.id,
          username,
          name,
          avatar: '👤',
          bio: '',
          tags: [],
          points: 100,
          level: 1,
        })
        if (dbError) throw dbError

        setUser({
          id: data.user.id,
          name,
          username,
          avatar: '👤',
          bio: '',
          tags: [],
          points: 100,
          level: 1,
          followers: 0,
          following: 0,
        })
        nav('/')
      }
    } catch (err: any) {
      setError(err.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-8 max-w-lg mx-auto w-full">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-black/10">
            <span className="text-3xl text-white font-bold">浪</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">加入巨浪</h1>
          <p className="text-gray-400 text-sm">开始你的造梗之旅</p>
        </div>

        <div className="space-y-4 mb-6">
          <input type="text" placeholder="用户名（英文）" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-gray-200" />
          <input type="text" placeholder="昵称" value={name} onChange={e => setName(e.target.value)} className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-gray-200" />
          <input type="password" placeholder="密码（至少6位）" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-gray-200" />
          <input type="password" placeholder="确认密码" value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-gray-200" />
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl text-center">{error}</div>}

        <button onClick={handleRegister} disabled={loading || !username || !name || !password} className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${loading || !username || !name || !password ? 'bg-gray-200 text-gray-400' : 'bg-black text-white active:scale-[0.98]'}`}>
          {loading ? '注册中...' : '注册'}
        </button>

        <div className="text-center mt-6">
          <span className="text-gray-400 text-sm">已有账号？</span>
          <button onClick={() => nav('/login')} className="text-sm font-medium text-gray-900 ml-1">登录</button>
        </div>
      </div>
    </div>
  )
}
