// 巨浪 Julang API 服务器
// 替代 Supabase，使用 MySQL + Express

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

dotenv.config()

const app = express()
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }))
app.use(express.json())

// ===== MySQL 连接池 =====
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 20,
  charset: 'utf8mb4',
})

// ===== JWT 中间件 =====
function authMiddleware(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: '未登录' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret')
    req.userId = (decoded as any).userId
    next()
  } catch {
    return res.status(401).json({ error: 'token 无效或已过期' })
  }
}

function genId() { return uuidv4() }

// ===== 工具函数 =====
async function earnPoints(userId: string, amount: number, type: string, description: string) {
  if (amount <= 0) throw new Error('Amount must be positive')
  const [users] = await pool.query('SELECT points, level, experience FROM users WHERE id = ?', [userId]) as any[]
  if (users.length === 0) throw new Error('User not found')
  const user = users[0]
  const newPoints = user.points + amount
  const newExp = (user.experience || 0) + amount
  let newLevel = 1
  let totalRequired = 0
  for (let i = 1; i <= 100; i++) {
    totalRequired += Math.floor(10 * Math.pow(1.15, i - 1))
    if (newExp >= totalRequired) newLevel = i
    else break
  }
  newLevel = Math.min(newLevel, 100)
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
  await pool.query('UPDATE users SET points = ?, level = ?, experience = ? WHERE id = ?', [finalPoints, newLevel, newExp, userId])
  await pool.query('INSERT INTO point_logs (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)', [genId(), userId, amount, type, description])
  if (levelUpBonus > 0) {
    await pool.query('INSERT INTO point_logs (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)', [genId(), userId, levelUpBonus, 'level_up', `升级到 Lv.${newLevel} 奖励`])
  }
  return { points: finalPoints, level: newLevel, experience: newExp, levelUpBonus, oldLevel, newLevel }
}

const DAILY_POINT_LIMITS: Record<string, number> = { checkin: 10, publish: 50, like: 25, promote: 100, comment: 25, vote: 50, task: 200 }
const DAILY_TOTAL_LIMIT = 500

async function checkDailyLimit(userId: string, type: string, amount: number): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0]
  const [rows] = await pool.query('SELECT * FROM daily_point_limits WHERE user_id = ? AND limit_date = ?', [userId, today]) as any[]
  if (rows.length === 0) {
    await pool.query('INSERT INTO daily_point_limits (id, user_id, limit_date, total_earned, breakdown) VALUES (?, ?, ?, ?, ?)', [genId(), userId, today, amount, JSON.stringify({ [type]: amount })])
    return true
  }
  const record = rows[0]
  const breakdown = typeof record.breakdown === 'object' ? record.breakdown : JSON.parse(record.breakdown || '{}')
  const typeTotal = (breakdown[type] || 0) + amount
  const newTotal = record.total_earned + amount
  const typeLimit = DAILY_POINT_LIMITS[type]
  if (typeLimit && typeTotal > typeLimit) return false
  if (newTotal > DAILY_TOTAL_LIMIT) return false
  breakdown[type] = typeTotal
  await pool.query('UPDATE daily_point_limits SET total_earned = ?, breakdown = ? WHERE id = ?', [newTotal, JSON.stringify(breakdown), record.id])
  return true
}

// ============================================
// 健康检查
// ============================================
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() })
  } catch {
    res.status(500).json({ status: 'error', db: 'disconnected' })
  }
})

