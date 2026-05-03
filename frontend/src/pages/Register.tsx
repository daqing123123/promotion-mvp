import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase, earnPoints } from '../lib/supabase/client'

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

  // 从 URL 读取邀请码
  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) setRefCode(ref.toUpperCase())
  }, [searchParams])

  const handleRegister = async () => {
    if (!username || !name || !password) return
    if (password !== confirm) { setError('两次密码不一致'); return }
    if (password.length < 6) { setError('密码至少6位'); return }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError('用户名只能包含英文、数字和下划线'); return }
    if (username.length < 3 || username.length > 20) { setError('用户名3-20个字符'); return }
    if (name.length > 20) { setError('昵称最多20个字'); return }

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

        // 处理邀请码
        if (refCode.trim()) {
          try {
            const { data: codeData } = await supabase
              .from('referral_codes')
              .select('*')
              .eq('code', refCode.trim())
              .maybeSingle()

            if (codeData) {
              // 创建邀请记录
              await supabase.from('referrals').insert({
                referrer_id: codeData.user_id,
                referred_id: data.user.id,
                referral_code: refCode.trim(),
                status: 'registered',
                referrer_reward: 100,
                referred_reward: 50,
              })

              // 给邀请人 +100 积分
              try { await earnPoints(codeData.user_id, 100, 'invite', `邀请新用户 ${name}`) } catch {}
              // 给被邀请人 +50 积分（加在注册的 100 之上）
              try { await earnPoints(data.user.id, 50, 'invite', `使用邀请码注册`) } catch {}

              // 更新邀请码使用次数
              await supabase.from('referral_codes')
                .update({ uses_count: (codeData.uses_count || 0) + 1 })
                .eq('id', codeData.id)
            }
          } catch {
            // 邀请码处理失败不影响注册
          }
        }

        setUser({
          id: data.user.id,
          name,
          username,
          avatar: '👤',
          bio: '',
          tags: [],
          points: refCode.trim() ? 150 : 100, // 有邀请码多 50
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

          {/* 邀请码（可选） */}
          <div>
            <input type="text" placeholder="邀请码（可选，多得50积分）" value={refCode} onChange={e => setRefCode(e.target.value.toUpperCase())} maxLength={6}
              className="w-full px-5 py-4 bg-purple-50 rounded-2xl text-base font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-200" />
            {refCode && <p className="text-xs text-purple-500 mt-1 ml-2">✅ 使用邀请码注册，额外获得50积分！</p>}
          </div>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl text-center">{error}</div>}

        <button onClick={handleRegister} disabled={loading || !username || !name || !password} className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${loading || !username || !name || !password ? 'bg-gray-200 text-gray-400' : 'bg-black text-white active:scale-[0.98]'}`}>
          {loading ? '注册中...' : refCode ? '注册 (+150积分)' : '注册 (+100积分)'}
        </button>

        <div className="text-center mt-6">
          <span className="text-gray-400 text-sm">已有账号？</span>
          <button onClick={() => nav('/login')} className="text-sm font-medium text-gray-900 ml-1">登录</button>
        </div>
      </div>
    </div>
  )
}
