import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase, checkUsername } from '../lib/supabase/client'

// 随机昵称（由数据库触发器生成）

export default function Register() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [refCode, setRefCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const [usernameOk, setUsernameOk] = useState<boolean | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const nav = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) setRefCode(ref.toUpperCase())
  }, [searchParams])

  // 检查用户名是否可用
  useEffect(() => {
    if (username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameOk(null)
      return
    }
    setChecking(true)
    const timer = setTimeout(async () => {
      try {
        const available = await checkUsername(username.toLowerCase())
        setUsernameOk(available)
      } catch { setUsernameOk(null) }
      finally { setChecking(false) }
    }, 500)
    return () => clearTimeout(timer)
  }, [username])

  const handleRegister = async () => {
    if (!email || !username || !password) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('请输入正确的邮箱地址'); return }
    if (password !== confirm) { setError('两次密码不一致'); return }
    if (password.length < 6) { setError('密码至少6位'); return }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError('用户名只能包含英文、数字和下划线'); return }
    if (username.length < 3 || username.length > 20) { setError('用户名3-20个字符'); return }
    if (usernameOk === false) { setError('用户名已被占用'); return }

    setLoading(true)
    setError('')

    try {
      // 注册（Supabase 会自动发验证邮件，触发器自动创建用户记录）
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: {
          data: {
            username: username.toLowerCase(),
          }
        }
      })
      if (authError) throw authError

      // 邀请码记录（如果有的话）
      if (refCode.trim()) {
        try {
          const { data: codeData } = await supabase.from('referral_codes').select('*').eq('code', refCode.trim()).maybeSingle()
          if (codeData) {
            // 记录邀请关系，等用户验证邮箱后再结算奖励
            await supabase.from('referrals').insert({
              referrer_id: codeData.user_id,
              referred_id: data.user!.id,
              referral_code: refCode.trim(),
              status: 'pending',
              referrer_reward: 100,
              referred_reward: 50,
            })
          }
        } catch {}
      }

      // 无论是否需要邮箱验证，都显示验证提示
      setEmailSent(true)
    } catch (err: any) {
      const msg = err.message || ''
      if (msg.includes('already registered') || msg.includes('User already registered')) setError('该邮箱已注册')
      else if (msg.includes('valid email')) setError('邮箱格式不正确')
      else if (msg.includes('weak')) setError('密码强度不够')
      else setError(msg || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  // 邮箱验证完成页面
  if (emailSent) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-1 flex flex-col justify-center px-8 max-w-lg mx-auto w-full text-center">
          <div className="w-20 h-20 bg-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">📧</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">验证你的邮箱</h1>
          <p className="text-gray-500 text-sm mb-2">我们已向 <span className="font-medium text-gray-900">{email}</span> 发送了验证邮件</p>
          <p className="text-gray-400 text-sm mb-8">点击邮件中的链接完成注册，然后返回登录</p>
          <button onClick={() => nav('/login')} className="w-full py-4 bg-black text-white rounded-2xl font-bold text-base active:scale-[0.98] transition-transform">
            去登录
          </button>
          <p className="text-xs text-gray-400 mt-4">没收到邮件？检查垃圾邮件文件夹</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-8 max-w-lg mx-auto w-full">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-black/10">
            <span className="text-3xl text-white font-bold">浪</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">加入巨浪</h1>
          <p className="text-gray-400 text-sm">邮箱注册，开始你的造梗之旅</p>
        </div>

        <div className="space-y-4 mb-6">
          <input
            type="email" placeholder="邮箱地址" value={email}
            onChange={e => setEmail(e.target.value.toLowerCase())}
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
            className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          <div>
            <input
              type="text" placeholder="账号（英文，3-20位）" value={username}
              onChange={e => setUsername(e.target.value.toLowerCase())}
              onKeyDown={e => e.key === 'Enter' && handleRegister()}
              className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
            {username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username) && (
              <p className={`text-xs mt-1 ml-2 ${checking ? 'text-gray-400' : usernameOk ? 'text-green-500' : 'text-red-500'}`}>
                {checking ? '检查中...' : usernameOk ? '✅ 账号可用' : '❌ 账号已被占用'}
              </p>
            )}
          </div>
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

        <button onClick={handleRegister} disabled={loading || !email || !username || !password}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${loading || !email || !username || !password ? 'bg-gray-200 text-gray-400' : 'bg-black text-white active:scale-[0.98]'}`}>
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
