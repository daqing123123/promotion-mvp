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
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 3001

// ===== MySQL 连接池 =====
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 20,
  charset: 'utf8mb4',
})

// 测试连接
async function testConnection() {
  try {
    const conn = await pool.getConnection()
    console.log('✅ MySQL 连接成功')
    conn.release()
  } catch (err) {
    console.error('❌ MySQL 连接失败:', err.message)
    process.exit(1)
  }
}

// ===== JWT 中间件 =====
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: '未登录' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch {
    return res.status(401).json({ error: 'token 无效或已过期' })
  }
}

// 可选认证（不强制）
function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.userId = decoded.userId
    } catch {}
  }
  next()
}

// ===== 工具函数 =====
function genId() { return uuidv4() }

// ============================================
// 认证 API
// ============================================

// 注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, name, invite_code } = req.body
    if (!username || !password) return res.status(400).json({ error: '用户名和密码必填' })

    // 检查用户名是否已存在
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username])
    if (existing.length > 0) return res.status(400).json({ error: '用户名已存在' })

    // 处理邀请码
    let referrerId = null
    if (invite_code) {
      const [codeRows] = await pool.query('SELECT user_id FROM referral_codes WHERE code = ?', [invite_code.toUpperCase()])
      if (codeRows.length > 0) {
        referrerId = codeRows[0].user_id
      }
    }

    const id = genId()
    const passwordHash = await bcrypt.hash(password, 10)
    const avatar = '👤'
    const initialPoints = referrerId ? 150 : 100

    await pool.query(
      'INSERT INTO users (id, username, name, avatar, email, password_hash, points, level, experience) VALUES (?, ?, ?, ?, NULL, ?, ?, 1, 0)',
      [id, username, name || username, avatar, passwordHash, initialPoints]
    )

    // 创建邀请人关系记录
    if (referrerId) {
      await pool.query(
        'INSERT INTO referrals (id, referrer_id, referred_id, referral_code, status, referrer_reward, referred_reward) VALUES (?, ?, ?, ?, ?, 100, 50)',
        [genId(), referrerId, id, invite_code.toUpperCase(), 'registered']
      )
      // 邀请人获得积分
      try { await earnPoints(referrerId, 100, 'invite', '邀请新用户注册奖励') } catch {}
      // 更新邀请码使用次数
      await pool.query('UPDATE referral_codes SET uses_count = uses_count + 1 WHERE user_id = ?', [referrerId])
    }

    const token = jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '30d' })

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [id])
    const user = users[0]
    delete user.password_hash
    res.json({ user, token })
  } catch (err) {
    console.error('注册失败:', err)
    res.status(500).json({ error: '注册失败' })
  }
})

// 登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: '用户名和密码必填' })

    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username])
    if (users.length === 0) return res.status(401).json({ error: '用户名或密码错误' })

    const user = users[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: '用户名或密码错误' })

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' })

    // 不返回密码
    delete user.password_hash
    res.json({ user, token })
  } catch (err) {
    console.error('登录失败:', err)
    res.status(500).json({ error: '登录失败' })
  }
})

// 获取当前用户
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, name, avatar, bio, tags, points, level, experience, created_at FROM users WHERE id = ?',
      [req.userId]
    )
    if (users.length === 0) return res.status(404).json({ error: '用户不存在' })
    res.json(users[0])
  } catch (err) {
    res.status(500).json({ error: '获取用户信息失败' })
  }
})

// 修改密码
app.put('/api/auth/password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: '请输入旧密码和新密码' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: '新密码至少6位' })
    }
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.userId])
    if (users.length === 0) return res.status(404).json({ error: '用户不存在' })
    const user = users[0]
    if (user.password !== oldPassword) {
      return res.status(400).json({ error: '旧密码错误' })
    }
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, req.userId])
    res.json({ success: true, message: '密码修改成功' })
  } catch (err) {
    res.status(500).json({ error: '修改密码失败' })
  }
})

// ============================================
// 用户 API
// ============================================

// 获取用户信息
app.get('/api/users/:id', async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, name, avatar, bio, tags, points, level, experience, created_at FROM users WHERE id = ?',
      [req.params.id]
    )
    if (users.length === 0) return res.status(404).json({ error: '用户不存在' })
    res.json(users[0])
  } catch (err) {
    res.status(500).json({ error: '获取用户失败' })
  }
})

// 更新用户信息
app.put('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    if (req.userId !== req.params.id) return res.status(403).json({ error: '无权修改' })
    const { name, avatar, bio, tags } = req.body
    await pool.query(
      'UPDATE users SET name = COALESCE(?, name), avatar = COALESCE(?, avatar), bio = COALESCE(?, bio), tags = COALESCE(?, tags) WHERE id = ?',
      [name, avatar, bio, tags ? JSON.stringify(tags) : null, req.params.id]
    )
    const [users] = await pool.query(
      'SELECT id, username, name, avatar, bio, tags, points, level, experience FROM users WHERE id = ?',
      [req.params.id]
    )
    res.json(users[0])
  } catch (err) {
    res.status(500).json({ error: '更新失败' })
  }
})

// ============================================
// 用户统计 API（成就系统用）
// ============================================

app.get('/api/users/:id/stats', async (req, res) => {
  try {
    const userId = req.params.id

    const [totalPromotesRes] = await pool.query('SELECT COUNT(*) as count FROM promotes WHERE user_id = ?', [userId])
    const totalPromotes = totalPromotesRes[0]?.count || 0
    const [contentsPublished] = await pool.query('SELECT COUNT(*) as count FROM contents WHERE creator_id = ?', [userId])
    const [totalLikes] = await pool.query('SELECT COALESCE(SUM(like_count), 0) as count FROM contents WHERE creator_id = ?', [userId])
    const [totalComments] = await pool.query('SELECT COUNT(*) as count FROM comments WHERE user_id = ?', [userId])
    const [checkInRes] = await pool.query('SELECT MAX(consecutive_days) as max_consecutive, COUNT(*) as total FROM sign_ins WHERE user_id = ?', [userId])
    const [followers] = await pool.query('SELECT COUNT(*) as count FROM follows WHERE following_id = ?', [userId])
    const [userRes] = await pool.query('SELECT points FROM users WHERE id = ?', [userId])
    const [tasksCompleted] = await pool.query('SELECT COUNT(*) as count FROM task_participants WHERE user_id = ? AND status = ?', [userId, 'completed'])
    const [votesParticipated] = await pool.query('SELECT COUNT(*) as count FROM vote_records WHERE user_id = ?', [userId])

    res.json({
      totalPromotes,
      contentPublished: contentsPublished[0].count || 0,
      totalLikes: totalLikes[0].count || 0,
      totalComments: totalComments[0].count || 0,
      consecutiveCheckInDays: checkInRes[0]?.max_consecutive || 0,
      totalCheckInDays: checkInRes[0]?.total || 0,
      followers: followers[0].count || 0,
      totalPoints: userRes[0]?.points || 0,
      tasksCompleted: tasksCompleted[0].count || 0,
      votesParticipated: votesParticipated[0].count || 0,
    })
  } catch (err) {
    res.status(500).json({ error: '获取用户统计失败' })
  }
})

// ============================================
// 内容 API
// ============================================

// 获取内容列表
app.get('/api/contents', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20
    const offset = parseInt(req.query.offset) || 0
    const type = req.query.type

    let sql = 'SELECT * FROM contents WHERE status = ?'
    const params = ['published']

    if (type && type !== 'all') {
      sql += ' AND type = ?'
      params.push(type)
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const [rows] = await pool.query(sql, params)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: '获取内容失败' })
  }
})

// 获取单个内容
app.get('/api/contents/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM contents WHERE id = ?', [req.params.id])
    if (rows.length === 0) return res.status(404).json({ error: '内容不存在' })

    // 异步增加浏览量
    pool.query('UPDATE contents SET view_count = view_count + 1 WHERE id = ?', [req.params.id])

    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: '获取内容失败' })
  }
})

// 创建内容
app.post('/api/contents', authMiddleware, async (req, res) => {
  try {
    const { type, title, description, cover_url, url, tags, render_mode, render_src, render_config } = req.body
    const id = genId()
    await pool.query(
      'INSERT INTO contents (id, type, title, description, cover_url, url, tags, render_mode, render_src, render_config, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, type || 'article', title, description || '', cover_url || '', url || '', JSON.stringify(tags || []), render_mode || 'card', render_src || '', render_config ? JSON.stringify(render_config) : null, req.userId]
    )
    // 发布内容给积分
    try { await earnPoints(req.userId, 5, 'publish', '发布内容获得积分') } catch {}

    const [rows] = await pool.query('SELECT * FROM contents WHERE id = ?', [id])
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: '创建内容失败' })
  }
})

// ============================================
// 话题 API
// ============================================

// 自动过期：将 end_date 已过的话题标记为 completed
async function autoExpireTopics() {
  try {
    await pool.query(
      "UPDATE topics SET status = 'completed' WHERE status = 'active' AND end_date IS NOT NULL AND end_date != '' AND end_date < NOW()"
    )
  } catch {}
}

app.get('/api/topics', async (req, res) => {
  try {
    await autoExpireTopics()
    const type = req.query.type
    let sql = 'SELECT * FROM topics WHERE status = ?'
    const params = ['active']
    if (type && type !== 'all') {
      sql += ' AND type = ?'
      params.push(type)
    }
    sql += ' ORDER BY hot_score DESC'
    const [rows] = await pool.query(sql, params)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: '获取话题失败' })
  }
})

app.get('/api/topics/:id', async (req, res) => {
  try {
    await autoExpireTopics()
    const [rows] = await pool.query('SELECT * FROM topics WHERE id = ?', [req.params.id])
    if (rows.length === 0) return res.status(404).json({ error: '话题不存在' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: '获取话题失败' })
  }
})

// ============================================
// 梗/Meme API
// ============================================

