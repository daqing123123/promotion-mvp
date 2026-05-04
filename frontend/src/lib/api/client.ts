// @ts-nocheck
// 巨浪 Julang - 前端 API 客户端
// 替代 @supabase/supabase-js，调用自建后端 API

const API_BASE = import.meta.env.VITE_API_URL || 'http://81.70.71.132:3001'

// ===== 通用请求工具 =====

async function request(path, options = {}) {
  const token = localStorage.getItem('julang_token')
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }

  return res.json()
}

function get(path, params) {
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  return request(`${path}${query}`)
}

function post(path, body) {
  return request(path, { method: 'POST', body: JSON.stringify(body) })
}

function put(path, body) {
  return request(path, { method: 'PUT', body: JSON.stringify(body) })
}

// ============================================
// 认证
// ============================================

export async function signUp(username, password, name) {
  const data = await post('/api/auth/register', { username, password, name })
  localStorage.setItem('julang_token', data.token)
  return data
}

export async function signIn(username, password) {
  const data = await post('/api/auth/login', { username, password })
  localStorage.setItem('julang_token', data.token)
  return data
}

export async function signOut() {
  localStorage.removeItem('julang_token')
}

export async function getCurrentUser() {
  try {
    return await get('/api/auth/me')
  } catch {
    return null
  }
}

// ============================================
// 用户
// ============================================

export async function getUserById(id) {
  return get(`/api/users/${id}`)
}

export async function updateUser(id, data) {
  return put(`/api/users/${id}`, data)
}

// ============================================
// 内容
// ============================================

export async function getContents(limit = 20, offset = 0, type, userId) {
  const params = { limit, offset }
  if (type) params.type = type
  if (userId) params.user_id = userId
  return get('/api/contents', params)
}

export async function getContentById(id) {
  return get(`/api/contents/${id}`)
}

export async function createContent(content) {
  return post('/api/contents', content)
}

// ============================================
// 话题
// ============================================

export async function getTopics(type) {
  return get('/api/topics', type ? { type } : undefined)
}

export async function getTopicById(id) {
  return get(`/api/topics/${id}`)
}

export async function createTopic(topic) {
  return post('/api/topics', topic)
}

export async function updateTopic(id, data) {
  return put(`/api/topics/${id}`, data)
}

export async function getTopicPromotes(topicId) {
  try {
    return await get(`/api/topics/${topicId}/promotes`)
  } catch {
    return []
  }
}

export async function acceptTopicPromote(topicId, data = {}) {
  return post(`/api/topics/${topicId}/promotes`, data)
}

export async function updateTopicPromote(promoteId, data) {
  return put(`/api/topics/promotes/${promoteId}`, data)
}

export async function claimTopicCoupon(topicId) {
  return post(`/api/topics/${topicId}/coupon`)
}

// ============================================
// 梗
// ============================================

export async function getMemes(params) {
  return get('/api/memes', params)
}

export async function getMemesByTopic(topicId, limit = 20, offset = 0) {
  return get('/api/memes', { topic_id: topicId, limit, offset })
}

export async function getMemesByUser(userId, limit = 20, offset = 0) {
  return get('/api/memes', { user_id: userId, limit, offset })
}

export async function createMeme(meme) {
  return post('/api/memes', meme)
}

// ============================================
// 互动
// ============================================

export async function toggleLike(targetType, targetId) {
  const data = await post('/api/interactions/toggle', {
    target_type: targetType,
    target_id: targetId,
    action: 'like',
  })
  return data.toggled
}

export async function toggleFavorite(targetType, targetId) {
  const data = await post('/api/interactions/toggle', {
    target_type: targetType,
    target_id: targetId,
    action: 'favorite',
  })
  return data.toggled
}

// 带积分的点赞（兼容旧调用）
export async function toggleLikeWithPoints(targetType, targetId) {
  return toggleLike(targetType, targetId)
}

export async function checkInteraction(targetType, targetId, action) {
  return get('/api/interactions/check', { target_type: targetType, target_id: targetId, action })
}

// ============================================
// 评论
// ============================================

export async function getComments(targetType, targetId) {
  return get('/api/comments', { target_type: targetType, target_id: targetId })
}

export async function addCommentWithPoints(targetType, targetId, content) {
  return post('/api/comments', { target_type: targetType, target_id: targetId, content })
}

// ============================================
// 积分
// ============================================

export async function getPointsHistory(limit = 50) {
  return get('/api/points/history', { limit })
}

export async function getPointsBalance() {
  const data = await get('/api/points/balance')
  return data.points
}

export async function earnPoints(userId, amount, type, description) {
  // 这个函数在后端处理，前端不需要直接调用
  // 保留接口兼容性
  console.warn('earnPoints 应通过具体业务 API 调用，而非直接调用')
}

export async function spendPoints(userId, amount, type, description) {
  console.warn('spendPoints 应通过具体业务 API 调用，而非直接调用')
}

