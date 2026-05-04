// ===== 巨浪 API 客户端 =====
// 后端 API 地址通过 VITE_API_URL 环境变量配置

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function apiFetch(path: string, options: any = {}) {
  const token = localStorage.getItem('token')
  const headers: any = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '请求失败')
  return data
}

async function apiGet(path: string) { return apiFetch(path) }
async function apiPost(path: string, body: any) { return apiFetch(path, { method: 'POST', body: JSON.stringify(body) }) }
async function apiPut(path: string, body: any) { return apiFetch(path, { method: 'PUT', body: JSON.stringify(body) }) }

// ===== 认证 =====

export async function signUp(username: string, password: string, name: string) {
  const data = await apiPost('/api/auth/register', { username, password, name })
  localStorage.setItem('token', data.token)
  localStorage.setItem('user', JSON.stringify(data.user))
  return { user: data.user, session: { access_token: data.token } }
}

export async function signIn(username: string, password: string) {
  const data = await apiPost('/api/auth/login', { username, password })
  localStorage.setItem('token', data.token)
  localStorage.setItem('user', JSON.stringify(data.user))
  return { user: data.user, session: { access_token: data.token } }
}

export async function checkUsername(username: string) {
  const data = await apiGet(`/api/auth/check-username?username=${encodeURIComponent(username)}`)
  return data.available
}

export async function signOut() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export async function getCurrentUser() {
  return await apiGet('/api/auth/me')
}

// ===== 内容 =====

export async function getContents(limit = 20, offset = 0) {
  return await apiGet(`/api/contents?limit=${limit}&offset=${offset}`)
}

export async function getContentById(id: string) {
  return await apiGet(`/api/contents/${id}`)
}

export async function createContent(content: any) {
  return await apiPost('/api/contents', content)
}

// ===== 话题 =====

export async function getTopics(type?: string) {
  const q = type && type !== 'all' ? `?type=${type}` : ''
  return await apiGet(`/api/topics${q}`)
}

export async function getTopicById(id: string) {
  return await apiGet(`/api/topics/${id}`)
}

// ===== 梗 =====

export async function getMemesByTopic(topicId: string) {
  return await apiGet(`/api/memes?topic_id=${topicId}`)
}

export async function getMemesByUser(userId: string) {
  return await apiGet(`/api/memes?user_id=${userId}`)
}

export async function createMeme(meme: any) {
  return await apiPost('/api/memes', meme)
}

// ===== 互动 =====

export async function toggleLike(targetType: string, targetId: string) {
  return (await apiPost('/api/interactions/toggle', { target_type: targetType, target_id: targetId, action: 'like' })).toggled
}

export async function toggleFavorite(targetType: string, targetId: string) {
  return (await apiPost('/api/interactions/toggle', { target_type: targetType, target_id: targetId, action: 'favorite' })).toggled
}

export async function toggleLikeWithPoints(targetType: string, targetId: string) {
  return (await apiPost('/api/interactions/toggle', { target_type: targetType, target_id: targetId, action: 'like' })).toggled
}

export async function addCommentWithPoints(targetType: string, targetId: string, content: string) {
  return await apiPost('/api/comments', { target_type: targetType, target_id: targetId, content })
}

export async function checkInteraction(targetType: string, targetId: string, action: string) {
  return (await apiGet(`/api/interactions/check?target_type=${targetType}&target_id=${targetId}&action=${action}`)).exists
}

// ===== 评论 =====

export async function getComments(targetType: string, targetId: string) {
  return await apiGet(`/api/comments?target_type=${targetType}&target_id=${targetId}`)
}

// ===== 通知 =====

export async function getNotifications() {
  return await apiGet('/api/notifications')
}

export async function markNotificationRead(id: string) {
  return await apiPut(`/api/notifications/${id}/read`, {})
}

export async function markAllNotificationsRead() {
  return await apiPut('/api/notifications/read-all', {})
}

// ===== 用户 =====

export async function getUserById(id: string) {
  return await apiGet(`/api/users/${id}`)
}

