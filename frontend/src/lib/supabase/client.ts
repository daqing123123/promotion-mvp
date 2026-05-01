// ===== Supabase 客户端 =====
// 安装: npm install @supabase/supabase-js

import { createClient } from '@supabase/supabase-js'

// 这两个值从 Supabase Dashboard → Settings → API 获取
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ===== 认证 =====

export async function signUp(username: string, password: string, name: string) {
  // 用邮箱格式注册（Supabase Auth 要求邮箱）
  const email = `${username}@julang.app`
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error

  // 创建用户记录
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

  // 获取用户信息
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

  // 检查是否已点赞
  const { data: existing } = await supabase
    .from('interactions')
    .select('id')
    .eq('user_id', user.id)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('action', 'like')
    .single()

  if (existing) {
    // 取消点赞
    await supabase.from('interactions').delete().eq('id', existing.id)
    return false
  } else {
    // 点赞
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

export async function updateUserPoints(userId: string, amount: number, type: string, description: string) {
  // 获取当前积分
  const { data: user } = await supabase
    .from('users')
    .select('points, level, experience')
    .eq('id', userId)
    .single()

  if (!user) throw new Error('User not found')

  const newPoints = user.points + amount
  const newExp = user.experience + Math.abs(amount)

  // 计算新等级（指数增长公式）
  let newLevel = 1
  let totalRequired = 0
  for (let i = 1; i <= 100; i++) {
    totalRequired += Math.floor(10 * Math.pow(1.08, i - 1))
    if (newExp >= totalRequired) newLevel = i
    else break
  }

  // 更新用户
  await supabase
    .from('users')
    .update({ points: newPoints, level: newLevel, experience: newExp })
    .eq('id', userId)

  // 记录积分日志
  await supabase.from('point_logs').insert({
    user_id: userId,
    amount,
    type,
    description,
  })
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