// 兼容旧调用
export async function updateUserPoints(userId, amount, type, description) {
  console.warn('updateUserPoints 已废弃，请使用具体业务 API')
}

// ============================================
// 签到
// ============================================

export async function checkIn() {
  return post('/api/checkin')
}

export async function getTodaySignIn() {
  const data = await get('/api/checkin/today')
  return data.signed
}

export async function getConsecutiveDays() {
  const data = await get('/api/checkin/streak')
  return data.streak
}

export async function getSignInHistory(limit = 30) {
  // 如果后端有这个接口就调，没有就返回空
  try {
    return await get('/api/checkin/history', { limit })
  } catch {
    return []
  }
}

// ============================================
// 帮推
// ============================================

export async function promoteContent(userId, contentId) {
  return post('/api/promotes', { content_id: contentId })
}

export async function getPromoteHistory(limit = 50) {
  try {
    return await get('/api/promotes/history', { limit })
  } catch {
    return []
  }
}

export async function getPromoteChain(contentId) {
  try {
    return await get(`/api/promotes/chain/${contentId}`)
  } catch {
    return []
  }
}

export async function getPromoteCount(userId) {
  try {
    const data = await get(`/api/promotes/count/${userId}`)
    return data.count
  } catch {
    return 0
  }
}

export async function rewardPromoters(contentId, bonusAmount) {
  return post(`/api/promotes/reward`, { content_id: contentId, bonus_amount: bonusAmount })
}

// ============================================
// 通知
// ============================================

export async function getNotifications() {
  return get('/api/notifications')
}

export async function markNotificationRead(id) {
  return put(`/api/notifications/${id}/read`)
}

export async function markAllNotificationsRead() {
  return put('/api/notifications/read-all')
}

export async function createNotification(userId, type, title, content, relatedId) {
  return post('/api/notifications', { user_id: userId, type, title, content, related_id: relatedId })
}

// ============================================
// 关注
// ============================================

export async function toggleFollow(followerId, followingId) {
  const data = await post('/api/follows/toggle', { following_id: followingId })
  return data.following
}

export async function isFollowing(followerId, followingId) {
  const data = await get('/api/follows/check', { following_id: followingId })
  return data.following
}

export async function getFollowCounts(userId) {
  return get(`/api/follows/counts/${userId}`)
}

// ============================================
// 搜索
// ============================================

export async function search(query) {
  return get('/api/search', { q: query })
}

// ============================================
// 任务
// ============================================

export async function getTasks(type) {
  return get('/api/tasks', type ? { type } : undefined)
}

export async function joinTask(taskId) {
  return post(`/api/tasks/${taskId}/join`)
}

export async function completeTask(taskId) {
  return post(`/api/tasks/${taskId}/complete`)
}

export async function getUserTasks() {
  return get('/api/tasks/my')
}

// ============================================
// 投票
// ============================================

export async function getVotes(status = 'active') {
  return get('/api/votes', { status })
}

export async function getVoteById(id) {
  return get(`/api/votes/${id}`)
}

export async function createVote(vote) {
  return post('/api/votes', vote)
}

export async function castVote(voteId, optionIndex) {
  return post(`/api/votes/${voteId}/cast`, { option_index: optionIndex })
}

export async function getUserVoteRecords() {
  try {
    return await get('/api/votes/records')
  } catch {
    return []
  }
}

// ============================================
// 活动
// ============================================

export async function getActivities(status = 'active') {
  return get('/api/activities', { status })
}

export async function joinActivity(activityId) {
  return post(`/api/activities/${activityId}/join`)
}

export async function getUserActivities() {
  try {
    return await get('/api/activities/my')
  } catch {
    return []
  }
}

// ============================================
// 成就
// ============================================

export async function getUserAchievements() {
  return get('/api/achievements')
}

export async function unlockAchievement(userId, achievementId, rewardPoints) {
  return post('/api/achievements/unlock', {
    achievement_id: achievementId,
    reward_points: rewardPoints,
  })
}

// ============================================
// 邀请
// ============================================

export async function getOrCreateInviteCode() {
  const data = await get('/api/invite/code')
  return data.code
}

export async function getInviteStats() {
  return get('/api/invite/stats')
}

export async function getInviteLeaderboard() {
  return get('/api/invite/leaderboard')
}

// ============================================
// 分享
// ============================================

export async function getTodayShareCount() {
  try {
    const data = await get('/api/share/today-count')
    return data.count
  } catch {
    return 0
  }
}

export async function shareContent(userId, contentId) {
  try {
    return await post('/api/share', { content_id: contentId })
  } catch {
    return { earned: false, points: 0 }
  }
}

// ============================================
// 导出（兼容旧接口名）
// ============================================

// 兼容 supabase 的导出名
export { getCurrentUser as getUser }