export async function updateUser(id: string, data: any) {
  return await apiFetch(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

// ===== 积分 =====

export async function earnPoints(userId: string, amount: number, type: string, description: string) {
  // 积分由后端自动处理，前端不需要调用
  return { points: 0, level: 1, experience: 0, levelUpBonus: 0, oldLevel: 1, newLevel: 1 }
}

export async function spendPoints(userId: string, amount: number, type: string, description: string) {
  return { points: 0 }
}

export async function getPointsHistory(userId: string, limit = 50) {
  return await apiGet(`/api/points/history?limit=${limit}`)
}

export async function getPointsBalance(userId: string) {
  return (await apiGet('/api/points/balance')).points
}

export async function updateUserPoints(userId: string, amount: number, type: string, description: string) {
  return earnPoints(userId, amount, type, description)
}

// ===== 帮推 =====

export async function promoteContent(userId: string, contentId: string) {
  return await apiPost('/api/promotes', { content_id: contentId })
}

export async function getPromoteHistory(userId: string, limit = 50) { return [] }
export async function getPromoteChain(contentId: string) { return [] }
export async function getPromoteCount(userId: string) { return 0 }
export async function rewardPromoters(contentId: string, bonusAmount: number) {}

// ===== 签到 =====

export async function checkIn(userId: string) {
  return await apiPost('/api/checkin', {})
}

export async function getSignInHistory(userId: string, limit = 30) { return [] }

export async function getTodaySignIn(userId: string) {
  return (await apiGet('/api/checkin/today')).signed
}

export async function getConsecutiveDays(userId: string) {
  return (await apiGet('/api/checkin/streak')).streak
}

// ===== 任务 =====

export async function getTasks(type?: string) {
  const q = type ? `?type=${type}` : ''
  return await apiGet(`/api/tasks${q}`)
}

export async function joinTask(taskId: string, userId: string) {
  return await apiPost(`/api/tasks/${taskId}/join`, {})
}

export async function completeTask(taskId: string, userId: string) {
  return await apiPost(`/api/tasks/${taskId}/complete`, {})
}

export async function getUserTasks(userId: string) {
  return await apiGet('/api/tasks/my')
}

// ===== 投票 =====

export async function getVotes(status = 'active') {
  return await apiGet(`/api/votes?status=${status}`)
}

export async function getVoteById(id: string) { return null }
export async function createVote(vote: any) { return null }

export async function castVote(voteId: string, optionIndex: number) {
  return await apiPost(`/api/votes/${voteId}/cast`, { option_index: optionIndex })
}

export async function getUserVoteRecords(userId: string) { return [] }

// ===== 活动 =====

export async function getActivities(status = 'active') {
  return await apiGet(`/api/activities?status=${status}`)
}

export async function joinActivity(activityId: string, userId: string) { return null }
export async function getUserActivities(userId: string) { return [] }

// ===== 成就 =====

export async function getUserAchievements(userId: string) {
  return await apiGet('/api/achievements')
}

export async function unlockAchievement(userId: string, achievementId: string, rewardPoints: number) {
  return await apiPost('/api/achievements/unlock', { achievement_id: achievementId, reward_points: rewardPoints })
}

// ===== 搜索 =====

export async function search(query: string) {
  return await apiGet(`/api/search?q=${encodeURIComponent(query)}`)
}

// ===== 关注 =====

export async function toggleFollow(followerId: string, followingId: string) {
  return (await apiPost('/api/follows/toggle', { following_id: followingId })).following
}

export async function isFollowing(followerId: string, followingId: string) {
  return (await apiGet(`/api/follows/check?following_id=${followingId}`)).following
}

export async function getFollowCounts(userId: string) {
  return await apiGet(`/api/follows/counts/${userId}`)
}

// ===== 通知创建 =====

export async function createNotification(userId: string, type: string, title: string, content: string, relatedId?: string) {
  // 通知由后端创建
}

// ===== 分享 =====

export async function getTodayShareCount(userId: string) { return 0 }
export async function shareContent(userId: string, contentId: string) { return { earned: false, points: 0 } }

// ===== 邀请 =====

export async function applyInviteBoost(inviterId: string, contentId: string) {}

export async function getOrCreateInviteCode(userId: string) {
  return (await apiGet('/api/invite/code')).code
}

export async function getInviteLeaderboard() {
  return await apiGet('/api/invite/leaderboard')
}

export async function getInviteStats(userId: string) {
  return await apiGet('/api/invite/stats')
}

// ===== Supabase 兼容层（Proxy 版，支持任意链式调用） =====

// 通用查询构建器：记录调用链，await 时执行
function createQueryBuilder(table: string, method: string, body?: any) {
  const chain: { op: string; args: any[] }[] = []
  
  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      if (prop === 'then') {
        // 当 await 时执行查询
        return (resolve: Function) => {
          executeQuery(table, method, body, chain)
            .then(result => resolve(result))
            .catch(err => resolve({ data: null, error: err }))
        }
      }
      if (prop === Symbol.toStringTag) return undefined
      // 其他方法调用都记录到 chain 中
      return (...args: any[]) => {
        chain.push({ op: prop as string, args })
        return new Proxy({}, handler)
      }
    }
  }
  
  return new Proxy({}, handler)
}