app.get('/api/memes', async (req, res) => {
  try {
    const { topic_id, user_id, id } = req.query
    const limit = parseInt(req.query.limit) || 20
    const offset = parseInt(req.query.offset) || 0

    let sql = 'SELECT * FROM memes WHERE status = ?'
    const params = ['published']

    if (id) { sql += ' AND id = ?'; params.push(id) }
    if (topic_id) { sql += ' AND topic_id = ?'; params.push(topic_id) }
    if (user_id) { sql += ' AND creator_id = ?'; params.push(user_id) }

    sql += ' ORDER BY hot_score DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const [rows] = await pool.query(sql, params)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: '获取梗失败' })
  }
})

app.post('/api/memes', authMiddleware, async (req, res) => {
  try {
    const { type, title, content, topic_id, source_content_id, hashtags } = req.body
    const id = genId()

    // 获取用户信息
    const [users] = await pool.query('SELECT name, avatar FROM users WHERE id = ?', [req.userId])
    const user = users[0] || { name: '', avatar: '👤' }

    await pool.query(
      'INSERT INTO memes (id, type, title, content, topic_id, source_content_id, hashtags, creator_id, creator_name, creator_avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, type || 'text', title, content || '', topic_id || null, source_content_id || null, JSON.stringify(hashtags || []), req.userId, user.name, user.avatar]
    )
    const [rows] = await pool.query('SELECT * FROM memes WHERE id = ?', [id])
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: '创建梗失败' })
  }
})

// ============================================
// 互动 API（点赞/收藏）
// ============================================

// 删除内容（仅作者本人）
app.delete('/api/contents/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT creator_id FROM contents WHERE id = ?', [req.params.id])
    if (rows.length === 0) return res.status(404).json({ error: '内容不存在' })
    if (rows[0].creator_id !== req.userId) return res.status(403).json({ error: '只能删除自己的内容' })
    
    await pool.query('DELETE FROM interactions WHERE target_type = ? AND target_id = ?', ['content', req.params.id])
    await pool.query('DELETE FROM comments WHERE target_type = ? AND target_id = ?', ['content', req.params.id])
    await pool.query('DELETE FROM contents WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: '删除失败' })
  }
})

// 删除梗（仅作者本人）
app.delete('/api/memes/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT creator_id FROM memes WHERE id = ?', [req.params.id])
    if (rows.length === 0) return res.status(404).json({ error: '梗不存在' })
    if (rows[0].creator_id !== req.userId) return res.status(403).json({ error: '只能删除自己的梗' })
    
    await pool.query('DELETE FROM interactions WHERE target_type = ? AND target_id = ?', ['meme', req.params.id])
    await pool.query('DELETE FROM comments WHERE target_type = ? AND target_id = ?', ['meme', req.params.id])
    await pool.query('DELETE FROM memes WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: '删除失败' })
  }
})

app.post('/api/interactions/toggle', authMiddleware, async (req, res) => {
  try {
    const { target_type, target_id, action } = req.body

    const [existing] = await pool.query(
      'SELECT id FROM interactions WHERE user_id = ? AND target_type = ? AND target_id = ? AND action = ?',
      [req.userId, target_type, target_id, action]
    )

    const table = target_type === 'meme' ? 'memes' : 'contents'
    const countField = action === 'like' ? 'like_count' : 'favorite_count'

    if (existing.length > 0) {
      // 取消互动
      await pool.query('DELETE FROM interactions WHERE id = ?', [existing[0].id])
      await pool.query(`UPDATE ${table} SET ${countField} = GREATEST(0, ${countField} - 1) WHERE id = ?`, [target_id])
      // 取消点赞扣回积分
      if (action === 'like') {
        try { await earnPoints(req.userId, -5, 'like_cancel', '取消点赞') } catch {}
      }
      res.json({ toggled: false })
    } else {
      // 添加
      await pool.query(
        'INSERT INTO interactions (id, user_id, target_type, target_id, action) VALUES (?, ?, ?, ?, ?)',
        [genId(), req.userId, target_type, target_id, action]
      )
      await pool.query(`UPDATE ${table} SET ${countField} = ${countField} + 1 WHERE id = ?`, [target_id])

      // 点赞给积分
      if (action === 'like') {
        try { await earnPoints(req.userId, 5, 'like', '点赞获得积分') } catch {}
      }

      res.json({ toggled: true })
    }
  } catch (err) {
    res.status(500).json({ error: '操作失败' })
  }
})

// 检查互动状态
app.get('/api/interactions/check', authMiddleware, async (req, res) => {
  try {
    const { target_type, target_id, action } = req.query
    const [rows] = await pool.query(
      'SELECT id FROM interactions WHERE user_id = ? AND target_type = ? AND target_id = ? AND action = ?',
      [req.userId, target_type, target_id, action]
    )
    res.json({ exists: rows.length > 0 })
  } catch (err) {
    res.status(500).json({ error: '查询失败' })
  }
})

// ============================================
// 评论 API
// ============================================

app.get('/api/comments', async (req, res) => {
  try {
    const { target_type, target_id } = req.query
    const [rows] = await pool.query(
      'SELECT * FROM comments WHERE target_type = ? AND target_id = ? AND status = ? ORDER BY created_at DESC',
      [target_type, target_id, 'active']
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: '获取评论失败' })
  }
})

app.post('/api/comments', authMiddleware, async (req, res) => {
  try {
    const { target_type, target_id, content } = req.body
    const id = genId()
    await pool.query(
      'INSERT INTO comments (id, user_id, target_type, target_id, content) VALUES (?, ?, ?, ?, ?)',
      [id, req.userId, target_type, target_id, content]
    )

    // 更新评论数
    const table = target_type === 'meme' ? 'memes' : 'contents'
    await pool.query(`UPDATE ${table} SET comment_count = comment_count + 1 WHERE id = ?`, [target_id])

    // 评论给积分
    try { await earnPoints(req.userId, 5, 'comment', '评论获得积分') } catch {}

    const [rows] = await pool.query('SELECT * FROM comments WHERE id = ?', [id])
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: '评论失败' })
  }
})

// ============================================
// 积分系统
// ============================================

const DAILY_POINT_LIMITS = {
  checkin: 10, publish: 50, like: 25, promote: 100,
  comment: 25, vote: 50, task: 200,
}
const DAILY_TOTAL_LIMIT = 500

async function checkDailyLimit(userId, type, amount) {
  const today = new Date().toISOString().split('T')[0]
  const [rows] = await pool.query(
    'SELECT * FROM daily_point_limits WHERE user_id = ? AND limit_date = ?',
    [userId, today]
  )

  if (rows.length === 0) {
    await pool.query(
      'INSERT INTO daily_point_limits (id, user_id, limit_date, total_earned, breakdown) VALUES (?, ?, ?, ?, ?)',
      [genId(), userId, today, amount, JSON.stringify({ [type]: amount })]
    )
    return true
  }

  const record = rows[0]
  const breakdown = (typeof record.breakdown === 'object' ? record.breakdown : JSON.parse(record.breakdown || '{}'))
  const typeTotal = (breakdown[type] || 0) + amount
  const newTotal = record.total_earned + amount

  const typeLimit = DAILY_POINT_LIMITS[type]
  if (typeLimit && typeTotal > typeLimit) return false
  if (newTotal > DAILY_TOTAL_LIMIT) return false

  breakdown[type] = typeTotal
  await pool.query(
    'UPDATE daily_point_limits SET total_earned = ?, breakdown = ? WHERE id = ?',
    [newTotal, JSON.stringify(breakdown), record.id]
  )
  return true
}

async function earnPoints(userId, amount, type, description) {
  if (amount <= 0) throw new Error('Amount must be positive')

  const allowed = await checkDailyLimit(userId, type, amount)
  if (!allowed) throw new Error('今日该类积分已达上限')

  const [users] = await pool.query('SELECT points, level, experience FROM users WHERE id = ?', [userId])
  if (users.length === 0) throw new Error('User not found')
  const user = users[0]

  const newPoints = user.points + amount
  const newExp = (user.experience || 0) + amount

  // 等级计算
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

  await pool.query(
    'UPDATE users SET points = ?, level = ?, experience = ? WHERE id = ?',
    [finalPoints, newLevel, newExp, userId]
  )

  await pool.query(
    'INSERT INTO point_logs (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)',
    [genId(), userId, amount, type, description]
  )

  if (levelUpBonus > 0) {
    await pool.query(
      'INSERT INTO point_logs (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)',
      [genId(), userId, levelUpBonus, 'level_up', `升级到 Lv.${newLevel} 奖励`]
    )
  }

  return { points: finalPoints, level: newLevel, experience: newExp, levelUpBonus, oldLevel, newLevel }
}


// 积分消费（扣积分 + 记录日志）
async function spendPoints(userId, amount, type, description) {
  if (amount <= 0) throw new Error('消费金额必须为正数')
  
  const [users] = await pool.query('SELECT points, level, experience FROM users WHERE id = ?', [userId])
  if (users.length === 0) throw new Error('用户不存在')
  
  const currentPoints = users[0].points || 0
  if (currentPoints < amount) throw new Error('积分不足')
  
  const newPoints = currentPoints - amount
  await pool.query('UPDATE users SET points = ? WHERE id = ?', [newPoints, userId])
  
  await pool.query(
    'INSERT INTO point_logs (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)',
    [genId(), userId, -amount, type, description]
  )
  
  return { points: newPoints, spent: amount }
}

// 积分相关 API
app.get('/api/points/history', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50
    const [rows] = await pool.query(
      'SELECT * FROM point_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [req.userId, limit]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: '获取积分历史失败' })
  }
})

app.get('/api/points/balance', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT points FROM users WHERE id = ?', [req.userId])
    res.json({ points: rows[0]?.points || 0 })
  } catch (err) {
    res.status(500).json({ error: '获取积分余额失败' })
  }
})

// ============================================
// 签到 API
// ============================================