// ============================================
// 认证 API
// ============================================
// 检查用户名是否可用
app.get('/api/auth/check-username', async (req, res) => {
  try {
    const username = (req.query.username as string || '').toLowerCase().trim()
    if (!username || username.length < 3) return res.json({ available: false, reason: 'too_short' })
    const [rows] = await pool.query('SELECT id FROM users WHERE username = ?', [username]) as any[]
    res.json({ available: rows.length === 0 })
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, name } = req.body
    if (!username || !password) return res.status(400).json({ error: '用户名和密码必填' })
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]) as any[]
    if (existing.length > 0) return res.status(400).json({ error: '用户名已存在' })
    const id = genId()
    const passwordHash = await bcrypt.hash(password, 10)
    const email = `${username}@julang.app`
    await pool.query('INSERT INTO users (id, username, name, avatar, email, password_hash, points, level, experience) VALUES (?, ?, ?, ?, ?, ?, 100, 1, 0)', [id, username, name || username, '👤', email, passwordHash])
    const token = jwt.sign({ userId: id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' })
    const [users] = await pool.query('SELECT id, username, name, avatar, bio, tags, points, level, experience, created_at FROM users WHERE id = ?', [id]) as any[]
    res.json({ user: users[0], token })
  } catch (err: any) {
    console.error('注册失败:', err)
    res.status(500).json({ error: '注册失败' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: '用户名和密码必填' })
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]) as any[]
    if (users.length === 0) return res.status(401).json({ error: '用户名或密码错误' })
    const user = users[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: '用户名或密码错误' })
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' })
    delete user.password_hash
    res.json({ user, token })
  } catch (err: any) {
    console.error('登录失败:', err)
    res.status(500).json({ error: '登录失败' })
  }
})

app.get('/api/auth/me', authMiddleware, async (req: any, res) => {
  try {
    const [users] = await pool.query('SELECT id, username, name, avatar, bio, tags, points, level, experience, created_at FROM users WHERE id = ?', [req.userId]) as any[]
    if (users.length === 0) return res.status(404).json({ error: '用户不存在' })
    res.json(users[0])
  } catch { res.status(500).json({ error: '获取用户信息失败' }) }
})

// ============================================
// 用户 API
// ============================================
app.get('/api/users/:id', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, username, name, avatar, bio, tags, points, level, experience, created_at FROM users WHERE id = ?', [req.params.id]) as any[]
    if (users.length === 0) return res.status(404).json({ error: '用户不存在' })
    res.json(users[0])
  } catch { res.status(500).json({ error: '获取用户失败' }) }
})

app.put('/api/users/:id', authMiddleware, async (req: any, res) => {
  try {
    if (req.userId !== req.params.id) return res.status(403).json({ error: '无权修改' })
    const { name, avatar, bio, tags } = req.body
    await pool.query('UPDATE users SET name = COALESCE(?, name), avatar = COALESCE(?, avatar), bio = COALESCE(?, bio), tags = COALESCE(?, tags) WHERE id = ?', [name, avatar, bio, tags ? JSON.stringify(tags) : null, req.params.id])
    const [users] = await pool.query('SELECT id, username, name, avatar, bio, tags, points, level, experience FROM users WHERE id = ?', [req.params.id]) as any[]
    res.json(users[0])
  } catch { res.status(500).json({ error: '更新失败' }) }
})

// ============================================
// 内容 API
// ============================================
app.get('/api/contents', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20
    const offset = parseInt(req.query.offset as string) || 0
    let sql = 'SELECT * FROM contents WHERE status = ?'
    const params: any[] = ['published']
    const type = req.query.type as string
    if (type && type !== 'all') { sql += ' AND type = ?'; params.push(type) }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)
    const [rows] = await pool.query(sql, params)
    res.json(rows)
  } catch { res.status(500).json({ error: '获取内容失败' }) }
})

app.get('/api/contents/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM contents WHERE id = ?', [req.params.id]) as any[]
    if (rows.length === 0) return res.status(404).json({ error: '内容不存在' })
    pool.query('UPDATE contents SET view_count = view_count + 1 WHERE id = ?', [req.params.id])
    res.json(rows[0])
  } catch { res.status(500).json({ error: '获取内容失败' }) }
})