async function executeQuery(table: string, method: string, body: any, chain: { op: string; args: any[] }[]) {
  try {
    // 提取 chain 中的修饰符
    let eqField: string | null = null
    let eqValue: any = null
    let single = false
    let orderCol: string | null = null
    let orderAsc = true
    let limitN: number | null = null
    let likeField: string | null = null
    let likePattern: string | null = null
    let inField: string | null = null
    let inValues: any[] | null = null
    let gteField: string | null = null
    let gteValue: any = null

    for (const c of chain) {
      switch (c.op) {
        case 'eq': eqField = c.args[0]; eqValue = c.args[1]; break
        case 'single': single = true; break
        case 'maybeSingle': single = true; break
        case 'order': orderCol = c.args[0]; orderAsc = c.args[1]?.ascending ?? true; break
        case 'limit': limitN = c.args[0]; break
        case 'ilike': likeField = c.args[0]; likePattern = c.args[1]; break
        case 'in': inField = c.args[0]; inValues = c.args[1]; break
        case 'gte': gteField = c.args[0]; gteValue = c.args[1]; break
      }
    }

    // INSERT
    if (method === 'INSERT') {
      if (table === 'interactions') {
        await apiPost('/api/interactions/toggle', { target_type: body.target_type, target_id: body.target_id, action: body.action })
        return { data: body, error: null }
      }
      if (table === 'comments') return { data: await apiPost('/api/comments', body), error: null }
      if (table === 'sign_ins') return { data: await apiPost('/api/checkin', {}), error: null }
      if (table === 'memes') return { data: await apiPost('/api/memes', body), error: null }
      if (table === 'contents') return { data: await apiPost('/api/contents', body), error: null }
      if (table === 'referrals') return { data: body, error: null }
      if (table === 'referral_codes') return { data: body, error: null }
      if (table === 'vote_records') return { data: body, error: null }
      if (table === 'activity_participants') return { data: body, error: null }
      if (table === 'task_participants') return { data: body, error: null }
      if (table === 'user_achievements') return { data: body, error: null }
      if (table === 'promotes') return { data: body, error: null }
      if (table === 'follows') return { data: body, error: null }
      if (table === 'notifications') return { data: body, error: null }
      return { data: body, error: null }
    }

    // UPDATE
    if (method === 'UPDATE') {
      if (table === 'notifications' && eqField === 'id') {
        await markNotificationRead(eqValue)
        return { data: null, error: null }
      }
      if (table === 'users' && eqField === 'id') {
        await updateUser(eqValue, body)
        return { data: null, error: null }
      }
      return { data: null, error: null }
    }

    // DELETE
    if (method === 'DELETE') {
      return { data: null, error: null }
    }

    // SELECT (default)
    let data: any = null

    if (likeField && likePattern) {
      const q = likePattern.replace(/%/g, '')
      const results = await search(q)
      if (table === 'contents') data = results.contents || []
      else if (table === 'topics') data = results.topics || []
      else if (table === 'memes') data = results.memes || []
      else data = []
    } else if (eqField && eqValue !== null) {
      // 按字段查询
      if (table === 'users' && eqField === 'id') data = await getUserById(eqValue)
      else if (table === 'contents' && eqField === 'id') data = await getContentById(eqValue)
      else if (table === 'topics' && eqField === 'id') data = await getTopicById(eqValue)
      else if (table === 'users' && eqField === 'username') {
        // 按用户名查用户：调用 search 或返回 null
        const results = await search(eqValue)
        data = (results.contents || []).find((u: any) => u.username === eqValue) || null
      }
      else if (table === 'sign_ins' && eqField === 'user_id') data = []
      else if (table === 'interactions' && eqField === 'user_id') data = []
      else if (table === 'referral_codes' && eqField === 'user_id') data = null
      else if (table === 'referrals' && eqField === 'referrer_id') data = []
      else if (table === 'promotes' && eqField === 'user_id') data = []
      else if (table === 'follows' && eqField === 'follower_id') data = null
      else if (table === 'vote_records' && eqField === 'user_id') data = []
      else if (table === 'task_participants' && eqField === 'user_id') data = []
      else if (table === 'activity_participants' && eqField === 'user_id') data = []
      else if (table === 'user_achievements' && eqField === 'user_id') data = []
      else if (table === 'point_logs' && eqField === 'user_id') data = await getPointsHistory(eqValue, limitN || 50)
      else if (table === 'point_records' && eqField === 'user_id') data = []
      else if (table === 'notifications' && eqField === 'user_id') data = await getNotifications()
      else if (table === 'daily_point_limits' && eqField === 'user_id') data = null
      else data = null
    } else if (inField && inValues) {
      data = []
    } else {
      // 无条件查询
      if (table === 'contents') data = await getContents(limitN || 20, 0)
      else if (table === 'memes') data = await apiGet(`/api/memes?limit=${limitN || 20}`)
      else if (table === 'topics') data = await getTopics()
      else if (table === 'notifications') data = await getNotifications()
      else if (table === 'activities') data = await getActivities()
      else if (table === 'votes') data = await getVotes()
      else if (table === 'tasks') data = await getTasks()
      else if (table === 'user_achievements') data = await apiGet('/api/achievements')
      else if (table === 'point_logs') data = await getPointsHistory('', limitN || 50)
      else if (table === 'referrals') data = []
      else if (table === 'sign_ins') data = []
      else if (table === 'promotes') data = []
      else if (table === 'follows') data = []
      else data = []
    }

    // single/maybeSingle: 包装为数组或单个
    if (single) {
      if (Array.isArray(data)) return { data: data[0] || null, error: null }
      return { data, error: null }
    }
    return { data: Array.isArray(data) ? data : [data].filter(Boolean), error: null }
  } catch (e: any) {
    return { data: null, error: e }
  }
}

