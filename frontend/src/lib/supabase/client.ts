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

// ===== Supabase 兼容层（给还在用 supabase.xxx 的代码） =====

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
    signUp: async ({ email, password }: any) => {
      const username = email.replace('@julang.app', '')
      const result = await signUp(username, password, username)
      return { data: result }
    },
    signOut: async () => { await signOut(); return { error: null } },
    onAuthStateChange: (callback: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: (table: string) => ({
    select: (cols?: string) => ({
      eq: (field: string, value: any) => ({
        single: async () => {
          try {
            if (table === 'users' && field === 'id') return { data: await getUserById(value), error: null }
            if (table === 'contents' && field === 'id') return { data: await getContentById(value), error: null }
            if (table === 'topics' && field === 'id') return { data: await getTopicById(value), error: null }
            return { data: null, error: null }
          } catch (e: any) { return { data: null, error: e } }
        },
        order: (col: string, opts: any) => ({
          range: async (from: number, to: number) => {
            try {
              const limit = to - from + 1
              const offset = from
              if (table === 'contents') return { data: await getContents(limit, offset), error: null }
              if (table === 'memes') return { data: await apiGet(`/api/memes?limit=${limit}&offset=${offset}`), error: null }
              return { data: [], error: null }
            } catch (e: any) { return { data: null, error: e } }
          },
          limit: (n: number) => ({
            then: async (resolve: any) => {
              try {
                if (table === 'point_logs') return resolve({ data: await getPointsHistory('', n), error: null })
                return resolve({ data: [], error: null })
              } catch (e: any) { return resolve({ data: null, error: e }) }
            }
          })
        }),
        limit: (n: number) => ({
          then: async (resolve: any) => {
            try {
              if (table === 'contents') return resolve({ data: await getContents(n), error: null })
              if (table === 'memes') return resolve({ data: await apiGet(`/api/memes?limit=${n}`), error: null })
              if (table === 'topics') return resolve({ data: await getTopics(), error: null })
              return resolve({ data: [], error: null })
            } catch (e: any) { return resolve({ data: null, error: e }) }
          }
        })
      }),
      order: (col: string, opts: any) => ({
        limit: (n: number) => ({
          then: async (resolve: any) => {
            try {
              if (table === 'contents') return resolve({ data: await getContents(n), error: null })
              if (table === 'memes') return resolve({ data: await apiGet(`/api/memes?limit=${n}`), error: null })
              if (table === 'topics') return resolve({ data: await getTopics(), error: null })
              if (table === 'notifications') return resolve({ data: await getNotifications(), error: null })
              if (table === 'activities') return resolve({ data: await getActivities(), error: null })
              if (table === 'votes') return resolve({ data: await getVotes(), error: null })
              if (table === 'tasks') return resolve({ data: await getTasks(), error: null })
              return resolve({ data: [], error: null })
            } catch (e: any) { return resolve({ data: null, error: e }) }
          }
        }),
        then: async (resolve: any) => {
          try {
            if (table === 'contents') return resolve({ data: await getContents(20), error: null })
            if (table === 'memes') return resolve({ data: await apiGet('/api/memes'), error: null })
            if (table === 'topics') return resolve({ data: await getTopics(), error: null })
            if (table === 'notifications') return resolve({ data: await getNotifications(), error: null })
            if (table === 'activities') return resolve({ data: await getActivities(), error: null })
            if (table === 'votes') return resolve({ data: await getVotes(), error: null })
            if (table === 'tasks') return resolve({ data: await getTasks(), error: null })
            return resolve({ data: [], error: null })
          } catch (e: any) { return resolve({ data: null, error: e }) }
        }
      }),
      ilike: (field: string, pattern: string) => ({
        limit: (n: number) => ({
          then: async (resolve: any) => {
            try {
              const q = pattern.replace(/%/g, '')
              const results = await search(q)
              if (table === 'contents') return resolve({ data: results.contents || [], error: null })
              if (table === 'topics') return resolve({ data: results.topics || [], error: null })
              if (table === 'memes') return resolve({ data: results.memes || [], error: null })
              return resolve({ data: [], error: null })
            } catch (e: any) { return resolve({ data: null, error: e }) }
          }
        })
      }),
      in: (field: string, values: string[]) => ({
        then: async (resolve: any) => resolve({ data: [], error: null })
      }),
      gte: (field: string, value: any) => ({
        then: async (resolve: any) => resolve({ data: [], error: null })
      }),
      maybeSingle: async () => ({ data: null, error: null }),
      then: async (resolve: any) => {
        try {
          if (table === 'contents') return resolve({ data: await getContents(20), error: null })
          if (table === 'memes') return resolve({ data: await apiGet('/api/memes'), error: null })
          if (table === 'topics') return resolve({ data: await getTopics(), error: null })
          if (table === 'notifications') return resolve({ data: await getNotifications(), error: null })
          if (table === 'activities') return resolve({ data: await getActivities(), error: null })
          if (table === 'votes') return resolve({ data: await getVotes(), error: null })
          if (table === 'tasks') return resolve({ data: await getTasks(), error: null })
          if (table === 'user_achievements') return resolve({ data: await apiGet('/api/achievements'), error: null })
          if (table === 'point_logs') return resolve({ data: await getPointsHistory(''), error: null })
          return resolve({ data: [], error: null })
        } catch (e: any) { return resolve({ data: null, error: e }) }
      }
    }),
    insert: async (row: any) => {
      try {
        if (table === 'interactions') {
          await apiPost('/api/interactions/toggle', { target_type: row.target_type, target_id: row.target_id, action: row.action })
          return { data: row, error: null }
        }
        if (table === 'comments') {
          const data = await apiPost('/api/comments', { target_type: row.target_type, target_id: row.target_id, content: row.content })
          return { data, error: null }
        }
        if (table === 'sign_ins') {
          const data = await apiPost('/api/checkin', {})
          return { data, error: null }
        }
        if (table === 'memes') {
          const data = await apiPost('/api/memes', row)
          return { data, error: null }
        }
        if (table === 'contents') {
          const data = await apiPost('/api/contents', row)
          return { data, error: null }
        }
        return { data: row, error: null }
      } catch (e: any) { return { data: null, error: e } }
    },
    update: async (updates: any) => ({
      eq: async (field: string, value: any) => {
        try {
          if (table === 'notifications') {
            if (field === 'id') await markNotificationRead(value)
            return { data: null, error: null }
          }
          if (table === 'users') {
            await updateUser(value, updates)
            return { data: null, error: null }
          }
          return { data: null, error: null }
        } catch (e: any) { return { data: null, error: e } }
      }
    }),
    delete: async () => ({
      eq: async (field: string, value: any) => ({ data: null, error: null })
    }),
  }),
  rpc: async (fn: string, params: any) => ({ data: null, error: null }),
  storage: { from: (bucket: string) => ({ upload: async () => ({ data: null, error: null }), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
  channel: (name: string) => ({ on: () => ({ subscribe: () => {} }) }),
}
