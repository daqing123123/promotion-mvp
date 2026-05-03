import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase/client'
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
      const email = `${username.trim().toLowerCase()}@julang.app`
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError

      // 获取用户信息
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (dbError) throw dbError

      setUser({
        id: userData.id,
        name: userData.name,
        username: userData.username,
        avatar: userData.avatar,
        bio: userData.bio,
        tags: userData.tags || [],
        points: userData.points,
        level: userData.level,
        followers: userData.follower_count,
        following: userData.following_count,
      })
      nav('/')
    } catch (err: any) {
      const msg = err.message || ''
      if (msg.includes('Invalid login') || msg.includes('invalid_credentials')) setError('用户名或密码错误')
      else if (msg.includes('Email not confirmed') || msg.includes('not confirmed')) {
        // 尝试自动登录（Supabase 邮箱验证关闭时的兼容处理）
        setError('用户名或密码错误')
      }
      else if (msg.includes('Too many')) setError('登录太频繁，请稍后再试')
      else setError(msg || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-8 max-w-lg mx-auto w-full">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-black/10">
            <span className="text-3xl text-white font-bold">浪</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">欢迎回来</h1>
          <p className="text-gray-400 text-sm">登录你的巨浪账号</p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <input
              type="text"
              placeholder="用户名"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase())}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl text-center">{error}</div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading || !username.trim() || !password.trim()}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
            loading || !username.trim() || !password.trim()
              ? 'bg-gray-200 text-gray-400'
              : 'bg-black text-white active:scale-[0.98]'
          }`}
        >
          {loading ? '登录中...' : '登录'}
        </button>

        <div className="text-center mt-6">
          <span className="text-gray-400 text-sm">还没有账号？</span>
          <button onClick={() => nav('/register')} className="text-sm font-medium text-gray-900 ml-1">
            注册
          </button>
        </div>

        {/* 忘记密码 */}
        <div className="text-center mt-3">
          <button onClick={() => {
            if (!username.trim()) { setError('请先输入用户名'); return }
            const email = `${username.trim().toLowerCase()}@julang.app`
            supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/login' })
              .then(({ error }) => {
                if (error) toast.error(error.message)
                else toast.success('密码重置邮件已发送')
              })
          }} className="text-xs text-gray-400 underline">
            忘记密码？
          </button>
        </div>
      </div>
    </div>
  )
}