app.post('/api/contents', authMiddleware, async (req: any, res) => {
  try {
    const { type, title, description, cover_url, tags, render_mode } = req.body
    const id = genId()
    await pool.query('INSERT INTO contents (id, type, title, description, cover_url, tags, render_mode, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [id, type || 'article', title, description || '', cover_url || '', JSON.stringify(tags || []), render_mode || 'card', req.userId])
    const [rows] = await pool.query('SELECT * FROM contents WHERE id = ?', [id]) as any[]
    res.json(rows[0])
  } catch { res.status(500).json({ error: '创建内容失败' }) }
})

// ============================================
// 话题 API
// ============================================
app.get('/api/topics', async (req, res) => {
  try {
    let sql = 'SELECT * FROM topics WHERE status = ?'
    const params: any[] = ['active']
    const type = req.query.type as string
    if (type && type !== 'all') { sql += ' AND type = ?'; params.push(type) }
    sql += ' ORDER BY hot_score DESC'
    const [rows] = await pool.query(sql, params)
    res.json(rows)
  } catch { res.status(500).json({ error: '获取话题失败' }) }
})

app.get('/api/topics/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM topics WHERE id = ?', [req.params.id]) as any[]
    if (rows.length === 0) return res.status(404).json({ error: '话题不存在' })
    res.json(rows[0])
  } catch { res.status(500).json({ error: '获取话题失败' }) }
})

// ============================================
// 梗/Meme API
// ============================================
app.get('/api/memes', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20
    const offset = parseInt(req.query.offset as string) || 0
    let sql = 'SELECT * FROM memes WHERE status = ?'
    const params: any[] = ['published']
    if (req.query.topic_id) { sql += ' AND topic_id = ?'; params.push(req.query.topic_id) }
    if (req.query.user_id) { sql += ' AND creator_id = ?'; params.push(req.query.user_id) }
    sql += ' ORDER BY hot_score DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)
    const [rows] = await pool.query(sql, params)
    res.json(rows)
  } catch { res.status(500).json({ error: '获取梗失败' }) }
})

app.post('/api/memes', authMiddleware, async (req: any, res) => {
  try {
    const { type, title, content, topic_id, source_content_id, hashtags } = req.body
    const id = genId()
    const [users] = await pool.query('SELECT name, avatar FROM users WHERE id = ?', [req.userId]) as any[]
    const user = users[0] || { name: '', avatar: '👤' }
    await pool.query('INSERT INTO memes (id, type, title, content, topic_id, source_content_id, hashtags, creator_id, creator_name, creator_avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, type || 'text', title, content || '', topic_id || null, source_content_id || null, JSON.stringify(hashtags || []), req.userId, user.name, user.avatar])
    const [rows] = await pool.query('SELECT * FROM memes WHERE id = ?', [id]) as any[]
    res.json(rows[0])
  } catch { res.status(500).json({ error: '创建梗失败' }) }
})

// ============================================
// 互动 API
// ============================================
app.post('/api/interactions/toggle', authMiddleware, async (req: any, res) => {
  try {
    const { target_type, target_id, action } = req.body
    const [existing] = await pool.query('SELECT id FROM interactions WHERE user_id = ? AND target_type = ? AND target_id = ? AND action = ?', [req.userId, target_type, target_id, action]) as any[]
    const table = target_type === 'meme' ? 'memes' : 'contents'
    const countField = action === 'like' ? 'like_count' : 'favorite_count'
    if (existing.length > 0) {
      await pool.query('DELETE FROM interactions WHERE id = ?', [existing[0].id])
      await pool.query(`UPDATE ${table} SET ${countField} = GREATEST(0, ${countField} - 1) WHERE id = ?`, [target_id])
      res.json({ toggled: false })
    } else {
      await pool.query('INSERT INTO interactions (id, user_id, target_type, target_id, action) VALUES (?, ?, ?, ?, ?)', [genId(), req.userId, target_type, target_id, action])
      await pool.query(`UPDATE ${table} SET ${countField} = ${countField} + 1 WHERE id = ?`, [target_id])
      if (action === 'like') { try { await earnPoints(req.userId, 5, 'like', '点赞获得积分') } catch {} }
      res.json({ toggled: true })
    }
  } catch { res.status(500).json({ error: '操作失败' }) }
})

app.get('/api/interactions/check', authMiddleware, async (req: any, res) => {
  try {
    const { target_type, target_id, action } = req.query
    const [rows] = await pool.query('SELECT id FROM interactions WHERE user_id = ? AND target_type = ? AND target_id = ? AND action = ?', [req.userId, target_type, target_id, action]) as any[]
    res.json({ exists: rows.length > 0 })
  } catch { res.status(500).json({ error: '查询失败' }) }
})

// ============================================
// 评论 API
// ============================================
app.get('/api/comments', async (req, res) => {
  try {
    const { target_type, target_id } = req.query
    const [rows] = await pool.query('SELECT * FROM comments WHERE target_type = ? AND target_id = ? AND status = ? ORDER BY created_at DESC', [target_type, target_id, 'active'])
    res.json(rows)
  } catch { res.status(500).json({ error: '获取评论失败' }) }
})

app.post('/api/comments', authMiddleware, async (req: any, res) => {
  try {
    const { target_type, target_id, content } = req.body
    const id = genId()
    await pool.query('INSERT INTO comments (id, user_id, target_type, target_id, content) VALUES (?, ?, ?, ?, ?)', [id, req.userId, target_type, target_id, content])
    const table = target_type === 'meme' ? 'memes' : 'contents'
    await pool.query(`UPDATE ${table} SET comment_count = comment_count + 1 WHERE id = ?`, [target_id])
    try { await earnPoints(req.userId, 5, 'comment', '评论获得积分') } catch {}
    const [rows] = await pool.query('SELECT * FROM comments WHERE id = ?', [id]) as any[]
    res.json(rows[0])
  } catch { res.status(500).json({ error: '评论失败' }) }
})

// ============================================
// 积分 API
// ============================================
app.get('/api/points/history', authMiddleware, async (req: any, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50
    const [rows] = await pool.query('SELECT * FROM point_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?', [req.userId, limit])
    res.json(rows)
  } catch { res.status(500).json({ error: '获取积分历史失败' }) }
})

