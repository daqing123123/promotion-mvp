// ===== Supabase 客户端 =====
// 安装: npm install @supabase/supabase-js

import { createClient } from '@supabase/supabase-js'

// 这两个值从 Supabase Dashboard → Settings → API 获取
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ===== 认证 =====

export async function signUp(username: string, password: string, name: string) {
  const email = `${username}@julang.app`
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error

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
  }

  return data
}

export async function signIn(username: string, password: string) {
  const email = `${username}@julang.app`
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return data
}

// ===== 内容 =====

export async function getContents(limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from('contents')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data
}

export async function getContentById(id: string) {
  const { data, error } = await supabase
    .from('contents')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createContent(content: {
  type: string
  title: string
  description?: string
  cover_url?: string
  tags?: string[]
  render_mode?: string
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase.from('contents').insert({
    ...content,
    creator_id: user.id,
    render_mode: content.render_mode || 'card',
    tags: JSON.stringify(content.tags || []),
  }).select().single()

  if (error) throw error
  return data
}

// ===== 话题 =====

export async function getTopics(type?: string) {
  let query = supabase
    .from('topics')
    .select('*')
    .eq('status', 'active')
    .order('hot_score', { ascending: false })

  if (type && type !== 'all') {
    query = query.eq('type', type)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getTopicById(id: string) {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// ===== 梗 =====

export async function getMemesByTopic(topicId: string) {
  const { data, error } = await supabase
    .from('memes')
    .select('*')
    .eq('topic_id', topicId)
    .order('hot_score', { ascending: false })

  if (error) throw error
  return data
}

export async function getMemesByUser(userId: string) {
  const { data, error } = await supabase
    .from('memes')
    .select('*')
    .eq('creator_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createMeme(meme: {
  type: string
  title: string
  content: string
  topic_id?: string
  source_content_id?: string
  hashtags?: string[]
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: userData } = await supabase
    .from('users')
    .select('name, avatar')
    .eq('id', user.id)
    .single()

  const { data, error } = await supabase.from('memes').insert({
    ...meme,
    creator_id: user.id,
    creator_name: userData?.name || '',
    creator_avatar: userData?.avatar || '👤',
    hashtags: JSON.stringify(meme.hashtags || []),
  }).select().single()

  if (error) throw error
  return data
}

// ===== 互动 =====

export async function toggleLike(targetType: string, targetId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: existing } = await supabase
    .from('interactions')
    .select('id')
    .eq('user_id', user.id)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('action', 'like')
    .single()

  if (existing) {
    await supabase.from('interactions').delete().eq('id', existing.id)
    return false
  } else {
    await supabase.from('interactions').insert({
      user_id: user.id,
      target_type: targetType,
      target_id: targetId,
      action: 'like',
    })
    return true
  }
}

export async function toggleFavorite(targetType: string, targetId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: existing } = await supabase
    .from('interactions')
    .select('id')
    .eq('user_id', user.id)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('action', 'favorite')
    .single()

  if (existing) {
    await supabase.from('interactions').delete().eq('id', existing.id)
    return false
  } else {
    await supabase.from('interactions').insert({
      user_id: user.id,
      target_type: targetType,
      target_id: targetId,
      action: 'favorite',
    })
    return true
  }
}

// ===== 通知 =====

export async function getNotifications() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)

  if (error) throw error
}

export async function markAllNotificationsRead() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) throw error
}

// ===== 用户 =====

export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// ===== 积分系统 =====

// 每日积分上限配置
const DAILY_POINT_LIMITS: Record<string, number> = {
  checkin: 10,
  publish: 50,
  like: 25,
  promote: 100,
  comment: 25,
  vote: 50,
  task: 200,
}
const DAILY_TOTAL_LIMIT = 500