app.post('/api/checkin', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const [existing] = await pool.query(
      'SELECT id FROM sign_ins WHERE user_id = ? AND sign_date = ?',
      [req.userId, today]
    )
    if (existing.length > 0) return res.status(400).json({ error: '今日已签到' })

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const [yesterdayRecord] = await pool.query(
      'SELECT consecutive_days FROM sign_ins WHERE user_id = ? AND sign_date = ?',
      [req.userId, yesterday]
    )
    const consecutiveDays = yesterdayRecord.length > 0 ? yesterdayRecord[0].consecutive_days + 1 : 1

    let bonusPoints = 0
    if (consecutiveDays >= 30) bonusPoints = 200
    else if (consecutiveDays >= 7) bonusPoints = 50
    else if (consecutiveDays >= 3) bonusPoints = 20

    const totalPoints = 10 + bonusPoints

    await pool.query(
      'INSERT INTO sign_ins (id, user_id, sign_date, consecutive_days, points_earned) VALUES (?, ?, ?, ?, ?)',
      [genId(), req.userId, today, consecutiveDays, totalPoints]
    )

    const result = await earnPoints(req.userId, totalPoints, 'checkin', `签到奖励（连续${consecutiveDays}天）`)

    res.json({ consecutiveDays, pointsEarned: totalPoints, bonusPoints, ...result })
  } catch (err) {
    res.status(500).json({ error: err.message || '签到失败' })
  }
})

app.get('/api/checkin/today', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const [rows] = await pool.query(
      'SELECT id FROM sign_ins WHERE user_id = ? AND sign_date = ?',
      [req.userId, today]
    )
    res.json({ signed: rows.length > 0 })
  } catch (err) {
    res.status(500).json({ error: '查询失败' })
  }
})

app.get('/api/checkin/streak', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT sign_date, consecutive_days FROM sign_ins WHERE user_id = ? ORDER BY sign_date DESC LIMIT 1',
      [req.userId]
    )
    if (rows.length === 0) return res.json({ streak: 0 })

    const data = rows[0]
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    if (data.sign_date === today || data.sign_date === yesterday) {
      res.json({ streak: data.consecutive_days })
    } else {
      res.json({ streak: 0 })
    }
  } catch (err) {
    res.status(500).json({ error: '查询失败' })
  }
})

// ============================================
// 帮推 API
// ============================================

app.post('/api/promotes', authMiddleware, async (req, res) => {
  try {
    const { content_id } = req.body

    const [existing] = await pool.query(
      'SELECT id FROM promotes WHERE user_id = ? AND content_id = ?',
      [req.userId, content_id]
    )
    if (existing.length > 0) return res.status(400).json({ error: '已经帮推过该内容' })

    const result = await earnPoints(req.userId, 20, 'promote', '帮推内容获得积分')

    const id = genId()
    await pool.query(
      'INSERT INTO promotes (id, user_id, content_id, points_earned) VALUES (?, ?, ?, 20)',
      [id, req.userId, content_id]
    )

    await pool.query('UPDATE contents SET promote_count = promote_count + 1 WHERE id = ?', [content_id])

    res.json({ id, points: result })
  } catch (err) {
    res.status(500).json({ error: err.message || '帮推失败' })
  }
})

// ============================================
// 通知 API
// ============================================

app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [req.userId]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: '获取通知失败' })
  }
})

app.put('/api/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: '标记已读失败' })
  }
})

app.put('/api/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [req.userId])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: '全部标记已读失败' })
  }
})

// ============================================
// 关注 API
// ============================================

app.post('/api/follows/toggle', authMiddleware, async (req, res) => {
  try {
    const { following_id } = req.body
    if (req.userId === following_id) return res.status(400).json({ error: '不能关注自己' })

    const [existing] = await pool.query(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
      [req.userId, following_id]
    )

    if (existing.length > 0) {
      await pool.query('DELETE FROM follows WHERE id = ?', [existing[0].id])
      res.json({ following: false })
    } else {
      await pool.query(
        'INSERT INTO follows (id, follower_id, following_id) VALUES (?, ?, ?)',
        [genId(), req.userId, following_id]
      )
      res.json({ following: true })
    }
  } catch (err) {
    res.status(500).json({ error: '操作失败' })
  }
})

app.get('/api/follows/check', authMiddleware, async (req, res) => {
  try {
    const { following_id } = req.query
    const [rows] = await pool.query(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
      [req.userId, following_id]
    )
    res.json({ following: rows.length > 0 })
  } catch (err) {
    res.status(500).json({ error: '查询失败' })
  }
})

app.get('/api/follows/counts/:userId', async (req, res) => {
  try {
    const [followers] = await pool.query(
      'SELECT COUNT(*) as count FROM follows WHERE following_id = ?', [req.params.userId]
    )
    const [following] = await pool.query(
      'SELECT COUNT(*) as count FROM follows WHERE follower_id = ?', [req.params.userId]
    )
    res.json({ followers: followers[0].count, following: following[0].count })
  } catch (err) {
    res.status(500).json({ error: '获取关注数失败' })
  }
})

// ============================================
// 搜索 API
// ============================================

app.get('/api/search', async (req, res) => {
  try {
    const q = req.query.q
    if (!q) return res.json({ contents: [], topics: [], memes: [] })

    const [contents] = await pool.query(
      'SELECT * FROM contents WHERE title LIKE ? LIMIT 10', [`%${q}%`]
    )
    const [topics] = await pool.query(
      'SELECT * FROM topics WHERE title LIKE ? LIMIT 10', [`%${q}%`]
    )
    const [memes] = await pool.query(
      'SELECT * FROM memes WHERE title LIKE ? LIMIT 10', [`%${q}%`]
    )

    res.json({ contents, topics, memes })
  } catch (err) {
    res.status(500).json({ error: '搜索失败' })
  }
})

// ============================================
// 任务 API
// ============================================

app.get('/api/tasks', async (req, res) => {
  try {
    const type = req.query.type
    let sql = 'SELECT * FROM tasks WHERE status = ?'
    const params = ['active']
    if (type) { sql += ' AND type = ?'; params.push(type) }
    sql += ' ORDER BY created_at DESC'
    const [rows] = await pool.query(sql, params)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: '获取任务失败' })
  }
})

app.post('/api/tasks/:id/join', authMiddleware, async (req, res) => {
  try {
    const [existing] = await pool.query(
      'SELECT id FROM task_participants WHERE task_id = ? AND user_id = ?',
      [req.params.id, req.userId]
    )
    if (existing.length > 0) return res.status(400).json({ error: '已参与该任务' })

    await pool.query(
      'INSERT INTO task_participants (id, task_id, user_id) VALUES (?, ?, ?)',
      [genId(), req.params.id, req.userId]
    )
    await pool.query('UPDATE tasks SET current_participants = current_participants + 1 WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: '参与任务失败' })
  }
})

app.post('/api/tasks/:id/complete', authMiddleware, async (req, res) => {
  try {
    const [tasks] = await pool.query('SELECT reward_points FROM tasks WHERE id = ?', [req.params.id])
    if (tasks.length === 0) return res.status(404).json({ error: '任务不存在' })

    await pool.query(
      'UPDATE task_participants SET status = ?, completed_at = NOW() WHERE task_id = ? AND user_id = ?',
      ['completed', req.params.id, req.userId]
    )

    let reward = 0
    if (tasks[0].reward_points > 0) {
      const result = await earnPoints(req.userId, tasks[0].reward_points, 'task', '完成任务获得积分')
      reward = tasks[0].reward_points
    }

    res.json({ reward })
  } catch (err) {
    res.status(500).json({ error: err.message || '完成任务失败' })
  }
})

app.get('/api/tasks/my', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT tp.*, t.title, t.description, t.reward_points FROM task_participants tp JOIN tasks t ON tp.task_id = t.id WHERE tp.user_id = ? ORDER BY tp.created_at DESC',
      [req.userId]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: '获取任务失败' })
  }
})

// ============================================
// 投票 API
// ============================================

app.get('/api/votes', async (req, res) => {
  try {
    const status = req.query.status || 'active'
    const [rows] = await pool.query('SELECT * FROM votes WHERE status = ? ORDER BY created_at DESC', [status])
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: '获取投票失败' })
  }
})

app.post('/api/votes/:id/cast', authMiddleware, async (req, res) => {
  try {
    const { option_index } = req.body
    const [votes] = await pool.query('SELECT * FROM votes WHERE id = ?', [req.params.id])
    if (votes.length === 0) return res.status(404).json({ error: '投票不存在' })
    const vote = votes[0]
    if (vote.status !== 'active') return res.status(400).json({ error: '投票已结束' })

    const [existing] = await pool.query(
      'SELECT id FROM vote_records WHERE vote_id = ? AND user_id = ?',
      [req.params.id, req.userId]
    )
    if (existing.length > 0) return res.status(400).json({ error: '已经投过票了' })

    if (vote.vote_cost > 0) {
      await earnPoints(req.userId, vote.vote_cost, 'vote', '投票消耗积分')
    }

    await pool.query(
      'INSERT INTO vote_records (id, vote_id, user_id, option_index, points_spent, points_earned) VALUES (?, ?, ?, ?, ?, ?)',
      [genId(), req.params.id, req.userId, option_index, vote.vote_cost || 0, vote.vote_reward || 0]
    )

    // 更新选项计数
    const options = typeof vote.options === 'string' ? JSON.parse(vote.options) : vote.options
    options[option_index].vote_count += 1
    await pool.query(
      'UPDATE votes SET options = ?, total_votes = total_votes + 1 WHERE id = ?',
      [JSON.stringify(options), req.params.id]
    )

    if (vote.vote_reward > 0) {
      try { await earnPoints(req.userId, vote.vote_reward, 'vote', '投票获得积分') } catch {}
    }

    res.json({ success: true, option: options[option_index] })
  } catch (err) {
    res.status(500).json({ error: err.message || '投票失败' })
  }
})

// ============================================
// 成就 API
// ============================================

app.get('/api/achievements', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM user_achievements WHERE user_id = ?', [req.userId])
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: '获取成就失败' })
  }
})