app.get('/api/points/balance', authMiddleware, async (req: any, res) => {
  try {
    const [rows] = await pool.query('SELECT points FROM users WHERE id = ?', [req.userId]) as any[]
    res.json({ points: rows[0]?.points || 0 })
  } catch { res.status(500).json({ error: '获取积分余额失败' }) }
})

// ============================================
// 签到 API
// ============================================
app.post('/api/checkin', authMiddleware, async (req: any, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const [existing] = await pool.query('SELECT id FROM sign_ins WHERE user_id = ? AND sign_date = ?', [req.userId, today]) as any[]
    if (existing.length > 0) return res.status(400).json({ error: '今日已签到' })
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const [yesterdayRecord] = await pool.query('SELECT consecutive_days FROM sign_ins WHERE user_id = ? AND sign_date = ?', [req.userId, yesterday]) as any[]
    const consecutiveDays = yesterdayRecord.length > 0 ? yesterdayRecord[0].consecutive_days + 1 : 1
    let bonusPoints = 0
    if (consecutiveDays >= 30) bonusPoints = 200
    else if (consecutiveDays >= 7) bonusPoints = 50
    else if (consecutiveDays >= 3) bonusPoints = 20
    const totalPoints = 10 + bonusPoints
    await pool.query('INSERT INTO sign_ins (id, user_id, sign_date, consecutive_days, points_earned) VALUES (?, ?, ?, ?, ?)', [genId(), req.userId, today, consecutiveDays, totalPoints])
    const result = await earnPoints(req.userId, totalPoints, 'checkin', `签到奖励（连续${consecutiveDays}天）`)
    res.json({ consecutiveDays, pointsEarned: totalPoints, bonusPoints, ...result })
  } catch (err: any) { res.status(500).json({ error: err.message || '签到失败' }) }
})

app.get('/api/checkin/today', authMiddleware, async (req: any, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const [rows] = await pool.query('SELECT id FROM sign_ins WHERE user_id = ? AND sign_date = ?', [req.userId, today]) as any[]
    res.json({ signed: rows.length > 0 })
  } catch { res.status(500).json({ error: '查询失败' }) }
})

app.get('/api/checkin/streak', authMiddleware, async (req: any, res) => {
  try {
    const [rows] = await pool.query('SELECT sign_date, consecutive_days FROM sign_ins WHERE user_id = ? ORDER BY sign_date DESC LIMIT 1', [req.userId]) as any[]
    if (rows.length === 0) return res.json({ streak: 0 })
    const data = rows[0]
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    if (data.sign_date === today || data.sign_date === yesterday) res.json({ streak: data.consecutive_days })
    else res.json({ streak: 0 })
  } catch { res.status(500).json({ error: '查询失败' }) }
})