async function checkDailyLimit(userId: string, type: string, amount: number): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0]
  const { data: limitRecord } = await supabase
    .from('daily_point_limits')
    .select('*')
    .eq('user_id', userId)
    .eq('limit_date', today)
    .single()

  if (!limitRecord) {
    await supabase.from('daily_point_limits').insert({
      user_id: userId,
      limit_date: today,
      total_earned: amount,
      breakdown: { [type]: amount },
    })
    return true
  }

  const breakdown = (limitRecord.breakdown as Record<string, number>) || {}
  const typeTotal = (breakdown[type] || 0) + amount
  const newTotal = limitRecord.total_earned + amount

  const typeLimit = DAILY_POINT_LIMITS[type]
  if (typeLimit && typeTotal > typeLimit) return false
  if (newTotal > DAILY_TOTAL_LIMIT) return false

  breakdown[type] = typeTotal
  await supabase
    .from('daily_point_limits')
    .update({ total_earned: newTotal, breakdown })
    .eq('id', limitRecord.id)

  return true
}

export async function earnPoints(userId: string, amount: number, type: string, description: string) {
  if (amount <= 0) throw new Error('Amount must be positive')

  const allowed = await checkDailyLimit(userId, type, amount)
  if (!allowed) throw new Error('今日该类积分已达上限')

  const { data: user } = await supabase
    .from('users')
    .select('points, level, experience')
    .eq('id', userId)
    .single()

  if (!user) throw new Error('User not found')

  const newPoints = user.points + amount
  const newExp = (user.experience || 0) + amount

  // 指数等级系统：base=10, multiplier=1.15
  // 1→2级：10XP, 50级：~90K累计, 75级：~5.7M累计, 100级：不可达
  let newLevel = 1
  let totalRequired = 0
  for (let i = 1; i <= 100; i++) {
    totalRequired += Math.floor(10 * Math.pow(1.15, i - 1))
    if (newExp >= totalRequired) newLevel = i
    else break
  }
  newLevel = Math.min(newLevel, 100)

  // 升级奖励
  const oldLevel = user.level || 1
  let levelUpBonus = 0
  if (newLevel > oldLevel) {
    for (let lv = oldLevel + 1; lv <= newLevel; lv++) {
      if (lv >= 90) levelUpBonus += 5000
      else if (lv >= 75) levelUpBonus += 2000
      else if (lv >= 60) levelUpBonus += 1000
      else if (lv >= 45) levelUpBonus += 500
      else if (lv >= 30) levelUpBonus += 300
      else if (lv >= 20) levelUpBonus += 200
      else if (lv >= 10) levelUpBonus += 100
      else if (lv >= 5) levelUpBonus += 50
      else levelUpBonus += 20
    }
  }

  const finalPoints = newPoints + levelUpBonus

  await supabase
    .from('users')
    .update({ points: finalPoints, level: newLevel, experience: newExp })
    .eq('id', userId)

  await supabase.from('point_logs').insert({
    user_id: userId,
    amount,
    type,
    description,
  })

  if (levelUpBonus > 0) {
    await supabase.from('point_logs').insert({
      user_id: userId,
      amount: levelUpBonus,
      type: 'level_up',
      description: `升级到 Lv.${newLevel} 奖励`,
    })
  }

  return { points: finalPoints, level: newLevel, experience: newExp, levelUpBonus, oldLevel, newLevel }
}

export async function spendPoints(userId: string, amount: number, type: string, description: string) {
  if (amount <= 0) throw new Error('Amount must be positive')

  const { data: user } = await supabase
    .from('users')
    .select('points')
    .eq('id', userId)
    .single()

  if (!user) throw new Error('User not found')
  if (user.points < amount) throw new Error('积分不足')

  const newPoints = user.points - amount

  await supabase
    .from('users')
    .update({ points: newPoints })
    .eq('id', userId)

  await supabase.from('point_logs').insert({
    user_id: userId,
    amount: -amount,
    type,
    description,
  })

  return { points: newPoints }
}