export const supabase = {
  auth: {
    getUser: async () => {
      const user = await getCurrentUser().catch(() => null)
      return { data: { user } }
    },
    signInWithPassword: async ({ email, password }: any) => {
      const username = email.replace('@julang.app', '')
      const result = await signIn(username, password)
      return { data: result }
    },
    signUp: async ({ email, password, options }: any) => {
      const username = options?.data?.username || email.replace('@julang.app', '')
      const result = await signUp(username, password, username)
      return { data: result }
    },
    resetPasswordForEmail: async (email: string, opts?: any) => {
      return { error: null }
    },
    signOut: async () => { await signOut(); return { error: null } },
    onAuthStateChange: (callback: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: (table: string) => new Proxy({}, {
    get(_target, prop) {
      if (prop === 'insert') return (row: any) => createQueryBuilder(table, 'INSERT', row)
      if (prop === 'update') return (body: any) => createQueryBuilder(table, 'UPDATE', body)
      if (prop === 'delete') return () => createQueryBuilder(table, 'DELETE')
      if (prop === 'select') return (cols?: string) => createQueryBuilder(table, 'SELECT')
      if (prop === 'upsert') return (row: any) => createQueryBuilder(table, 'INSERT', row)
      return undefined
    }
  }),
  rpc: async (fn: string, params: any) => ({ data: null, error: null }),
  storage: { from: (bucket: string) => ({ upload: async () => ({ data: null, error: null }), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
  channel: (name: string) => ({ on: () => ({ subscribe: () => {} }) }),
}