// ============================================
// 帮推 API
// ============================================
app.post('/api/promotes', authMiddleware, async (req: any, res) => {
  try {
    const { content_id } = req.body
    const [existing] = await pool.query('SELECT id FROM promotes WHERE user_id = ? AND content_id = ?', [req.userId, content_id]) as any[]
    if (existing.length > 0) return res.status(400).json({ error: '已经帮推过该内容' })
    const result = await earnPoints(req.userId, 20, 'promote', '帮推内容获得积分')
    await pool.query('INSERT INTO promotes (id, user_id, content_id, points_earned) VALUES (?, ?, ?, 20)', [genId(), req.userId, content_id])
    await pool.query('UPDATE contents SET promote_count = promote_count + 1 WHERE id = ?', [content_id])
    res.json({ points: result })
  } catch (err: any) { res.status(500).json({ error: err.message || '帮推失败' }) }
})

// ============================================
// 通知 API
// ============================================
app.get('/api/notifications', authMiddleware, async (req: any, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [req.userId])
    res.json(rows)
  } catch { res.status(500).json({ error: '获取通知失败' }) }
})

app.put('/api/notifications/:id/read', authMiddleware, async (req: any, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
    res.json({ success: true })
  } catch { res.status(500).json({ error: '标记已读失败' }) }
})

app.put('/api/notifications/read-all', authMiddleware, async (req: any, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [req.userId])
    res.json({ success: true })
  } catch { res.status(500).json({ error: '全部标记已读失败' }) }
})

// ============================================
// 关注 API
// ============================================
app.post('/api/follows/toggle', authMiddleware, async (req: any, res) => {
  try {
    const { following_id } = req.body
    if (req.userId === following_id) return res.status(400).json({ error: '不能关注自己' })
    const [existing] = await pool.query('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?', [req.userId, following_id]) as any[]
    if (existing.length > 0) {
      await pool.query('DELETE FROM follows WHERE id = ?', [existing[0].id])
      res.json({ following: false })
    } else {
      await pool.query('INSERT INTO follows (id, follower_id, following_id) VALUES (?, ?, ?)', [genId(), req.userId, following_id])
      res.json({ following: true })
    }
  } catch { res.status(500).json({ error: '操作失败' }) }
})

app.get('/api/follows/check', authMiddleware, async (req: any, res) => {
  try {
    const { following_id } = req.query
    const [rows] = await pool.query('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?', [req.userId, following_id]) as any[]
    res.json({ following: rows.length > 0 })
  } catch { res.status(500).json({ error: '查询失败' }) }
})

app.get('/api/follows/counts/:userId', async (req, res) => {
  try {
    const [followers] = await pool.query('SELECT COUNT(*) as count FROM follows WHERE following_id = ?', [req.params.userId]) as any[]
    const [following] = await pool.query('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?', [req.params.userId]) as any[]
    res.json({ followers: followers[0].count, following: following[0].count })
  } catch { res.status(500).json({ error: '获取关注数失败' }) }
})

// ============================================
// 搜索 API
// ============================================
app.get('/api/search', async (req, res) => {
  try {
    const q = req.query.q as string
    if (!q) return res.json({ contents: [], topics: [], memes: [] })
    const [contents] = await pool.query('SELECT * FROM contents WHERE title LIKE ? LIMIT 10', [`%${q}%`])
    const [topics] = await pool.query('SELECT * FROM topics WHERE title LIKE ? LIMIT 10', [`%${q}%`])
    const [memes] = await pool.query('SELECT * FROM memes WHERE title LIKE ? LIMIT 10', [`%${q}%`])
    res.json({ contents, topics, memes })
  } catch { res.status(500).json({ error: '搜索失败' }) }
})

