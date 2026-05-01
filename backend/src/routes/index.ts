import { Router } from 'express'

const router = Router()

// ===== 内容类型定义 =====
const CONTENT_TYPES = [
  { code: 'video', label: '视频', icon: '🎬', renderMode: 'player' },
  { code: 'shortvideo', label: '短视频', icon: '🎥', renderMode: 'player' },
  { code: 'image', label: '图片', icon: '📷', renderMode: 'card' },
  { code: 'game', label: '游戏', icon: '🎮', renderMode: 'embed' },
  { code: 'movie', label: '电影', icon: '🎬', renderMode: 'trailer' },
  { code: 'tvshow', label: '剧集', icon: '📺', renderMode: 'trailer' },
  { code: 'music', label: '音乐', icon: '🎵', renderMode: 'player' },
  { code: 'book', label: '书籍', icon: '📖', renderMode: 'reader' },
  { code: 'article', label: '文章', icon: '📄', renderMode: 'reader' },
  { code: 'product', label: '产品', icon: '📦', renderMode: 'card' },
  { code: 'software', label: '软件', icon: '💻', renderMode: 'embed' },
  { code: 'skill', label: 'Skill', icon: '🧠', renderMode: 'installable' },
  { code: 'live', label: '直播', icon: '📡', renderMode: 'player' },
  { code: 'person', label: '人物', icon: '👤', renderMode: 'card' },
  { code: 'content', label: '动态', icon: '📝', renderMode: 'card' },
]

// ===== 认证相关 =====

router.post('/auth/register', (req, res) => {
  const { username, password, name } = req.body
  // TODO: 实际注册逻辑
  res.json({
    success: true,
    message: '注册成功',
    data: {
      id: `user_${Date.now()}`,
      username,
      name: name || username,
      avatar: '👤',
      token: `token_${Date.now()}`,
    }
  })
})

router.post('/auth/login', (req, res) => {
  const { username, password } = req.body
  // TODO: 实际登录逻辑
  res.json({
    success: true,
    message: '登录成功',
    data: {
      id: 'user_1',
      username,
      name: '测试用户',
      avatar: '🎨',
      token: `token_${Date.now()}`,
    }
  })
})

// ===== 用户相关 =====

router.get('/user/profile', (req, res) => {
  res.json({
    id: 'user_1',
    name: '测试用户',
    username: 'testuser',
    avatar: '🎨',
    bio: '创意达人',
    tags: ['创意达人', '配音爱好者'],
    points: 1250,
    level: 13,
    followers: 234,
    following: 56,
    stats: {
      published: 42,
      likes: 1580,
      promotes: 320,
    }
  })
})

router.get('/user/profile/:id', (req, res) => {
  res.json({
    id: req.params.id,
    name: '用户' + req.params.id,
    username: 'user_' + req.params.id,
    avatar: '👤',
    bio: '这个人很懒，什么都没写',
    tags: [],
    points: 100,
    level: 1,
    followers: 10,
    following: 5,
  })
})

// ===== 内容类型 =====

router.get('/content-types', (req, res) => {
  res.json({
    success: true,
    data: CONTENT_TYPES,
  })
})

// ===== 内容 Feed =====

router.get('/feed', (req, res) => {
  const { type, cursor, limit = 20 } = req.query
  // TODO: 实际 Feed 逻辑
  res.json({
    success: true,
    data: {
      items: [],
      nextCursor: null,
      hasMore: false,
    }
  })
})

router.get('/feed/trending', (req, res) => {
  res.json({ success: true, data: { items: [], nextCursor: null } })
})

router.get('/feed/fresh', (req, res) => {
  res.json({ success: true, data: { items: [], nextCursor: null } })
})

router.get('/feed/following', (req, res) => {
  res.json({ success: true, data: { items: [], nextCursor: null } })
})

// ===== 内容 CRUD =====

router.post('/contents', (req, res) => {
  const { type, title, description, tags, render, interaction } = req.body
  // TODO: 实际创建逻辑
  res.json({
    success: true,
    message: '发布成功',
    data: {
      id: `content_${Date.now()}`,
      type,
      title,
      description,
      tags,
      render,
      interaction,
      createdAt: new Date().toISOString(),
    },
    points: 10,
  })
})