app.post('/api/achievements/unlock', authMiddleware, async (req, res) => {
  try {
    const { achievement_id, reward_points } = req.body
    const [existing] = await pool.query(
      'SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
      [req.userId, achievement_id]
    )
    if (existing.length > 0) return res.json(null)

    const id = genId()
    await pool.query(
      'INSERT INTO user_achievements (id, user_id, achievement_id, reward_claimed) VALUES (?, ?, ?, 0)',
      [id, req.userId, achievement_id]
    )

    if (reward_points > 0) {
      try { await earnPoints(req.userId, reward_points, 'achievement', '成就解锁奖励') } catch {}
    }

    const [rows] = await pool.query('SELECT * FROM user_achievements WHERE id = ?', [id])
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: '解锁成就失败' })
  }
})

// ============================================
// 邀请 API
// ============================================

app.get('/api/invite/code', authMiddleware, async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT code FROM referral_codes WHERE user_id = ?', [req.userId])
    if (existing.length > 0) return res.json({ code: existing[0].code })

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]

    await pool.query(
      'INSERT INTO referral_codes (id, user_id, code, uses_count, max_uses) VALUES (?, ?, ?, 0, 0)',
      [genId(), req.userId, code]
    )
    res.json({ code })
  } catch (err) {
    res.status(500).json({ error: '获取邀请码失败' })
  }
})

app.get('/api/invite/stats', authMiddleware, async (req, res) => {
  try {
    const [codeRes] = await pool.query('SELECT code, uses_count FROM referral_codes WHERE user_id = ?', [req.userId])
    const [countRes] = await pool.query('SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ?', [req.userId])
    const [bonusRes] = await pool.query('SELECT COALESCE(SUM(referrer_reward), 0) as total FROM referrals WHERE referrer_id = ?', [req.userId])

    res.json({
      code: codeRes[0]?.code || '',
      inviteCount: countRes[0].count || 0,
      totalBonus: bonusRes[0].total || 0,
      usesCount: codeRes[0]?.uses_count || 0,
    })
  } catch (err) {
    res.status(500).json({ error: '获取邀请统计失败' })
  }
})

app.get('/api/invite/leaderboard', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.referrer_id, COUNT(*) as invite_count, u.name, u.avatar
      FROM referrals r
      JOIN users u ON r.referrer_id = u.id
      WHERE r.status = 'registered'
      GROUP BY r.referrer_id, u.name, u.avatar
      ORDER BY invite_count DESC
      LIMIT 10
    `)

    res.json(rows.map((r, i) => ({
      rank: i + 1,
      userId: r.referrer_id,
      name: r.name,
      avatar: r.avatar,
      inviteCount: r.invite_count,
    })))
  } catch (err) {
    res.status(500).json({ error: '获取排行榜失败' })
  }
})

// 填写邀请码（已注册用户补填）
app.post('/api/invite/claim', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body
    if (!code) return res.status(400).json({ error: '请输入邀请码' })

    const [codeRows] = await pool.query('SELECT user_id FROM referral_codes WHERE code = ?', [code.toUpperCase()])
    if (codeRows.length === 0) return res.status(400).json({ error: '邀请码不存在' })

    const referrerId = codeRows[0].user_id
    if (referrerId === req.userId) return res.status(400).json({ error: '不能使用自己的邀请码' })

    const [existing] = await pool.query('SELECT id FROM referrals WHERE referred_id = ?', [req.userId])
    if (existing.length > 0) return res.status(400).json({ error: '已经填写过邀请码了' })

    await pool.query(
      'INSERT INTO referrals (id, referrer_id, referred_id, referral_code, status, referrer_reward, referred_reward) VALUES (?, ?, ?, ?, ?, 100, 50)',
      [genId(), referrerId, req.userId, code.toUpperCase(), 'registered']
    )

    try { await earnPoints(referrerId, 100, 'invite', '邀请新用户注册奖励') } catch {}
    try { await earnPoints(req.userId, 50, 'invite', '填写邀请码获得积分') } catch {}

    await pool.query('UPDATE referral_codes SET uses_count = uses_count + 1 WHERE user_id = ?', [referrerId])

    res.json({ success: true, bonus: 50 })
  } catch (err) {
    res.status(500).json({ error: err.message || '填写邀请码失败' })
  }
})

// ============================================
// 活动 API
// ============================================

app.get('/api/activities', async (req, res) => {
  try {
    const status = req.query.status || 'active'
    const [rows] = await pool.query(
      'SELECT * FROM activities WHERE status = ? ORDER BY created_at DESC',
      [status]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: '获取活动失败' })
  }
})

app.post('/api/activities', authMiddleware, async (req, res) => {
  try {
    const { type, title, description, reward, end_date, max_participants } = req.body
    const id = genId()
    const [users] = await pool.query('SELECT name, avatar FROM users WHERE id = ?', [req.userId])
    const user = users[0] || { name: '', avatar: '👤' }

    await pool.query(
      'INSERT INTO activities (id, type, title, description, reward, end_date, max_participants, participant_count, status, created_by, creator_name, creator_avatar) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)',
      [id, type || 'event', title, description || '', reward || '', end_date || null, max_participants || 0, 'active', req.userId, user.name, user.avatar]
    )
    const [rows] = await pool.query('SELECT * FROM activities WHERE id = ?', [id])
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: '创建活动失败' })
  }
})

app.post('/api/activities/:id/join', authMiddleware, async (req, res) => {
  try {
    const [existing] = await pool.query(
      'SELECT id FROM activity_participants WHERE activity_id = ? AND user_id = ?',
      [req.params.id, req.userId]
    )
    if (existing.length > 0) return res.status(400).json({ error: '已参与该活动' })

    await pool.query(
      'INSERT INTO activity_participants (id, activity_id, user_id) VALUES (?, ?, ?)',
      [genId(), req.params.id, req.userId]
    )
    await pool.query('UPDATE activities SET participant_count = participant_count + 1 WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: '参与活动失败' })
  }
})

// ============================================
// 话题创建 API
// ============================================

app.post('/api/topics', authMiddleware, async (req, res) => {
  try {
    const {
      title, description, type, tags, status,
      hot_score, participant_count, meme_count,
      creator_type, brand_name, brand_logo, brand_description,
      promote_reward, promote_target, promote_count,
      reward_type, reward_description, reward_pool,
      coupon_type, coupon_value, coupon_count,
    } = req.body

    const id = genId()
    const [users] = await pool.query('SELECT name, avatar FROM users WHERE id = ?', [req.userId])
    const user = users[0] || { name: '', avatar: '👤' }

    await pool.query(
      `INSERT INTO topics (id, title, description, type, tags, status, hot_score, participant_count, meme_count,
        creator_id, creator_name, creator_avatar, creator_type,
        brand_name, brand_logo, brand_description,
        promote_reward, promote_target, promote_count,
        reward_type, reward_description, reward_pool,
        coupon_type, coupon_value, coupon_count, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title, description || '', type || 'discussion',
        typeof tags === 'string' ? tags : JSON.stringify(tags || []),
        status || 'active', 0, 0, 0,
        req.userId, user.name, user.avatar, creator_type || 'personal',
        brand_name || '', brand_logo || '', brand_description || '',
        promote_reward || 20, promote_target || 100, promote_count || 0,
        reward_type || 'points', reward_description || '', reward_pool || 0,
        coupon_type || '', coupon_value || '', coupon_count || 0,
        req.userId]
    )

    // 发布话题给积分
    try { await earnPoints(req.userId, 10, 'publish', '发布话题获得积分') } catch {}

    const [rows] = await pool.query('SELECT * FROM topics WHERE id = ?', [id])
    res.json(rows[0])
  } catch (err) {
    console.error('创建话题失败:', err)
    res.status(500).json({ error: '创建话题失败' })
  }
})

// ============================================
// 话题更新 API
// ============================================