// ============================================
// 任务 API
// ============================================
app.get('/api/tasks', async (req, res) => {
  try {
    let sql = 'SELECT * FROM tasks WHERE status = ?'
    const params: any[] = ['active']
    if (req.query.type) { sql += ' AND type = ?'; params.push(req.query.type) }
    sql += ' ORDER BY created_at DESC'
    const [rows] = await pool.query(sql, params)
    res.json(rows)
  } catch { res.status(500).json({ error: '获取任务失败' }) }
})

app.post('/api/tasks/:id/join', authMiddleware, async (req: any, res) => {
  try {
    const [existing] = await pool.query('SELECT id FROM task_participants WHERE task_id = ? AND user_id = ?', [req.params.id, req.userId]) as any[]
    if (existing.length > 0) return res.status(400).json({ error: '已参与该任务' })
    await pool.query('INSERT INTO task_participants (id, task_id, user_id) VALUES (?, ?, ?)', [genId(), req.params.id, req.userId])
    await pool.query('UPDATE tasks SET current_participants = current_participants + 1 WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch { res.status(500).json({ error: '参与任务失败' }) }
})

app.post('/api/tasks/:id/complete', authMiddleware, async (req: any, res) => {
  try {
    const [tasks] = await pool.query('SELECT reward_points FROM tasks WHERE id = ?', [req.params.id]) as any[]
    if (tasks.length === 0) return res.status(404).json({ error: '任务不存在' })
    await pool.query('UPDATE task_participants SET status = ?, completed_at = NOW() WHERE task_id = ? AND user_id = ?', ['completed', req.params.id, req.userId])
    let reward = 0
    if (tasks[0].reward_points > 0) { await earnPoints(req.userId, tasks[0].reward_points, 'task', '完成任务获得积分'); reward = tasks[0].reward_points }
    res.json({ reward })
  } catch (err: any) { res.status(500).json({ error: err.message || '完成任务失败' }) }
})

app.get('/api/tasks/my', authMiddleware, async (req: any, res) => {
  try {
    const [rows] = await pool.query('SELECT tp.*, t.title, t.description, t.reward_points FROM task_participants tp JOIN tasks t ON tp.task_id = t.id WHERE tp.user_id = ? ORDER BY tp.created_at DESC', [req.userId])
    res.json(rows)
  } catch { res.status(500).json({ error: '获取任务失败' }) }
})

// ============================================
// 投票 API
// ============================================
app.get('/api/votes', async (req, res) => {
  try {
    const status = (req.query.status as string) || 'active'
    const [rows] = await pool.query('SELECT * FROM votes WHERE status = ? ORDER BY created_at DESC', [status])
    res.json(rows)
  } catch { res.status(500).json({ error: '获取投票失败' }) }
})

app.post('/api/votes/:id/cast', authMiddleware, async (req: any, res) => {
  try {
    const { option_index } = req.body
    const [votes] = await pool.query('SELECT * FROM votes WHERE id = ?', [req.params.id]) as any[]
    if (votes.length === 0) return res.status(404).json({ error: '投票不存在' })
    const vote = votes[0]
    if (vote.status !== 'active') return res.status(400).json({ error: '投票已结束' })
    const [existing] = await pool.query('SELECT id FROM vote_records WHERE vote_id = ? AND user_id = ?', [req.params.id, req.userId]) as any[]
    if (existing.length > 0) return res.status(400).json({ error: '已经投过票了' })
    if (vote.vote_cost > 0) await earnPoints(req.userId, vote.vote_cost, 'vote', '投票消耗积分')
    await pool.query('INSERT INTO vote_records (id, vote_id, user_id, option_index, points_spent, points_earned) VALUES (?, ?, ?, ?, ?, ?)', [genId(), req.params.id, req.userId, option_index, vote.vote_cost || 0, vote.vote_reward || 0])
    const options = typeof vote.options === 'string' ? JSON.parse(vote.options) : vote.options
    options[option_index].vote_count += 1
    await pool.query('UPDATE votes SET options = ?, total_votes = total_votes + 1 WHERE id = ?', [JSON.stringify(options), req.params.id])
    if (vote.vote_reward > 0) { try { await earnPoints(req.userId, vote.vote_reward, 'vote', '投票获得积分') } catch {} }
    res.json({ success: true, option: options[option_index] })
  } catch (err: any) { res.status(500).json({ error: err.message || '投票失败' }) }
})

// ============================================
// 成就 API
// ============================================
app.get('/api/achievements', authMiddleware, async (req: any, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM user_achievements WHERE user_id = ?', [req.userId])
    res.json(rows)
  } catch { res.status(500).json({ error: '获取成就失败' }) }
})

app.post('/api/achievements/unlock', authMiddleware, async (req: any, res) => {
  try {
    const { achievement_id, reward_points } = req.body
    const [existing] = await pool.query('SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?', [req.userId, achievement_id]) as any[]
    if (existing.length > 0) return res.json(null)
    const id = genId()
    await pool.query('INSERT INTO user_achievements (id, user_id, achievement_id, reward_claimed) VALUES (?, ?, ?, 0)', [id, req.userId, achievement_id])
    if (reward_points > 0) { try { await earnPoints(req.userId, reward_points, 'achievement', '成就解锁奖励') } catch {} }
    const [rows] = await pool.query('SELECT * FROM user_achievements WHERE id = ?', [id]) as any[]
    res.json(rows[0])
  } catch { res.status(500).json({ error: '解锁成就失败' }) }
})

// ============================================
// 邀请 API
// ============================================
app.get('/api/invite/code', authMiddleware, async (req: any, res) => {
  try {
    const [existing] = await pool.query('SELECT code FROM referral_codes WHERE user_id = ?', [req.userId]) as any[]
    if (existing.length > 0) return res.json({ code: existing[0].code })
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
    await pool.query('INSERT INTO referral_codes (id, user_id, code, uses_count, max_uses) VALUES (?, ?, ?, 0, 0)', [genId(), req.userId, code])
    res.json({ code })
  } catch { res.status(500).json({ error: '获取邀请码失败' }) }
})

app.get('/api/invite/stats', authMiddleware, async (req: any, res) => {
  try {
    const [codeRes] = await pool.query('SELECT code, uses_count FROM referral_codes WHERE user_id = ?', [req.userId]) as any[]
    const [countRes] = await pool.query('SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ?', [req.userId]) as any[]
    const [bonusRes] = await pool.query('SELECT COALESCE(SUM(referrer_reward), 0) as total FROM referrals WHERE referrer_id = ?', [req.userId]) as any[]
    res.json({ code: codeRes[0]?.code || '', inviteCount: countRes[0].count || 0, totalBonus: bonusRes[0].total || 0, usesCount: codeRes[0]?.uses_count || 0 })
  } catch { res.status(500).json({ error: '获取邀请统计失败' }) }
})

app.get('/api/invite/leaderboard', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT r.referrer_id, COUNT(*) as invite_count, u.name, u.avatar FROM referrals r JOIN users u ON r.referrer_id = u.id WHERE r.status = 'registered' GROUP BY r.referrer_id, u.name, u.avatar ORDER BY invite_count DESC LIMIT 10`)
    res.json((rows as any[]).map((r: any, i: number) => ({ rank: i + 1, userId: r.referrer_id, name: r.name, avatar: r.avatar, inviteCount: r.invite_count })))
  } catch { res.status(500).json({ error: '获取排行榜失败' }) }
})

// ============================================
// 活动 API
// ============================================
app.get('/api/activities', async (req, res) => {
  try {
    const status = (req.query.status as string) || 'active'
    const [rows] = await pool.query('SELECT * FROM activities WHERE status = ? ORDER BY created_at DESC', [status])
    res.json(rows)
  } catch { res.status(500).json({ error: '获取活动失败' }) }
})

// ============================================
// 启动
// ============================================
const PORT = process.env.PORT || 3001

async function start() {
  try {
    const conn = await pool.getConnection()
    console.log('✅ MySQL 连接成功')
    conn.release()
  } catch (err: any) {
    console.error('❌ MySQL 连接失败:', err.message)
    process.exit(1)
  }

  app.listen(PORT, () => {
    console.log(`🚀 巨浪 API 服务器运行在 http://localhost:${PORT}`)
  })
}

start()

export default app