router.get('/contents/:id', (req, res) => {
  // TODO: 实际获取逻辑
  res.json({
    success: true,
    data: {
      id: req.params.id,
      type: 'content',
      title: '示例内容',
      description: '示例描述',
      tags: ['示例'],
      creator: { id: 'user_1', name: '测试用户', avatar: '🎨', level: 3, followerCount: 200 },
      render: { mode: 'card' },
      interaction: { playable: false, trialable: false, installable: false, watchable: false, purchasable: false },
      stats: { views: 100, likes: 10, promotes: 5, shares: 3, comments: 2, favorites: 8, completions: 50 },
      rarity: 'common',
      createdAt: Date.now(),
    }
  })
})

router.put('/contents/:id', (req, res) => {
  // TODO: 实际更新逻辑
  res.json({ success: true, message: '更新成功' })
})

router.delete('/contents/:id', (req, res) => {
  // TODO: 实际删除逻辑
  res.json({ success: true, message: '删除成功' })
})

// ===== 内容交互 =====

router.post('/contents/:id/like', (req, res) => {
  res.json({ success: true, message: '点赞成功', points: 5 })
})

router.post('/contents/:id/promote', (req, res) => {
  res.json({ success: true, message: '帮推成功', points: 20 })
})

router.post('/contents/:id/share', (req, res) => {
  res.json({ success: true, message: '分享成功', points: 20 })
})

router.post('/contents/:id/comment', (req, res) => {
  res.json({ success: true, message: '评论成功', points: 5 })
})

router.post('/contents/:id/favorite', (req, res) => {
  res.json({ success: true, message: '收藏成功', points: 2 })
})

router.post('/contents/:id/view', (req, res) => {
  res.json({ success: true })
})

router.post('/contents/:id/complete', (req, res) => {
  res.json({ success: true, message: '完成记录', points: 10 })
})

// ===== 类型特有交互 =====

router.post('/contents/:id/install', (req, res) => {
  res.json({ success: true, message: '安装成功', points: 30 })
})

router.post('/contents/:id/trial', (req, res) => {
  res.json({ success: true, message: '试用开始', points: 10 })
})

router.post('/contents/:id/purchase', (req, res) => {
  res.json({ success: true, message: '购买成功', points: 50 })
})

router.post('/contents/:id/play', (req, res) => {
  res.json({ success: true, message: '游玩开始', points: 5 })
})

router.post('/contents/:id/watch', (req, res) => {
  res.json({ success: true, message: '观看开始', points: 5 })
})

// ===== 积分相关 =====

router.get('/points', (req, res) => {
  res.json({ success: true, data: { points: 1250, level: 13 } })
})

router.get('/points/history', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: '1', type: 'earn', amount: 10, reason: '发布内容', createdAt: '2026-04-29 22:00:00' },
      { id: '2', type: 'earn', amount: 50, reason: '参与任务', createdAt: '2026-04-29 21:00:00' },
      { id: '3', type: 'earn', amount: 5, reason: '点赞内容', createdAt: '2026-04-29 20:00:00' },
      { id: '4', type: 'earn', amount: 30, reason: '安装 Skill', createdAt: '2026-04-29 19:00:00' },
    ]
  })
})

// ===== 任务相关 =====

router.get('/tasks', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        title: '夏日穿搭挑战',
        description: '分享你的夏日穿搭',
        creatorName: '时尚品牌',
        reward: '500分',
        participants: 234,
        deadline: '2026-05-10',
        category: 'content',
      },
    ]
  })
})

router.post('/tasks', (req, res) => {
  res.json({ success: true, message: '任务发布成功' })
})

router.post('/tasks/:id/participate', (req, res) => {
  res.json({ success: true, message: '参与成功', points: 50 })
})

// ===== 文件上传 =====

router.post('/upload', (req, res) => {
  // TODO: 实际文件上传逻辑
  res.json({
    success: true,
    data: {
      url: `https://example.com/uploads/${Date.now()}`,
      filename: 'uploaded_file',
      size: 0,
    }
  })
})

export default router