app.put('/api/topics/:id', authMiddleware, async (req, res) => {
  try {
    const fields = []
    const values = []
    const allowed = [
      'title','description','status','hot_score','participant_count','meme_count','like_count',
      'promote_reward','promote_target','promote_count',
      'reward_type','reward_description','reward_pool',
      'coupon_type','coupon_value','coupon_count','coupon_claimed',
      'end_date'
    ]
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = ?`)
        values.push(req.body[key])
      }
    }
    if (fields.length === 0) return res.status(400).json({ error: '没有要更新的字段' })
    values.push(req.params.id)
    await pool.query(`UPDATE topics SET ${fields.join(', ')} WHERE id = ?`, values)
    const [rows] = await pool.query('SELECT * FROM topics WHERE id = ?', [req.params.id])
    res.json(rows[0])
  } catch (err) {
    console.error('更新话题失败:', err)
    res.status(500).json({ error: '更新话题失败' })
  }
})

// ============================================
// 话题推广 API（核心：接受推广 → 记录 → 给积分 → 扣奖励池）
// ============================================

// 获取话题推广记录列表
app.get('/api/topics/:id/promotes', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM topic_promotes WHERE topic_id = ? ORDER BY created_at DESC',
      [req.params.id]
    )
    res.json(rows)
  } catch (err) {
    // 表不存在时返回空数组
    res.json([])
  }
})

// 接受推广任务（普通用户推广话题）
app.post('/api/topics/:id/promotes', authMiddleware, async (req, res) => {
  try {
    const topicId = req.params.id
    const userId = req.userId
    const { receiver_name, receiver_phone, receiver_address } = req.body

    // 1. 获取话题信息
    const [topics] = await pool.query('SELECT * FROM topics WHERE id = ?', [topicId])
    if (topics.length === 0) return res.status(404).json({ error: '话题不存在' })
    const topic = topics[0]

    // 2. 话题必须活跃
    if (topic.status !== 'active') return res.status(400).json({ error: '该话题已结束' })

    // 3. 不能推广自己的话题
    if (topic.created_by === userId || topic.creator_id === userId) {
      return res.status(400).json({ error: '不能推广自己的话题' })
    }

    // 4. 检查是否已经推广过
    const [existing] = await pool.query(
      'SELECT id FROM topic_promotes WHERE topic_id = ? AND user_id = ?',
      [topicId, userId]
    )
    if (existing.length > 0) return res.status(400).json({ error: '已经推广过该话题了' })

    // 5. 检查奖励池
    const promoteReward = topic.promote_reward || 20
    const rewardPool = topic.reward_pool || 0
    const promoteTarget = topic.promote_target || 100
    const currentCount = (topic.promote_count || 0) + 1

    // 积分奖励类型：检查奖励池是否够
    if ((topic.reward_type === 'points' || topic.reward_type === 'both' || !topic.reward_type) && rewardPool > 0 && promoteReward > rewardPool) {
      return res.status(400).json({ error: '奖励池积分不足，推广已结束' })
    }

    // 6. 记录推广
    const promoteId = genId()
    await pool.query(
      'INSERT INTO topic_promotes (id, topic_id, user_id, status, points_earned, receiver_name, receiver_phone, receiver_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [promoteId, topicId, userId, req.body.status || 'accepted', promoteReward, receiver_name || null, receiver_phone || null, receiver_address || null]
    )

    // 7. 发积分
    try {
      await earnPoints(userId, promoteReward, 'promote', `推广话题「${topic.title}」`)
    } catch (e) {
      // 如果积分达上限，仍然允许推广但不加分
      if (!e.message?.includes('已达上限')) {
        // 回滚推广记录
        await pool.query('DELETE FROM topic_promotes WHERE id = ?', [promoteId])
        throw e
      }
    }

    // 8. 扣减奖励池
    const poolUpdates = []
    const poolValues = []
    if (rewardPool > 0) {
      const newPool = Math.max(0, rewardPool - promoteReward)
      poolUpdates.push('reward_pool = ?')
      poolValues.push(newPool)
    }

    // 9. 更新话题推广计数
    poolUpdates.push('promote_count = ?')
    poolValues.push(currentCount)
    poolUpdates.push('participant_count = participant_count + 1')

    // 10. 检查是否达到推广目标 → 自动结束
    if (currentCount >= promoteTarget) {
      poolUpdates.push('status = ?')
      poolValues.push('completed')
    }

    // 检查奖励池是否耗尽 → 自动结束
    const remainingPool = rewardPool > 0 ? Math.max(0, rewardPool - promoteReward) : 0
    if (rewardPool > 0 && remainingPool <= 0) {
      poolUpdates.push('status = ?')
      poolValues.push('completed')
    }

    if (poolUpdates.length > 0) {
      poolValues.push(topicId)
      await pool.query(`UPDATE topics SET ${poolUpdates.join(', ')} WHERE id = ?`, poolValues)
    }

    // 11. 发送通知给话题创建者
    try {
      const [users] = await pool.query('SELECT name FROM users WHERE id = ?', [userId])
      const userName = users[0]?.name || '有用户'
      await pool.query(
        'INSERT INTO notifications (id, user_id, type, title, content, related_id) VALUES (?, ?, ?, ?, ?, ?)',
        [genId(), topic.created_by || topic.creator_id, 'promote', '新推广', `${userName} 推广了你的话题「${topic.title}」`, topicId]
      )
    } catch {}

    // 返回结果
    const [result] = await pool.query('SELECT * FROM topic_promotes WHERE id = ?', [promoteId])
    res.json(result[0])
  } catch (err) {
    console.error('接受推广失败:', err)
    res.status(500).json({ error: err.message || '接受推广失败' })
  }
})

// 更新推广记录（补填地址、更新状态等）
app.put('/api/topics/promotes/:id', authMiddleware, async (req, res) => {
  try {
    const fields = []
    const values = []
    const allowed = ['status', 'receiver_name', 'receiver_phone', 'receiver_address']
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = ?`)
        values.push(req.body[key])
      }
    }
    if (fields.length === 0) return res.status(400).json({ error: '没有要更新的字段' })
    values.push(req.params.id, req.userId)
    await pool.query(
      `UPDATE topic_promotes SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    )
    const [rows] = await pool.query('SELECT * FROM topic_promotes WHERE id = ?', [req.params.id])
    res.json(rows[0] || {})
  } catch (err) {
    res.status(500).json({ error: '更新推广记录失败' })
  }
})

// ============================================
// 优惠券 API
// ============================================

// 领取话题优惠券
app.post('/api/topics/:id/coupon', authMiddleware, async (req, res) => {
  try {
    const topicId = req.params.id
    const userId = req.userId

    // 获取话题
    const [topics] = await pool.query('SELECT * FROM topics WHERE id = ?', [topicId])
    if (topics.length === 0) return res.status(404).json({ error: '话题不存在' })
    const topic = topics[0]

    // 优惠券必须存在
    if (!topic.coupon_type && !topic.coupon_value) {
      return res.status(400).json({ error: '该话题没有优惠券奖励' })
    }

    // 检查数量
    const couponCount = topic.coupon_count || 0
    const claimed = topic.coupon_claimed || 0
    if (couponCount > 0 && claimed >= couponCount) {
      return res.status(400).json({ error: '优惠券已领完' })
    }

    // 检查是否已领过
    const [existing] = await pool.query(
      'SELECT id FROM user_coupons WHERE user_id = ? AND topic_id = ?',
      [userId, topicId]
    )
    if (existing.length > 0) return res.status(400).json({ error: '已经领取过该优惠券' })

    // 发放优惠券
    const id = genId()
    await pool.query(
      'INSERT INTO user_coupons (id, user_id, topic_id, coupon_type, coupon_value, status) VALUES (?, ?, ?, ?, ?, ?)',
      [id, userId, topicId, topic.coupon_type || '', topic.coupon_value || '', 'claimed']
    )

    // 更新领取计数
    await pool.query('UPDATE topics SET coupon_claimed = COALESCE(coupon_claimed, 0) + 1 WHERE id = ?', [topicId])

    // 通知
    try {
      await pool.query(
        'INSERT INTO notifications (id, user_id, type, title, content, related_id) VALUES (?, ?, ?, ?, ?, ?)',
        [genId(), userId, 'coupon', '优惠券到账', `你领取了「${topic.title}」的优惠券：${topic.coupon_value || topic.coupon_type}`, topicId]
      )
    } catch {}

    const [rows] = await pool.query('SELECT * FROM user_coupons WHERE id = ?', [id])
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message || '领取优惠券失败' })
  }
})

// 获取我的优惠券
app.get('/api/coupons/my', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT uc.*, t.title as topic_title, t.brand_name FROM user_coupons uc LEFT JOIN topics t ON uc.topic_id = t.id WHERE uc.user_id = ? ORDER BY uc.claimed_at DESC',
      [req.userId]
    )
    res.json(rows)
  } catch (err) {
    res.json([])
  }
})

// ============================================
// 投票创建 API
// ============================================

app.post('/api/votes', authMiddleware, async (req, res) => {
  try {
    const { title, description, options, vote_cost, vote_reward, end_date } = req.body
    if (!options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: '至少需要2个选项' })
    }

    const id = genId()
    await pool.query(
      'INSERT INTO votes (id, title, description, options, vote_cost, vote_reward, end_date, status, total_votes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)',
      [id, title, description || '', JSON.stringify(options), vote_cost || 0, vote_reward || 0, end_date || null, 'active', req.userId]
    )
    const [rows] = await pool.query('SELECT * FROM votes WHERE id = ?', [id])
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: '创建投票失败' })
  }
})

// ============================================
// 分享 API
// ============================================

app.post('/api/share', authMiddleware, async (req, res) => {
  try {
    const { type, id } = req.body
    if (!type || !id) return res.status(400).json({ error: '缺少参数' })

    if (type === 'topic') {
      // 分享话题 → 记录推广并给积分
      await autoExpireTopics()
      const [topics] = await pool.query('SELECT * FROM topics WHERE id = ?', [id])
      if (topics.length === 0) return res.status(404).json({ error: '话题不存在' })
      const topic = topics[0]

      if (topic.status !== 'active') return res.status(400).json({ error: '该话题已结束' })

      // 检查奖励池
      const reward = topic.promote_reward || 10
      if ((topic.reward_type === 'points' || topic.reward_type === 'both' || !topic.reward_type) && topic.reward_pool > 0 && reward > topic.reward_pool) {
        return res.status(400).json({ error: '奖励池积分不足' })
      }

      // 记录推广（允许同一个话题多次分享，每次分享都算一次推广）
      const promoteId = genId()
      await pool.query(
        'INSERT INTO topic_promotes (id, topic_id, user_id, status, points_earned) VALUES (?, ?, ?, ?, ?)',
        [promoteId, id, req.userId, 'shared', reward]
      )

      // 发积分
      try {
        await earnPoints(req.userId, reward, 'promote', `分享话题「${topic.title}」`)
      } catch (e) {
        if (!e.message?.includes('已达上限')) throw e
      }

      // 扣奖励池 + 更新计数
      const newCount = (topic.promote_count || 0) + 1
      const newPool = topic.reward_pool > 0 ? Math.max(0, topic.reward_pool - reward) : topic.reward_pool
      const targetMet = topic.promote_target > 0 && newCount >= topic.promote_target
      const poolEmpty = topic.reward_pool > 0 && newPool <= 0

      await pool.query(
        `UPDATE topics SET promote_count = ?, reward_pool = ?, participant_count = participant_count + 1${(targetMet || poolEmpty) ? ', status = ?' : ''} WHERE id = ?`,
        (targetMet || poolEmpty)
          ? [newCount, newPool, 'completed', id]
          : [newCount, newPool, id]
      )

      res.json({ success: true, type: 'topic', reward })

    } else if (type === 'content') {
      // 分享内容 → +1 推广量
      const [contents] = await pool.query('SELECT * FROM contents WHERE id = ?', [id])
      if (contents.length === 0) return res.status(404).json({ error: '内容不存在' })

      await pool.query('UPDATE contents SET promote_count = promote_count + 1, share_count = COALESCE(share_count, 0) + 1 WHERE id = ?', [id])

      // 分享给积分
      try {
        await earnPoints(req.userId, 5, 'promote', '分享内容获得积分')
      } catch {}

      res.json({ success: true, type: 'content', reward: 5 })

    } else {
      return res.status(400).json({ error: '不支持的类型，请使用 topic 或 content' })
    }
  } catch (err) {
    console.error('分享失败:', err)
    res.status(500).json({ error: err.message || '分享失败' })
  }
})

// ============================================
// 帮推历史 API
// ============================================

app.get('/api/promotes/history', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50
    const [rows] = await pool.query(
      'SELECT p.*, c.title as content_title FROM promotes p LEFT JOIN contents c ON p.content_id = c.id WHERE p.user_id = ? ORDER BY p.created_at DESC LIMIT ?',
      [req.userId, limit]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: '获取帮推历史失败' })
  }
})


// ============================================
// 推广者战绩 API
// ============================================

app.get('/api/promoter/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId
    
    // 话题推广统计
    const [tpStats] = await pool.query(
      'SELECT COUNT(*) as total_promotes, COALESCE(SUM(points_earned), 0) as total_earned FROM topic_promotes WHERE user_id = ?',
      [userId]
    )
    
    // 内容帮推统计
    const [pStats] = await pool.query(
      'SELECT COUNT(*) as total_promotes, COALESCE(SUM(earned_points), 0) as total_earned FROM promotes WHERE user_id = ?',
      [userId]
    )
    
    // 话题推广历史（含话题信息）
    const [topicHistory] = await pool.query(
      `SELECT tp.*, t.title as topic_title, t.brand_name, t.reward_type
       FROM topic_promotes tp
       LEFT JOIN topics t ON tp.topic_id = t.id
       WHERE tp.user_id = ?
       ORDER BY tp.created_at DESC LIMIT 50`,
      [userId]
    )
    
    // 内容帮推历史
    const [contentHistory] = await pool.query(
      `SELECT p.*, c.title as content_title, c.type as content_type
       FROM promotes p
       LEFT JOIN contents c ON p.content_id = c.id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC LIMIT 50`,
      [userId]
    )
    
    // 推广排名
    const [rank] = await pool.query(
      `SELECT COUNT(DISTINCT user_id) as rank FROM topic_promotes 
       GROUP BY user_id HAVING COUNT(*) > (
         SELECT COUNT(*) FROM topic_promotes WHERE user_id = ?
       )`,
      [userId, userId]
    )
    
    const totalPromotes = (tpStats[0].total_promotes || 0) + (pStats[0].total_promotes || 0)
    const totalEarned = (tpStats[0].total_earned || 0) + (pStats[0].total_earned || 0)
    
    res.json({
      topic_promotes: { total: tpStats[0].total_promotes || 0, earned: tpStats[0].total_earned || 0 },
      content_promotes: { total: pStats[0].total_promotes || 0, earned: pStats[0].total_earned || 0 },
      total_promotes: totalPromotes,
      total_earned: totalEarned,
      topic_history: topicHistory,
      content_history: contentHistory,
      rank: rank.length > 0 ? rank[0].rank + 1 : 1,
    })
  } catch (err) {
    res.status(500).json({ error: '获取战绩失败' })
  }
})

// ============================================
// 品牌中心 API
// ============================================

// 品牌方获取自己发布的话题列表（含推广统计）
app.get('/api/brand/topics', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId
    const [topics] = await pool.query(
      'SELECT * FROM topics WHERE created_by = ? OR creator_id = ? ORDER BY created_at DESC',
      [userId, userId]
    )
    
    // 为每个话题补充推广统计
    for (const topic of topics) {
      const [stats] = await pool.query(
        'SELECT COUNT(*) as total_promotes, COALESCE(SUM(points_earned), 0) as total_earned FROM topic_promotes WHERE topic_id = ?',
        [topic.id]
      )
      topic.promote_stats = stats[0]
    }
    
    res.json(topics)
  } catch (err) {
    res.status(500).json({ error: '获取品牌话题失败' })
  }
})

// 获取话题推广明细（含推广者信息）
app.get('/api/topics/:id/promotes/detail', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT tp.*, u.name as user_name, u.avatar as user_avatar, u.level as user_level
       FROM topic_promotes tp
       LEFT JOIN users u ON tp.user_id = u.id
       WHERE tp.topic_id = ?
       ORDER BY tp.created_at DESC`,
      [req.params.id]
    )
    res.json(rows)
  } catch (err) {
    res.json([])
  }
})

