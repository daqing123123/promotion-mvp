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
    const email = `${username}@julang.app`
    const avatar = '👤'
    const initialPoints = referrerId ? 150 : 100

    await pool.query(
      'INSERT INTO users (id, username, name, avatar, email, password_hash, points, level, experience) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)',
      [id, username, name || username, avatar, email, passwordHash, initialPoints]
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
    const { topic_id, user_id } = req.query
    const limit = parseInt(req.query.limit) || 20
    const offset = parseInt(req.query.offset) || 0

    let sql = 'SELECT * FROM memes WHERE status = ?'
    const params = ['published']

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
      // 取消
      await pool.query('DELETE FROM interactions WHERE id = ?', [existing[0].id])
      await pool.query(`UPDATE ${table} SET ${countField} = GREATEST(0, ${countField} - 1) WHERE id = ?`, [target_id])
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
    } catch (e: any) {
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
// 启动服务器
// ============================================

testConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 巨浪 API 服务器运行在 http://localhost:${PORT}`)
  })
})
