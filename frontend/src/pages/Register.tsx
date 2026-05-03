import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase, earnPoints, unlockAchievement } from '../lib/supabase/client'
import { toast } from '../lib/toast'

// 随机昵称生成器
const ADJECTIVES = ['快乐的', '勇敢的', '聪明的', '幸运的', '可爱的', '酷酷的', '神秘的', '闪亮的', '温柔的', '无敌的', '潇洒的', '呆萌的', '霸气的', '暖心的', '搞笑的']
const ANIMALS = ['小海豚', '小鲸鱼', '小海鸥', '小章鱼', '小水母', '小海星', '小螃蟹', '小鲨鱼', '小海马', '小贝壳', '小浪花', '小帆船', '小灯塔', '小企鹅', '小北极熊']
function randomNickname() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  const num = Math.floor(Math.random() * 999) + 1
  return `${adj}${animal}${num}`
}

export default function Register({ setUser }: { setUser: any }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [refCode, setRefCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const [usernameOk, setUsernameOk] = useState<boolean | null>(null)
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
        const { data } = await supabase.from('users').select('id').eq('username', username.toLowerCase()).maybeSingle()
        setUsernameOk(!data)
      } catch { setUsernameOk(null) }
      finally { setChecking(false) }
    }, 500)
    return () => clearTimeout(timer)
  }, [username])

  const handleRegister = async () => {
    if (!username || !password) return
    if (password !== confirm) { setError('两次密码不一致'); return }
    if (password.length < 6) { setError('密码至少6位'); return }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError('用户名只能包含英文、数字和下划线'); return }
    if (username.length < 3 || username.length > 20) { setError('用户名3-20个字符'); return }
    if (usernameOk === false) { setError('用户名已被占用'); return }

    setLoading(true)
    setError('')

    try {
      const email = `${username.toLowerCase()}@julang.app`
      const { data, error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) throw authError

      // 如果需要邮箱验证，直接尝试登录
      if (!data.session) {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password })
        if (loginError) throw loginError
        data.session = loginData.session
        data.user = loginData.user
      }

      if (data.user) {
        const nickname = randomNickname()

        // 检查是否是种子用户（前 10000 名）
        const { count } = await supabase.from('users').select('*', { count: 'exact', head: true })
        const isSeedUser = (count || 0) < 10000

        // 创建用户记录
        const { error: dbError } = await supabase.from('users').insert({
          id: data.user.id,
          username: username.toLowerCase(),
          name: nickname,
          avatar: '👤',
          bio: '',
          tags: [],
          points: 100,
          level: 1,
        })
        if (dbError) throw dbError

        // 种子用户成就（前 10000 名）
        let bonusPoints = 0
        if (isSeedUser) {
          try {
            await unlockAchievement(data.user.id, 'seed-user', 200)
            bonusPoints += 200
          } catch {}
        }

        // 处理邀请码
        if (refCode.trim()) {
          try {
            const { data: codeData } = await supabase.from('referral_codes').select('*').eq('code', refCode.trim()).maybeSingle()
            if (codeData) {
              await supabase.from('referrals').insert({
                referrer_id: codeData.user_id,
                referred_id: data.user.id,
                referral_code: refCode.trim(),
                status: 'registered',
                referrer_reward: 100,
                referred_reward: 50,
              })
              try { await earnPoints(codeData.user_id, 100, 'invite', `邀请新用户 ${nickname}`) } catch {}
              try { await earnPoints(data.user.id, 50, 'invite', '使用邀请码注册') } catch {}
              await supabase.from('referral_codes').update({ uses_count: (codeData.uses_count || 0) + 1 }).eq('id', codeData.id)
              bonusPoints = 50
            }
          } catch {}
        }

        const finalPoints = 100 + bonusPoints
        toast.success('注册成功！欢迎加入巨浪 🌊')
        if (isSeedUser) toast.info('🎁 恭喜成为种子用户！+200积分')

        setUser({
          id: data.user.id,
          name: nickname,
          username: username.toLowerCase(),
          avatar: '👤',
          bio: '',
          tags: [],
          points: finalPoints,
          level: 1,
          followers: 0,
          following: 0,
        })
        nav('/')
      }
    } catch (err: any) {
      const msg = err.message || ''
      if (msg.includes('already registered') || msg.includes('User already registered') || msg.includes('unique')) setError('用户名已被占用')
      else if (msg.includes('valid email')) setError('用户名格式不正确')
      else if (msg.includes('weak')) setError('密码强度不够')
      else setError(msg || '注册失败')
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
          <p className="text-gray-400 text-sm">只需用户名+密码，30秒完成注册</p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <input
              type="text" placeholder="用户名（英文，3-20位）" value={username}
              onChange={e => setUsername(e.target.value.toLowerCase())}
              onKeyDown={e => e.key === 'Enter' && handleRegister()}
              className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
            {username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username) && (
              <p className={`text-xs mt-1 ml-2 ${checking ? 'text-gray-400' : usernameOk ? 'text-green-500' : 'text-red-500'}`}>
                {checking ? '检查中...' : usernameOk ? '✅ 用户名可用' : '❌ 用户名已被占用'}
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

        <button onClick={handleRegister} disabled={loading || !username || !password}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${loading || !username || !password ? 'bg-gray-200 text-gray-400' : 'bg-black text-white active:scale-[0.98]'}`}>
          {loading ? '注册中...' : refCode ? '注册 (+150积分)' : '注册 (+100积分)'}
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