// 品牌列表（所有品牌方话题发布者）
app.get('/api/brands', async (req, res) => {
  try {
    const [brands] = await pool.query(
      `SELECT t.created_by as id, t.brand_name as name, t.brand_logo as logo, 
              t.brand_description as description,
              COUNT(*) as topic_count, 
              COALESCE(SUM(t.promote_count), 0) as total_promotes,
              COALESCE(SUM(t.participant_count), 0) as total_participants,
              MAX(t.created_at) as latest_activity
       FROM topics t
       WHERE t.creator_type = 'brand' AND t.brand_name IS NOT NULL AND t.brand_name != ''
       GROUP BY t.created_by, t.brand_name, t.brand_logo, t.brand_description
       ORDER BY topic_count DESC LIMIT 50`
    )
    res.json(brands)
  } catch (err) {
    res.json([])
  }
})

// ============================================
// 积分消费 API
// ============================================

// 内容曝光加速（50积分）
app.post('/api/contents/:id/boost', authMiddleware, async (req, res) => {
  try {
    const contentId = req.params.id
    const userId = req.userId
    
    // 检查归属
    const [contents] = await pool.query('SELECT * FROM contents WHERE id = ?', [contentId])
    if (contents.length === 0) return res.status(404).json({ error: '内容不存在' })
    
    // 检查是否已加速
    const content = contents[0]
    if (content.boost_until && new Date(content.boost_until) > new Date()) {
      return res.status(400).json({ error: '该内容仍在加速中' })
    }
    
    // 扣积分
    const COST = 50
    await spendPoints(userId, COST, 'boost', '曝光加速')
    
    // 标记加速
    const boostUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
    await pool.query(
      'UPDATE contents SET boost_until = ?, total_views = total_views + 200 WHERE id = ?',
      [boostUntil, contentId]
    )
    
    res.json({ success: true, boost_until: boostUntil, message: '曝光加速成功！24小时内优先展示' })
  } catch (err) {
    res.status(400).json({ error: err.message || '曝光加速失败' })
  }
})

// 内容/话题置顶（150积分）
app.post('/api/contents/:id/pin', authMiddleware, async (req, res) => {
  try {
    const contentId = req.params.id
    const userId = req.userId
    
    // 检查归属
    const [contents] = await pool.query('SELECT * FROM contents WHERE id = ?', [contentId])
    if (contents.length === 0) return res.status(404).json({ error: '内容不存在' })
    
    // 同时置顶数限制
    const [pinned] = await pool.query(
      "SELECT COUNT(*) as count FROM contents WHERE (pinned_by = ? OR created_by = ?) AND pinned_until > NOW()",
      [userId, userId]
    )
    if (pinned[0].count >= 3) return res.status(400).json({ error: '最多同时置顶3条内容' })
    
    // 检查是否已置顶
    const content = contents[0]
    if (content.pinned_until && new Date(content.pinned_until) > new Date()) {
      return res.status(400).json({ error: '该内容已置顶' })
    }
    
    // 扣积分
    const COST = 150
    await spendPoints(userId, COST, 'pin', '内容置顶')
    
    // 标记置顶
    const pinUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
    await pool.query(
      'UPDATE contents SET pinned_until = ?, pinned_by = ? WHERE id = ?',
      [pinUntil, userId, contentId]
    )
    
    res.json({ success: true, pin_until: pinUntil, message: '置顶成功！24小时内优先展示' })
  } catch (err) {
    res.status(400).json({ error: err.message || '置顶失败' })
  }
})

// ============================================
// 举报 API
// ============================================

app.post('/api/reports', authMiddleware, async (req, res) => {
  try {
    const { target_type, target_id, reason } = req.body
    if (!target_type || !target_id || !reason) {
      return res.status(400).json({ error: '请填写完整信息' })
    }
    
    // 检查是否重复举报
    const [existing] = await pool.query(
      'SELECT id FROM reports WHERE reporter_id = ? AND target_type = ? AND target_id = ? AND status = "pending"',
      [req.userId, target_type, target_id]
    )
    if (existing.length > 0) {
      return res.status(400).json({ error: '你已经举报过该内容了' })
    }
    
    await pool.query(
      'INSERT INTO reports (id, reporter_id, target_type, target_id, reason, status) VALUES (?, ?, ?, ?, ?, ?)',
      [genId(), req.userId, target_type, target_id, reason, 'pending']
    )
    
    res.json({ success: true, message: '举报已提交，我们会尽快处理' })
  } catch (err) {
    res.status(500).json({ error: '举报提交失败' })
  }
})

// ============================================
// 启动服务器

// =====================================================
// 每日挑战 + 排行榜 + PK对战
// =====================================================

// ====== 每日造梗挑战 ======

// ====== \u5185\u5bb9\u5b89\u5168\u8fc7\u6ee4 ======
const forbiddenPatterns = [
  /\u8d4c\u535a|\u535a\u5f69|\u8d4c\u573a|\u8d4c\u94b1|\u4e0b\u6ce8|\u5f69\u7968|\u516d\u5408\u5f69/i,
  /\u6bd2\u54c1|\u5438\u6bd2|\u5927\u9ebb|\u6d77\u6d1b\u56e0|\u51b0\u6bd2|k\u7c89|\u6447\u5934\u4e38|\u53ef\u5361\u56e0|\u7f42\u7c9f/i,
  /\u8272\u60c5|\u6210\u4eba|\u7ea6\u70ae|\u88f8\u804a|\u63f4\u4ea4|\u4e00\u591c\u60c5|\u5ad6|\u5a3c/i,
  /\u67aa\u652f|\u5f39\u836f|\u7ba1\u5236\u5200\u5177|\u70b8\u836f/i,
  /\u4f20\u9500|\u8bc8\u9a97|\u6d17\u94b1|\u975e\u6cd5\u96c6\u8d44/i,
  /\u90aa\u6559|\u6cd5\u8f6e/i,
  /\u4ee3\u5b55|\u5668\u5b98\u4e70\u5356/i,
  /\u4eba\u8089|\u5f00\u76d2|\u9690\u79c1\u6cc4\u9732/i,
  /\u81ea\u6740|\u81ea\u6b8b|\u5272\u8155/i,
  /\u66b4\u529b|\u6050\u6016|\u6781\u7aef/i,
]