export async function getPointsHistory(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('point_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function getPointsBalance(userId: string) {
  const { data: user } = await supabase
    .from('users')
    .select('points')
    .eq('id', userId)
    .single()

  if (!user) throw new Error('User not found')
  return user.points
}

// ===== 帮推系统 =====

export async function promoteContent(userId: string, contentId: string) {
  const { data: existing } = await supabase
    .from('promotes')
    .select('id')
    .eq('user_id', userId)
    .eq('content_id', contentId)
    .single()

  if (existing) throw new Error('已经帮推过该内容')

  const result = await earnPoints(userId, 20, 'promote', '帮推内容获得积分')

  const { data: promote, error } = await supabase.from('promotes').insert({
    user_id: userId,
    content_id: contentId,
    points_earned: 20,
  }).select().single()

  if (error) throw error

  // 更新内容帮推数
  const { data: contentData } = await supabase
    .from('contents')
    .select('promote_count')
    .eq('id', contentId)
    .single()

  if (contentData) {
    await supabase
      .from('contents')
      .update({ promote_count: (contentData.promote_count || 0) + 1 })
      .eq('id', contentId)
  }

  return { promote, points: result }
}

export async function getPromoteHistory(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('promotes')
    .select('*, contents(title, type, cover_url)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function getPromoteChain(contentId: string) {
  const { data, error } = await supabase
    .from('promotes')
    .select('*, users(name, avatar)')
    .eq('content_id', contentId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getPromoteCount(userId: string) {
  const { count, error } = await supabase
    .from('promotes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) throw error
  return count || 0
}

export async function rewardPromoters(contentId: string, bonusAmount: number) {
  const { data: promoters } = await supabase
    .from('promotes')
    .select('user_id')
    .eq('content_id', contentId)

  if (!promoters) return

  for (const p of promoters) {
    try {
      await earnPoints(p.user_id, bonusAmount, 'promote_bonus', '帮推内容火爆额外奖励')
      await supabase
        .from('promotes')
        .update({ bonus_earned: bonusAmount })
        .eq('user_id', p.user_id)
        .eq('content_id', contentId)
    } catch {
      // 单个用户奖励失败不影响其他用户
    }
  }
}

// ===== 签到系统 =====

export async function checkIn(userId: string) {
  const today = new Date().toISOString().split('T')[0]

  const { data: existing } = await supabase
    .from('sign_ins')
    .select('id')
    .eq('user_id', userId)
    .eq('sign_date', today)
    .single()

  if (existing) throw new Error('今日已签到')

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const { data: yesterdayRecord } = await supabase
    .from('sign_ins')
    .select('consecutive_days')
    .eq('user_id', userId)
    .eq('sign_date', yesterday)
    .single()

  const consecutiveDays = yesterdayRecord ? yesterdayRecord.consecutive_days + 1 : 1

  let bonusPoints = 0
  if (consecutiveDays >= 30) bonusPoints = 200
  else if (consecutiveDays >= 7) bonusPoints = 50
  else if (consecutiveDays >= 3) bonusPoints = 20

  const totalPoints = 10 + bonusPoints

  await supabase.from('sign_ins').insert({
    user_id: userId,
    sign_date: today,
    consecutive_days: consecutiveDays,
    points_earned: totalPoints,
  })

  const result = await earnPoints(userId, totalPoints, 'checkin', `签到奖励（连续${consecutiveDays}天）`)

  return { consecutiveDays, pointsEarned: totalPoints, bonusPoints, ...result }
}

export async function getSignInHistory(userId: string, limit = 30) {
  const { data, error } = await supabase
    .from('sign_ins')
    .select('*')
    .eq('user_id', userId)
    .order('sign_date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function getTodaySignIn(userId: string) {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('sign_ins')
    .select('id')
    .eq('user_id', userId)
    .eq('sign_date', today)
    .single()

  return !!data
}

export async function getConsecutiveDays(userId: string) {
  const { data } = await supabase
    .from('sign_ins')
    .select('sign_date, consecutive_days')
    .eq('user_id', userId)
    .order('sign_date', { ascending: false })
    .limit(1)
    .single()

  if (!data) return 0

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  if (data.sign_date === today || data.sign_date === yesterday) {
    return data.consecutive_days
  }
  return 0
}

// ===== 带积分的互动 =====

export async function toggleLikeWithPoints(targetType: string, targetId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: existing } = await supabase
    .from('interactions')
    .select('id')
    .eq('user_id', user.id)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('action', 'like')
    .single()

  if (existing) {
    await supabase.from('interactions').delete().eq('id', existing.id)
    // 减少 like_count
    const table = targetType === 'meme' ? 'memes' : 'contents'
    const { data: cur } = await supabase.from(table).select('like_count').eq('id', targetId).single()
    if (cur) {
      await supabase.from(table).update({ like_count: Math.max(0, (cur.like_count || 0) - 1) }).eq('id', targetId)
    }
    return false
  } else {
    await supabase.from('interactions').insert({
      user_id: user.id,
      target_type: targetType,
      target_id: targetId,
      action: 'like',
    })
    // 增加 like_count
    const table = targetType === 'meme' ? 'memes' : 'contents'
    const { data: cur } = await supabase.from(table).select('like_count').eq('id', targetId).single()
    if (cur) {
      await supabase.from(table).update({ like_count: (cur.like_count || 0) + 1 }).eq('id', targetId)
    }
    try {
      await earnPoints(user.id, 5, 'like', '点赞获得积分')
    } catch {
      // 积分获取失败不影响点赞
    }
    return true
  }
}

export async function addCommentWithPoints(targetType: string, targetId: string, content: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase.from('comments').insert({
    user_id: user.id,
    target_type: targetType,
    target_id: targetId,
    content,
  }).select().single()

  if (error) throw error

  try {
    await earnPoints(user.id, 5, 'comment', '评论获得积分')
  } catch {
    // 积分获取失败不影响评论
  }

  return data
}

// 兼容旧调用
export async function updateUserPoints(userId: string, amount: number, type: string, description: string) {
  if (amount > 0) {
    return earnPoints(userId, amount, type, description)
  } else {
    return spendPoints(userId, Math.abs(amount), type, description)
  }
}

// ===== 任务系统 =====

export async function getTasks(type?: string) {
  let query = supabase
    .from('tasks')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (type) {
    query = query.eq('type', type)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function joinTask(taskId: string, userId: string) {
  const { data: existing } = await supabase
    .from('task_participants')
    .select('id')
    .eq('task_id', taskId)
    .eq('user_id', userId)
    .single()

  if (existing) throw new Error('已参与该任务')

  const { data, error } = await supabase.from('task_participants').insert({
    task_id: taskId,
    user_id: userId,
  }).select().single()

  if (error) throw error

  // 更新参与人数
  const { data: task } = await supabase
    .from('tasks')
    .select('current_participants')
    .eq('id', taskId)
    .single()

  if (task) {
    await supabase
      .from('tasks')
      .update({ current_participants: task.current_participants + 1 })
      .eq('id', taskId)
  }

  return data
}

export async function completeTask(taskId: string, userId: string) {
  const { data: task } = await supabase
    .from('tasks')
    .select('reward_points')
    .eq('id', taskId)
    .single()

  if (!task) throw new Error('任务不存在')

  await supabase
    .from('task_participants')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('task_id', taskId)
    .eq('user_id', userId)

  // 给积分奖励
  if (task.reward_points > 0) {
    await earnPoints(userId, task.reward_points, 'task', `完成任务获得积分`)
  }

  return { reward: task.reward_points }
}

export async function getUserTasks(userId: string) {
  const { data, error } = await supabase
    .from('task_participants')
    .select('*, tasks(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// ===== 投票系统 =====

export async function getVotes(status = 'active') {
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getVoteById(id: string) {
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createVote(vote: {
  title: string
  description?: string
  options: string[]
  topic_id?: string
  content_id?: string
  vote_cost?: number
  vote_reward?: number
  end_date?: string
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const optionsWithCount = vote.options.map((text, index) => ({
    index,
    text,
    vote_count: 0,
  }))

  const { data, error } = await supabase.from('votes').insert({
    title: vote.title,
    description: vote.description || '',
    options: optionsWithCount,
    topic_id: vote.topic_id,
    content_id: vote.content_id,
    vote_cost: vote.vote_cost || 0,
    vote_reward: vote.vote_reward || 5,
    end_date: vote.end_date,
    created_by: user.id,
  }).select().single()

  if (error) throw error
  return data
}

export async function castVote(voteId: string, optionIndex: number) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // 获取投票信息
  const { data: vote } = await supabase
    .from('votes')
    .select('*')
    .eq('id', voteId)
    .single()

  if (!vote) throw new Error('投票不存在')
  if (vote.status !== 'active') throw new Error('投票已结束')

  // 检查是否已投过
  const { data: existingVote } = await supabase
    .from('vote_records')
    .select('id')
    .eq('vote_id', voteId)
    .eq('user_id', user.id)
    .single()

  if (existingVote) throw new Error('已经投过票了')

  // 如果需要消耗积分
  if (vote.vote_cost > 0) {
    await spendPoints(user.id, vote.vote_cost, 'vote', '投票消耗积分')
  }

  // 记录投票
  const { error: recordError } = await supabase.from('vote_records').insert({
    vote_id: voteId,
    user_id: user.id,
    option_index: optionIndex,
    points_spent: vote.vote_cost,
    points_earned: vote.vote_reward,
  })

  if (recordError) throw recordError

  // 更新投票选项计数
  const options = vote.options as { index: number; text: string; vote_count: number }[]
  options[optionIndex].vote_count += 1

  await supabase
    .from('votes')
    .update({
      options,
      total_votes: vote.total_votes + 1,
    })
    .eq('id', voteId)

  // 给投票奖励积分
  if (vote.vote_reward > 0) {
    try {
      await earnPoints(user.id, vote.vote_reward, 'vote', '投票获得积分')
    } catch {
      // 积分获取失败不影响投票
    }
  }

  return { success: true, option: options[optionIndex] }
}

export async function getUserVoteRecords(userId: string) {
  const { data, error } = await supabase
    .from('vote_records')
    .select('*, votes(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// ===== 活动系统 =====

export async function getActivities(status = 'active') {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function joinActivity(activityId: string, userId: string) {
  const { data: existing } = await supabase
    .from('activity_participants')
    .select('id')
    .eq('activity_id', activityId)
    .eq('user_id', userId)
    .single()

  if (existing) throw new Error('已参与该活动')

  const { data, error } = await supabase.from('activity_participants').insert({
    activity_id: activityId,
    user_id: userId,
  }).select().single()

  if (error) throw error

  const { data: activity } = await supabase
    .from('activities')
    .select('current_participants')
    .eq('id', activityId)
    .single()

  if (activity) {
    await supabase
      .from('activities')
      .update({ current_participants: activity.current_participants + 1 })
      .eq('id', activityId)
  }

  return data
}

export async function getUserActivities(userId: string) {
  const { data, error } = await supabase
    .from('activity_participants')
    .select('*, activities(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// ===== 成就系统 =====

export async function getUserAchievements(userId: string) {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId)

  if (error) throw error
  return data || []
}

export async function unlockAchievement(userId: string, achievementId: string, rewardPoints: number) {
  const { data: existing } = await supabase
    .from('user_achievements')
    .select('id')
    .eq('user_id', userId)
    .eq('achievement_id', achievementId)
    .single()

  if (existing) return null // 已解锁

  const { data, error } = await supabase.from('user_achievements').insert({
    user_id: userId,
    achievement_id: achievementId,
    reward_claimed: false,
  }).select().single()

  if (error) throw error

  // 给成就奖励积分
  if (rewardPoints > 0) {
    try {
      await earnPoints(userId, rewardPoints, 'achievement', `成就解锁奖励`)
    } catch {
      // 积分获取失败不影响成就解锁
    }
  }

  return data
}

// ===== 搜索 =====

export async function search(query: string) {
  const [contents, topics, memes] = await Promise.all([
    supabase
      .from('contents')
      .select('*')
      .ilike('title', `%${query}%`)
      .limit(10),
    supabase
      .from('topics')
      .select('*')
      .ilike('title', `%${query}%`)
      .limit(10),
    supabase
      .from('memes')
      .select('*')
      .ilike('title', `%${query}%`)
      .limit(10),
  ])

  return {
    contents: contents.data || [],
    topics: topics.data || [],
    memes: memes.data || [],
  }
}

// ===== 关注系统 =====

export async function toggleFollow(followerId: string, followingId: string) {
  if (followerId === followingId) throw new Error('不能关注自己')

  const { data: existing } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle()

  if (existing) {
    await supabase.from('follows').delete().eq('id', existing.id)
    return false
  } else {
    await supabase.from('follows').insert({
      follower_id: followerId,
      following_id: followingId,
    })
    return true
  }
}

export async function isFollowing(followerId: string, followingId: string) {
  const { data } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle()

  return !!data
}

export async function getFollowCounts(userId: string) {
  const [followers, following] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
  ])
  return {
    followers: followers.count || 0,
    following: following.count || 0,
  }
}

// ===== 通知系统 =====

export async function createNotification(userId: string, type: string, title: string, content: string, relatedId?: string) {
  await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    content,
    related_id: relatedId || '',
    is_read: false,
  })
}

// ===== 引流 & 增长功能 =====

// 获取今日分享次数（用于每日任务判断）
export async function getTodayShareCount(userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0]
  const { count } = await supabase
    .from('point_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('type', 'share')
    .gte('created_at', today + 'T00:00:00')
  return count || 0
}

// 分享内容到外部（带去重：同一内容每天只给一次积分）
export async function shareContent(userId: string, contentId: string): Promise<{ earned: boolean; points: number }> {
  const today = new Date().toISOString().split('T')[0]
  // 检查今天是否已分享过该内容
  const { data: existing } = await supabase
    .from('point_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('type', 'share')
    .eq('description', `分享内容 ${contentId}`)
    .gte('created_at', today + 'T00:00:00')
    .maybeSingle()

  if (existing) return { earned: false, points: 0 }

  // 每日分享上限 10 次
  const todayCount = await getTodayShareCount(userId)
  if (todayCount >= 10) return { earned: false, points: 0 }

  try {
    await earnPoints(userId, 3, 'share', `分享内容 ${contentId}`)
    return { earned: true, points: 3 }
  } catch {
    return { earned: false, points: 0 }
  }
}

// 邀请好友的曝光加成：被邀请人帮推时，邀请人的内容 hot_score +5%
export async function applyInviteBoost(inviterId: string, contentId: string) {
  try {
    const { data: content } = await supabase
      .from('contents')
      .select('hot_score')
      .eq('id', contentId)
      .eq('creator_id', inviterId)
      .single()

    if (content) {
      const boost = Math.floor((content.hot_score || 100) * 0.05)
      await supabase
        .from('contents')
        .update({ hot_score: (content.hot_score || 100) + boost })
        .eq('id', contentId)
    }
  } catch {}
}

// 获取用户的邀请码（如果没有则自动生成）
export async function getOrCreateInviteCode(userId: string): Promise<string> {
  const { data: existing } = await supabase
    .from('referral_codes')
    .select('code')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) return existing.code

  // 生成 6 位邀请码
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]

  try {
    await supabase.from('referral_codes').insert({
      user_id: userId,
      code,
      uses_count: 0,
      max_uses: 0,
    })
  } catch {
    // 如果冲突（极小概率），重新生成
    code = ''
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
    await supabase.from('referral_codes').insert({ user_id: userId, code, uses_count: 0, max_uses: 0 })
  }

  return code
}

// 获取邀请排行榜（前 10 名）
export async function getInviteLeaderboard() {
  const { data, error } = await supabase
    .from('referrals')
    .select('referrer_id')
    .eq('status', 'registered')

  if (error || !data) return []

  // 统计每人邀请数
  const counts: Record<string, number> = {}
  for (const r of data) {
    counts[r.referrer_id] = (counts[r.referrer_id] || 0) + 1
  }

  // 排序取前 10
  const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 10)

  if (sorted.length === 0) return []

  // 获取用户信息
  const userIds = sorted.map(([id]) => id)
  const { data: users } = await supabase
    .from('users')
    .select('id, name, avatar')
    .in('id', userIds)

  const usersMap = Object.fromEntries((users || []).map(u => [u.id, u]))

  return sorted.map(([id, count], index) => ({
    rank: index + 1,
    userId: id,
    name: usersMap[id]?.name || '用户',
    avatar: usersMap[id]?.avatar || '👤',
    inviteCount: count,
  }))
}

// 获取邀请统计
export async function getInviteStats(userId: string) {
  const [codeRes, countRes, bonusRes] = await Promise.all([
    supabase.from('referral_codes').select('code, uses_count').eq('user_id', userId).maybeSingle(),
    supabase.from('referrals').select('*', { count: 'exact', head: true }).eq('referrer_id', userId),
    supabase.from('referrals').select('referrer_reward').eq('referrer_id', userId),
  ])

  const totalBonus = (bonusRes.data || []).reduce((s, r) => s + (r.referrer_reward || 0), 0)

  return {
    code: codeRes.data?.code || '',
    inviteCount: countRes.count || 0,
    totalBonus,
    usesCount: codeRes.data?.uses_count || 0,
  }
}
