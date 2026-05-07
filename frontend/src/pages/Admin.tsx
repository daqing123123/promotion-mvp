// ===== 后台管理面板 =====

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE } from '../lib/api/client'

interface AdminProps {
  user: any
}

interface Stats {
  totalUsers: number
  totalContents: number
  totalTopics: number
  totalComments: number
  totalLikes: number
  todayUsers: number
  todayContents: number
  yesterdayContents: number
}

interface AdminUser {
  id: string
  username: string
  name: string
  avatar: string
  level: number
  points: number
  is_admin: number
  is_banned: number
  created_at: string
}

interface AdminContent {
  id: string
  title: string
  content_type: string
  user_id: string
  username: string
  name: string
  like_count: number
  comment_count: number
  view_count: number
  created_at: string
}

function getToken() {
  const saved = localStorage.getItem('julang_user')
  if (!saved) return ''
  try { return JSON.parse(saved).token || '' } catch { return '' }
}

async function fetchAdmin(url: string, opts?: RequestInit) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
      ...opts?.headers,
    },
  })
  if (res.status === 403) throw new Error('NO_PERMISSION')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export default function Admin({ user }: AdminProps) {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'dashboard' | 'users' | 'contents'>('dashboard')
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [noPermission, setNoPermission] = useState(false)

  // ============ 仪表盘 ============
  const loadStats = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchAdmin('/api/admin/stats')
      setStats(data)
      setNoPermission(false)
    } catch (err: any) {
      if (err.message === 'NO_PERMISSION') setNoPermission(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  if (noPermission) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-lg font-bold text-white mb-2">没有管理权限</h2>
          <p className="text-slate-400 text-sm mb-6">只有管理员才能访问后台</p>
          <button onClick={() => navigate('/')} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium">
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* 顶栏 */}
      <header className="sticky top-0 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 z-40 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white text-lg">←</button>
          <h1 className="text-lg font-bold text-white">管理面板</h1>
        </div>
        <span className="text-xs text-slate-500">管理员: {user?.username}</span>
      </header>

      {/* 标签页 */}
      <div className="px-4 py-3">
        <div className="flex gap-1.5 bg-slate-800/50 rounded-xl p-1">
          {[
            { key: 'dashboard' as const, label: '概览' },
            { key: 'users' as const, label: '用户' },
            { key: 'contents' as const, label: '内容' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ============ 概览 tab ============ */}
      {tab === 'dashboard' && (
        <div className="px-4 space-y-4">
          {loading ? (
            <div className="text-center py-16 text-slate-500">加载中...</div>
          ) : stats ? (
            <>
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-indigo-500 rounded-full" />数据总览
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="注册用户" value={stats.totalUsers} color="text-indigo-400" />
                  <StatCard label="总内容" value={stats.totalContents} color="text-emerald-400" />
                  <StatCard label="话题数" value={stats.totalTopics} color="text-amber-400" />
                  <StatCard label="互动总数" value={stats.totalComments + stats.totalLikes} color="text-rose-400" />
                </div>
              </div>

              <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />今日动态
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="今日新用户" value={stats.todayUsers} color="text-cyan-400" />
                  <StatCard label="今日新内容" value={stats.todayContents} color="text-cyan-400" />
                </div>
              </div>

              <div className="bg-slate-800/20 border border-slate-700/30 rounded-2xl p-4 mt-2">
                <p className="text-xs text-slate-500 leading-relaxed">
                  昨晚新增 {stats.yesterdayContents} 条内容 · 评论共 {stats.totalComments} 条 · 点赞共 {stats.totalLikes} 次
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-slate-500">加载失败</div>
          )}
        </div>
      )}

      {/* ============ 用户 tab ============ */}
      {tab === 'users' && <UsersTab />}

      {/* ============ 内容 tab ============ */}
      {tab === 'contents' && <ContentsTab />}
    </div>
  )
}

// ============ 数据卡片 ============
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-4">
      <div className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  )
}