function checkContent(text) {
  if (!text) return { safe: true }
  for (const p of forbiddenPatterns) {
    if (p.test(text)) {
      return { safe: false, reason: '\u5185\u5bb9\u5305\u542b\u8fdd\u89c4\u4fe1\u606f\uff0c\u8bf7\u4fee\u6539\u540e\u91cd\u65b0\u63d0\u4ea4' }
    }
  }
  return { safe: true }
}
app.get('/api/challenges/today', optionalAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    let [challenges] = await pool.query(
      'SELECT * FROM daily_challenges WHERE date = ? AND status = ?',
      [today, 'active']
    )
    if (challenges.length === 0) {
      const topics = [
        { title: '\u6700\u79bb\u8c31\u7684\u4e0a\u73ed\u7ecf\u5386', desc: '\u5206\u4eab\u4e00\u4e0b\u4f60\u7ecf\u5386\u8fc7\u7684\u79bb\u8c31\u804c\u573a\u6545\u4e8b', tag: '\u804c\u573a' },
        { title: '\u5f53\u4ee3\u5e74\u8f7b\u4eba\u7684\u7701\u94b1\u79d8\u7c4d', desc: '\u4f60\u7684\u72ec\u5bb6\u7701\u94b1\u7edd\u62db\u662f\u4ec0\u4e48', tag: '\u751f\u6d3b' },
        { title: '\u5982\u679cAI\u80fd\u5e2e\u4f60\u505a\u4e00\u4ef6\u4e8b', desc: '\u4f60\u6700\u60f3\u8ba9AI\u5e2e\u4f60\u89e3\u51b3\u4ec0\u4e48\u95ee\u9898', tag: 'AI' },
        { title: '\u7ed9\u5341\u5e74\u524d\u7684\u81ea\u5df1\u4e00\u53e5\u8bdd', desc: '\u5982\u679c\u80fd\u7a7f\u8d8a\u56de\u53bb\uff0c\u4f60\u4f1a\u8bf4\u4ec0\u4e48', tag: '\u6000\u65e7' },
        { title: '\u5b66\u4e00\u95e8\u65b0\u6280\u80fd\u7684\u641e\u7b11\u7ecf\u5386', desc: '\u5b66\u4e1c\u897f\u65f6\u95f9\u8fc7\u7684\u7b11\u8bdd', tag: '\u751f\u6d3b' },
        { title: '\u5370\u8c61\u6700\u6df1\u7684\u4e00\u672c\u4e66\u6216\u7535\u5f71', desc: '\u63a8\u8350\u4e00\u4e2a\u6539\u53d8\u4f60\u60f3\u6cd5\u7684\u597d\u4f5c\u54c1', tag: '\u6587\u5316' },
        { title: '\u4f60\u89c1\u8fc7\u6700\u725b\u7684\u624b\u5de5\u4f5c\u54c1', desc: '\u8eab\u8fb9\u4eba\u7684\u624b\u5de5\u7edd\u6d3b', tag: '\u521b\u610f' },
        { title: '\u6700\u8ba9\u4f60\u611f\u52a8\u7684\u964c\u751f\u4eba\u5e2e\u52a9', desc: '\u964c\u751f\u4eba\u7ed9\u8fc7\u4f60\u7684\u6e29\u6696\u65f6\u523b', tag: '\u6b63\u80fd\u91cf' },
      ]
      const pick = topics[Math.floor(Math.random() * topics.length)]
      const id = genId()
      await pool.query(
        'INSERT INTO daily_challenges (id, title, description, topic_tag, reward_points, date) VALUES (?, ?, ?, ?, 100, ?)',
        [id, pick.title, pick.desc, pick.tag, today]
      )
      challenges = [{ id, title: pick.title, description: pick.desc, topic_tag: pick.tag, reward_points: 100, entry_count: 0, winner_id: null }]
    }
    const ch = challenges[0]
    let myEntry = null
    if (req.userId) {
      const [entries] = await pool.query(
        'SELECT * FROM challenge_entries WHERE challenge_id = ? AND user_id = ?',
        [ch.id, req.userId]
      )
      if (entries.length > 0) myEntry = entries[0]
    }
    res.json({ ...ch, my_entry: myEntry })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/challenges/history', async (req, res) => {
  try {
    const [challenges] = await pool.query(
      'SELECT * FROM daily_challenges WHERE status = ? ORDER BY date DESC LIMIT 20',
      ['ended']
    )
    res.json(challenges)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/challenges/:id/enter', authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body
    if (!content) return res.status(400).json({ error: '\u5185\u5bb9\u4e0d\u80fd\u4e3a\u7a7a' })
    const safetyCheck = checkContent(content); if (!safetyCheck.safe) return res.status(400).json({ error: safetyCheck.reason })
    const [challenge] = await pool.query('SELECT * FROM daily_challenges WHERE id = ?', [req.params.id])
    if (challenge.length === 0) return res.status(404).json({ error: '挑战不存在' })
    if (challenge[0].status !== 'active') return res.status(400).json({ error: '挑战已结束' })
    const [existing] = await pool.query(
      'SELECT id FROM challenge_entries WHERE challenge_id = ? AND user_id = ?',
      [req.params.id, req.userId]
    )
    if (existing.length > 0) return res.status(400).json({ error: '你已经参与了' })
    const id = genId()
    await pool.query(
      'INSERT INTO challenge_entries (id, challenge_id, user_id, title, content) VALUES (?, ?, ?, ?, ?)',
      [id, req.params.id, req.userId, title || '无题', content]
    )
    await pool.query('UPDATE daily_challenges SET entry_count = entry_count + 1 WHERE id = ?', [req.params.id])
    await earnPoints(req.userId, 10, 'challenge_enter', '参与每日挑战 +10积分')
    res.json({ success: true, id, message: '参与成功！+10积分' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/challenges/:id/entries', optionalAuth, async (req, res) => {
  try {
    const [entries] = await pool.query(
      `SELECT ce.*, u.name, u.avatar as avatar_url
       FROM challenge_entries ce
       LEFT JOIN users u ON ce.user_id = u.id
       WHERE ce.challenge_id = ?
       ORDER BY ce.vote_count DESC`,
      [req.params.id]
    )
    let myVotes = {}
    if (req.userId) {
      const [votes] = await pool.query(
        'SELECT entry_id FROM challenge_votes WHERE challenge_id = ? AND voter_id = ?',
        [req.params.id, req.userId]
      )
      myVotes = Object.fromEntries(votes.map(v => [v.entry_id, true]))
    }
    res.json(entries.map(e => ({ ...e, i_voted: !!myVotes[e.id] })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/challenges/entries/:id/vote', authMiddleware, async (req, res) => {
  try {
    const entryId = req.params.id
    const [entry] = await pool.query(
      'SELECT ce.*, dc.status as challenge_status FROM challenge_entries ce JOIN daily_challenges dc ON ce.challenge_id = dc.id WHERE ce.id = ?',
      [entryId]
    )
    if (entry.length === 0) return res.status(404).json({ error: '作品不存在' })
    if (entry[0].challenge_status !== 'active') return res.status(400).json({ error: '挑战已结束' })
    if (entry[0].user_id === req.userId) return res.status(400).json({ error: '不能给自己投票' })
    const [existing] = await pool.query(
      'SELECT id FROM challenge_votes WHERE challenge_id = ? AND voter_id = ?',
      [entry[0].challenge_id, req.userId]
    )
    if (existing.length > 0) return res.status(400).json({ error: '已投过票了' })
    await pool.query(
      'INSERT INTO challenge_votes (challenge_id, entry_id, voter_id) VALUES (?, ?, ?)',
      [entry[0].challenge_id, entryId, req.userId]
    )
    await pool.query('UPDATE challenge_entries SET vote_count = vote_count + 1 WHERE id = ?', [entryId])
    await earnPoints(entry[0].user_id, 1, 'challenge_vote_received', '你的作品获得1票 +1积分')
    await earnPoints(req.userId, 2, 'challenge_vote', '为挑战投票 +2积分')
    res.json({ success: true, message: '投票成功！' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ====== 热门排行榜 ======

app.get('/api/leaderboard/hot', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const [memes] = await pool.query(
      `SELECT m.*, u.name, u.avatar as avatar_url, (COALESCE(m.like_count, 0) * 2 + COALESCE(m.comment_count, 0) * 3) as hot_score
       FROM memes m
       LEFT JOIN users u ON m.creator_id = u.id
       WHERE m.created_at >= ?
       ORDER BY hot_score DESC LIMIT 20`,
      [today + ' 00:00:00']
    )
    res.json(memes)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/leaderboard/promoters', async (req, res) => {
  try {
    const [promoters] = await pool.query(
      `SELECT u.id, u.name, u.avatar as avatar_url, COUNT(tp.id) as promote_count, SUM(tp.status = 'completed') as completed_count
       FROM topic_promotes tp
       JOIN users u ON tp.user_id = u.id
       GROUP BY tp.user_id
       ORDER BY promote_count DESC LIMIT 20`
    )
    res.json(promoters)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/leaderboard/points', async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, name, avatar_url, points, level FROM users ORDER BY points DESC LIMIT 20'
    )
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ====== PK对战 ======

app.get('/api/battles/today', optionalAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    let [battles] = await pool.query(
      'SELECT * FROM battles WHERE date = ? AND status = ?',
      [today, 'active']
    )
    if (battles.length === 0) {
      const topics = [
        { sideA: '\u65e9\u8d77', sideB: '\u71ac\u591c', desc: '\u54ea\u4e2a\u6548\u7387\u66f4\u9ad8' },
        { sideA: '\u732b', sideB: '\u72d7', desc: '\u8c01\u662f\u6700\u4f73\u5ba0\u7269' },
        { sideA: '\u7eb8\u8d28\u4e66', sideB: '\u7535\u5b50\u4e66', desc: '\u54ea\u79cd\u9605\u8bfb\u4f53\u9a8c\u66f4\u597d' },
        { sideA: '\u5976\u8336', sideB: '\u5496\u5561', desc: '\u8c01\u624d\u662f\u6253\u5de5\u4eba\u7684\u7eed\u547d\u6c34' },
        { sideA: 'iOS', sideB: '\u5b89\u5353', desc: '\u8c01\u66f4\u597d\u7528' },
        { sideA: '\u590f\u5929', sideB: '\u51ac\u5929', desc: '\u4f60\u66f4\u559c\u6b22\u54ea\u4e2a\u5b63\u8282' },
        { sideA: '\u5728\u5bb6\u505a\u996d', sideB: '\u51fa\u53bb\u5403', desc: '\u54ea\u4e2a\u66f4\u5e78\u798f' },
        { sideA: '\u72ec\u5904', sideB: '\u793e\u4ea4', desc: '\u54ea\u79cd\u65b9\u5f0f\u66f4\u5145\u7535' },
      ]
      const pick = topics[Math.floor(Math.random() * topics.length)]
      const id = genId()
      await pool.query(
        'INSERT INTO battles (id, title, description, side_a_title, side_b_title, date) VALUES (?, ?, ?, ?, ?, ?)',
        [id, pick.desc, pick.desc, pick.sideA, pick.sideB, today]
      )
      battles = [{ id, title: pick.desc, side_a_title: pick.sideA, side_b_title: pick.sideB, side_a_votes: 0, side_b_votes: 0 }]
    }
    const b = battles[0]
    let myVote = null
    if (req.userId) {
      const [votes] = await pool.query(
        'SELECT side FROM battle_votes WHERE battle_id = ? AND user_id = ?',
        [b.id, req.userId]
      )
      if (votes.length > 0) myVote = votes[0].side
    }
    res.json({ ...b, my_vote: myVote })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/battles/:id/vote', authMiddleware, async (req, res) => {
  try {
    const { side } = req.body
    if (!['a', 'b'].includes(side)) return res.status(400).json({ error: '只能选a或b' })
    const [battle] = await pool.query('SELECT * FROM battles WHERE id = ? AND status = ?', [req.params.id, 'active'])
    if (battle.length === 0) return res.status(404).json({ error: 'PK已结束或不存在' })
    const [existing] = await pool.query(
      'SELECT id FROM battle_votes WHERE battle_id = ? AND user_id = ?',
      [req.params.id, req.userId]
    )
    if (existing.length > 0) return res.status(400).json({ error: '你已经投过票了' })
    await pool.query(
      'INSERT INTO battle_votes (battle_id, user_id, side) VALUES (?, ?, ?)',
      [req.params.id, req.userId, side]
    )
    const column = side === 'a' ? 'side_a_votes' : 'side_b_votes'
    await pool.query(`UPDATE battles SET ${column} = ${column} + 1 WHERE id = ?`, [req.params.id])
    await earnPoints(req.userId, 3, 'battle_vote', '参与每日PK +3积分')
    res.json({ success: true, message: '投票成功！+3积分' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/battles/history', async (req, res) => {
  try {
    const [battles] = await pool.query(
      'SELECT * FROM battles WHERE status = ? ORDER BY date DESC LIMIT 10',
      ['ended']
    )
    res.json(battles)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ====== 盲盒系统 ======

app.get('/api/blind-box/items', async (req, res) => {
  try {
    const [items] = await pool.query(
      'SELECT id, name, type, rarity, value, title, description, icon, weight FROM blind_boxes WHERE is_active = 1 ORDER BY FIELD(rarity, "legendary","epic","rare","uncommon","common"), weight DESC'
    )
    res.json(items)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/blind-box/open', authMiddleware, async (req, res) => {
  try {
    const COST = 30
    const [user] = await pool.query('SELECT points FROM users WHERE id = ?', [req.userId])
    if (user.length === 0) return res.status(404).json({ error: '用户不存在' })
    if (user[0].points < COST) return res.status(400).json({ error: `积分不够！开盲盒要${COST}积分，你只有${user[0].points}积分` })

    const [items] = await pool.query('SELECT * FROM blind_boxes WHERE is_active = 1')
    if (items.length === 0) return res.status(400).json({ error: '暂时没有盲盒' })

    const totalWeight = items.reduce((s, i) => s + i.weight, 0)
    let r = Math.random() * totalWeight
    let picked = items[0]
    for (const item of items) { r -= item.weight; if (r <= 0) { picked = item; break } }

    await pool.query('UPDATE users SET points = points - ? WHERE id = ?', [COST, req.userId])
    await pool.query('INSERT INTO points_records (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)',
      [genId(), req.userId, 'blind_box_cost', -COST, '开盲盒消耗'])

    let result = { box: { id: picked.id, name: picked.name, type: picked.type, rarity: picked.rarity, icon: picked.icon, title: picked.title, description: picked.description }, points_earned: 0, effect: null, fragment: null, surprise: null }

    if (picked.type === 'points') {
      await earnPoints(req.userId, picked.value, 'blind_box', `盲盒开出${picked.value}积分`)
      result.points_earned = picked.value
    } else if (picked.type === 'effect') {
      let h = 24, et = 'color_nickname'
      if (picked.icon === '✨') { h = 48; et = 'glow_avatar' }
      else if (picked.icon === '🐟') { h = 168; et = 'fortune_badge' }
      const exp = new Date(Date.now() + h * 3600000)
      await pool.query('INSERT INTO user_effects (id, user_id, effect_type, effect_data, expires_at) VALUES (?, ?, ?, ?, ?)',
        [genId(), req.userId, et, JSON.stringify({ title: picked.title, icon: picked.icon }), exp])
      result.effect = { type: et, title: picked.title, expires_at: exp.toISOString() }
    } else if (picked.type === 'boost') {
      let et = picked.icon === '🚀' ? 'content_boost' : 'double_points'
      let h = picked.icon === '🚀' ? 24 : 1
      const exp = new Date(Date.now() + h * 3600000)
      await pool.query('INSERT INTO user_effects (id, user_id, effect_type, effect_data, expires_at) VALUES (?, ?, ?, ?, ?)',
        [genId(), req.userId, et, JSON.stringify({ title: picked.title, icon: picked.icon }), exp])
      result.effect = { type: et, title: picked.title, expires_at: exp.toISOString() }
    } else if (picked.type === 'fragment') {
      const ftMap = { '⭐': 'star', '🌙': 'moon', '☀️': 'sun', '💠': 'diamond' }
      const ft = ftMap[picked.icon] || 'star'
      await pool.query(`INSERT INTO user_fragments (id, user_id, fragment_type, quantity) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE quantity = quantity + 1`,
        [genId(), req.userId, ft])
      result.fragment = { type: ft, icon: picked.icon, title: picked.title }
    } else if (picked.type === 'surprise') {
      if (picked.icon === '🔄') {
        await pool.query('UPDATE users SET points = points + ? WHERE id = ?', [COST, req.userId])
        await pool.query('INSERT INTO points_records (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)',
          [genId(), req.userId, 'blind_box_refund', COST, '盲盒开出再来一次'])
      }
      result.surprise = { icon: picked.icon, title: picked.title, description: picked.description }
    }

    await pool.query('INSERT INTO blind_box_records (id, user_id, box_id, box_name, box_type, box_rarity, box_icon, box_title, points_earned) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [genId(), req.userId, picked.id, picked.name, picked.type, picked.rarity, picked.icon, picked.title, result.points_earned])

    const [up] = await pool.query('SELECT points FROM users WHERE id = ?', [req.userId])
    result.remaining_points = up[0].points
    res.json(result)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/blind-box/history', authMiddleware, async (req, res) => {
  try {
    const [records] = await pool.query('SELECT * FROM blind_box_records WHERE user_id = ? ORDER BY opened_at DESC LIMIT 50', [req.userId])
    res.json(records)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/blind-box/effects', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE user_effects SET is_active = 0 WHERE expires_at < NOW() AND is_active = 1')
    const [effects] = await pool.query('SELECT * FROM user_effects WHERE user_id = ? AND is_active = 1 ORDER BY expires_at DESC', [req.userId])
    res.json(effects)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/blind-box/fragments/combine', authMiddleware, async (req, res) => {
  try {
    const { fragment_type } = req.body
    if (!fragment_type) return res.status(400).json({ error: '? 哪个碎片' })
    const [frags] = await pool.query('SELECT * FROM user_fragments WHERE user_id = ? AND fragment_type = ?', [req.userId, fragment_type])
    if (frags.length === 0 || frags[0].quantity < 3) return res.status(400).json({ error: '碎片不够！要3个同样的才行' })
    await pool.query('UPDATE user_fragments SET quantity = quantity - 3 WHERE user_id = ? AND fragment_type = ?', [req.userId, fragment_type])
    const rewards = { star: { p: 150, m: '集齐星星碎片+150积分！' }, moon: { p: 300, m: '集齐月亮碎片+300积分！' }, sun: { p: 600, m: '集齐太阳碎片+600积分！🌟' }, diamond: { p: 1500, m: '集齐钻石碎片+1500积分！！！💎🎉' } }
    const rw = rewards[fragment_type] || { p: 100, m: '合成成功+100积分' }
    await earnPoints(req.userId, rw.p, 'fragment_combine', rw.m)
    res.json({ success: true, points: rw.p, message: rw.m })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/blind-box/fragments', authMiddleware, async (req, res) => {
  try {
    const [frags] = await pool.query('SELECT fragment_type, quantity FROM user_fragments WHERE user_id = ? AND quantity > 0', [req.userId])
    res.json(frags)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ============================================

testConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 巨浪 API 服务器运行在 http://localhost:${PORT}`)
  })
})