// ============ 用户管理 ============
function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const limit = 20

  const loadUsers = useCallback(async (p: number, q: string) => {
    setLoading(true)
    try {
      const data = await fetchAdmin(`/api/admin/users?page=${p}&limit=${limit}&search=${encodeURIComponent(q)}`)
      setUsers(data.users)
      setTotal(data.total)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { loadUsers(page, search) }, [page, search])

  const toggleBan = async (u: AdminUser) => {
    try {
      await fetchAdmin(`/api/admin/users/${u.id}`, {
        method: 'PUT', body: JSON.stringify({ is_banned: !u.is_banned })
      })
      loadUsers(page, search)
    } catch {}
  }

  const toggleAdmin = async (u: AdminUser) => {
    try {
      await fetchAdmin(`/api/admin/users/${u.id}`, {
        method: 'PUT', body: JSON.stringify({ is_admin: !u.is_admin })
      })
      loadUsers(page, search)
    } catch {}
  }

  return (
    <div className="px-4">
      {/* 搜索 */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="搜索用户名..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-white text-sm placeholder-slate-500 focus:border-indigo-500 outline-none"
        />
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500">加载中...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-slate-500">没有用户</div>
      ) : (
        <>
          <div className="space-y-1.5">
            {users.map((u) => (
              <div key={u.id} className={`flex items-center gap-3 p-3 rounded-xl bg-slate-800/20 border ${u.is_banned ? 'border-rose-500/30' : 'border-slate-800/50'}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${u.is_banned ? 'bg-rose-900/30 text-rose-400' : 'bg-indigo-600/30 text-indigo-400'}`}>
                  {(u.name || u.username)[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-white truncate">{u.name || u.username}</span>
                    {u.is_admin ? <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">管理员</span> : null}
                    {u.is_banned ? <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded">已封</span> : null}
                  </div>
                  <div className="text-xs text-slate-500">@{u.username} · Lv.{u.level} · {u.points}分</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => toggleAdmin(u)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition ${
                      u.is_admin ? 'bg-amber-600/20 text-amber-400' : 'bg-slate-800 text-slate-500 hover:text-amber-400'
                    }`}
                  >
                    {u.is_admin ? '降' : '升'}
                  </button>
                  <button
                    onClick={() => toggleBan(u)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition ${
                      u.is_banned ? 'bg-emerald-600/20 text-emerald-400' : 'bg-rose-600/20 text-rose-400'
                    }`}
                  >
                    {u.is_banned ? '解封' : '封禁'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 分页 */}
          {total > limit && (
            <div className="flex justify-center gap-2 pt-4 pb-8">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-400 disabled:opacity-30"
              >
                上一页
              </button>
              <span className="px-3 py-1.5 text-xs text-slate-500">{page}/{Math.ceil(total / limit)}</span>
              <button
                disabled={page >= Math.ceil(total / limit)}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-400 disabled:opacity-30"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ============ 内容管理 ============
function ContentsTab() {
  const [contents, setContents] = useState<AdminContent[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const limit = 20

  const loadContents = useCallback(async (p: number, q: string) => {
    setLoading(true)
    try {
      const data = await fetchAdmin(`/api/admin/contents?page=${p}&limit=${limit}&search=${encodeURIComponent(q)}`)
      setContents(data.contents)
      setTotal(data.total)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { loadContents(page, search) }, [page, search])

  const deleteContent = async (id: string) => {
    if (!confirm('确定删除？评论点赞也会清掉')) return
    setDeleting(id)
    try {
      await fetchAdmin(`/api/admin/contents/${id}`, { method: 'DELETE' })
      loadContents(page, search)
    } catch {} finally { setDeleting(null) }
  }

  return (
    <div className="px-4">
      {/* 搜索 */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="搜索内容标题或作者..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-white text-sm placeholder-slate-500 focus:border-indigo-500 outline-none"
        />
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500">加载中...</div>
      ) : contents.length === 0 ? (
        <div className="text-center py-16 text-slate-500">没有内容</div>
      ) : (
        <>
          <div className="space-y-1.5">
            {contents.map((c) => (
              <div key={c.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/20 border border-slate-800/50">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate mb-1">{c.title || '无标题'}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                    <span>{c.username}</span>
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">{c.content_type}</span>
                    <span>❤️{c.like_count}</span>
                    <span>💬{c.comment_count}</span>
                  </div>
                  <div className="text-[10px] text-slate-600 mt-1">
                    {new Date(c.created_at).toLocaleDateString('zh-CN')}
                  </div>
                </div>
                <button
                  onClick={() => deleteContent(c.id)}
                  disabled={deleting === c.id}
                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 shrink-0 disabled:opacity-50"
                >
                  {deleting === c.id ? '...' : '删除'}
                </button>
              </div>
            ))}
          </div>

          {/* 分页 */}
          {total > limit && (
            <div className="flex justify-center gap-2 pt-4 pb-8">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-400 disabled:opacity-30"
              >
                上一页
              </button>
              <span className="px-3 py-1.5 text-xs text-slate-500">{page}/{Math.ceil(total / limit)}</span>
              <button
                disabled={page >= Math.ceil(total / limit)}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-400 disabled:opacity-30"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
