const { createClient } = require('@supabase/supabase-js')

// ⚠️ 种子脚本用 service_role key，绕过 RLS
// 从 Supabase Dashboard → Settings → API 获取 service_role key
const SUPABASE_URL = 'https://clmeiafkywkyyizmojrc.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function seed() {
  console.log('🌱 Seeding...')

  // ===== 用户 =====
  const users = [
    { username: 'chenxiaoyu', name: '陈小雨', avatar: '🌊', bio: '独立开发者，做了3个小工具', tags: ['独立开发','效率工具'], points: 3200, level: 25, experience: 5000, follower_count: 890, following_count: 120, published_count: 12, total_likes: 45000 },
    { username: 'linmomo', name: '林默默', avatar: '🎧', bio: '音乐博主，专注独立音乐', tags: ['独立音乐','乐评'], points: 2100, level: 20, experience: 3000, follower_count: 670, following_count: 89, published_count: 8, total_likes: 28000 },
    { username: 'zhangdapeng', name: '张大鹏', avatar: '🎮', bio: '游戏主播，主攻恐怖游戏', tags: ['游戏','恐怖'], points: 1800, level: 18, experience: 2500, follower_count: 456, following_count: 78, published_count: 6, total_likes: 15000 },
    { username: 'wangshushu', name: '王书书', avatar: '📚', bio: '读书博主，一年读100本', tags: ['读书','书评'], points: 950, level: 12, experience: 800, follower_count: 321, following_count: 45, published_count: 5, total_likes: 8900 },
    { username: 'liumei', name: '刘美丽', avatar: '🌸', bio: '城中村美食探索者', tags: ['美食','城中村'], points: 1500, level: 16, experience: 1800, follower_count: 1200, following_count: 150, published_count: 15, total_likes: 56000 },
  ]

  const insertedUsers = []
  for (const u of users) {
    const { data, error } = await supabase.from('users').upsert(u, { onConflict: 'username' }).select().single()
    if (error) { console.log('❌ User:', u.username, error.message); continue }
    insertedUsers.push(data)
    console.log('✅ User:', data.name)
  }

  // ===== 话题 =====
  const now = Date.now()
  const topics = [
    { type: 'open-discussion', title: '独立开发者的出路在哪？', description: '做了好几个小工具，下载量都不到100。独立开发到底能不能养活自己？', creator_id: insertedUsers[0]?.id, creator_name: '陈小雨', creator_avatar: '🌊', creator_type: 'personal', reward_pool: 300, meme_count: 23, total_views: 89000, participant_count: 18, hot_score: 85, end_date: new Date(now + 10*86400000).toISOString() },
    { type: 'product-review', title: 'AirPods平替真的存在吗？', description: '试了5款百元蓝牙耳机，有一款真的让我退掉了AirPods', creator_id: insertedUsers[1]?.id, creator_name: '林默默', creator_avatar: '🎧', creator_type: 'personal', reward_pool: 200, meme_count: 15, total_views: 45000, participant_count: 12, hot_score: 72, end_date: new Date(now + 5*86400000).toISOString() },
    { type: 'challenge', title: '#晒出你的桌面', description: '拍下你现在的工作学习桌面，看看谁的最乱或最整洁', creator_id: insertedUsers[2]?.id, creator_name: '张大鹏', creator_avatar: '🎮', creator_type: 'personal', reward_pool: 150, meme_count: 31, total_views: 120000, participant_count: 28, hot_score: 90, end_date: new Date(now + 3*86400000).toISOString() },
  ]

  const insertedTopics = []
  for (const t of topics) {
    const { data, error } = await supabase.from('topics').upsert(t, { onConflict: 'title' }).select().single()
    if (error) { console.log('❌ Topic:', t.title, error.message); continue }
    insertedTopics.push(data)
    console.log('✅ Topic:', data.title)
  }

  // ===== 内容 =====
  const contents = [
    { type: 'skill', title: 'AI写作助手', description: '一键润色你的文章，支持中英文', cover_url: 'https://picsum.photos/seed/ai-write/400/300', tags: ['AI','写作','效率'], creator_id: insertedUsers[0]?.id, render_mode: 'installable', like_count: 3400, view_count: 28000, comment_count: 567, share_count: 1200, favorite_count: 890, promote_count: 450 },
    { type: 'game', title: '深夜医院', description: '恐怖探索游戏，你是值班护士，但医院里只有你一个人', cover_url: 'https://picsum.photos/seed/horror-game/400/300', tags: ['游戏','恐怖','独立游戏'], creator_id: insertedUsers[2]?.id, render_mode: 'embed', like_count: 5600, view_count: 45000, comment_count: 890, share_count: 2300, favorite_count: 1800, promote_count: 900 },
    { type: 'music', title: '凌晨三点的便利店', description: '独立音乐人新单曲，写给每个深夜还在加班的人', cover_url: 'https://picsum.photos/seed/indie-music/400/300', tags: ['音乐','独立音乐','治愈'], creator_id: insertedUsers[1]?.id, render_mode: 'player', like_count: 8900, view_count: 67000, comment_count: 1200, share_count: 3400, favorite_count: 4500, promote_count: 1200 },
    { type: 'product', title: '磁吸充电宝', description: '5000mAh，MagSafe兼容，出门再也不怕没电', cover_url: 'https://picsum.photos/seed/powerbank/400/300', tags: ['数码','充电宝','好物'], creator_id: insertedUsers[4]?.id, render_mode: 'card', like_count: 2100, view_count: 18000, comment_count: 340, share_count: 890, favorite_count: 670, promote_count: 2300 },
  ]

  const insertedContents = []
  for (const c of contents) {
    const { data, error } = await supabase.from('contents').upsert(c, { onConflict: 'title' }).select().single()
    if (error) { console.log('❌ Content:', c.title, error.message); continue }
    insertedContents.push(data)
    console.log('✅ Content:', data.title)
  }

  // ===== 梗 =====
  const memes = [
    { type: 'text', title: '独立开发第一天', content: '上线了，下载量：3（都是我自己下的）', hashtags: ['独立开发','真实'], topic_id: insertedTopics[0]?.id, creator_id: insertedUsers[0]?.id, creator_name: '陈小雨', creator_avatar: '🌊', view_count: 12000, like_count: 890, share_count: 230, hot_score: 78 },
    { type: 'text', title: '融资PPT vs 实际产品', content: 'PPT上写的是颠覆行业，实际上是个todo list', hashtags: ['独立开发','创业'], topic_id: insertedTopics[0]?.id, creator_id: insertedUsers[3]?.id, creator_name: '王书书', creator_avatar: '📚', view_count: 8000, like_count: 650, share_count: 180, hot_score: 72 },
    { type: 'text', title: 'AirPods退货实录', content: '买了AirPods Pro，降噪确实好。然后试了那款平替，退了AirPods。省下的钱吃了顿好的。', hashtags: ['蓝牙耳机','平替'], topic_id: insertedTopics[1]?.id, creator_id: insertedUsers[1]?.id, creator_name: '林默默', creator_avatar: '🎧', view_count: 15000, like_count: 1200, share_count: 450, hot_score: 82 },
    { type: 'image', title: '我的桌面长这样', content: '三台显示器，一堆手办，键盘比显示器贵', hashtags: ['桌面','晒桌面'], topic_id: insertedTopics[2]?.id, creator_id: insertedUsers[2]?.id, creator_name: '张大鹏', creator_avatar: '🎮', view_count: 25000, like_count: 2100, share_count: 680, hot_score: 88 },
  ]

  for (const m of memes) {
    const { data, error } = await supabase.from('memes').upsert(m, { onConflict: 'title' }).select().single()
    if (error) { console.log('❌ Meme:', m.title, error.message); continue }
    console.log('✅ Meme:', data.title)
  }

  // ===== 投票 =====
  if (insertedTopics[2]) {
    const votes = [
      {
        topic_id: insertedTopics[2].id,
        title: '你的桌面最值钱的东西是？',
        description: '晒桌面话题投票',
        options: JSON.stringify([
          { text: '显示器', emoji: '🖥️' },
          { text: '键盘', emoji: '⌨️' },
          { text: '椅子', emoji: '🪑' },
          { text: '手办/摆件', emoji: '🎮' },
        ]),
        vote_count: 128,
        status: 'active',
        end_date: new Date(now + 3*86400000).toISOString(),
      },
    ]
    for (const v of votes) {
      const { data, error } = await supabase.from('votes').upsert(v, { onConflict: 'title' }).select().single()
      if (error) { console.log('❌ Vote:', v.title, error.message); continue }
      console.log('✅ Vote:', data.title)
    }
  }

  // ===== 通知 =====
  if (insertedUsers[0]) {
    const notifs = [
      { user_id: insertedUsers[0].id, type: 'like', title: '你的梗被点赞了', content: '「独立开发第一天」获得 50 个新赞', is_read: false },
      { user_id: insertedUsers[0].id, type: 'comment', title: '新评论', content: '有人评论了你的梗：太真实了，我也是', is_read: false },
      { user_id: insertedUsers[0].id, type: 'achievement', title: '解锁新成就！', content: '恭喜！你解锁了「首次发布」成就', is_read: true },
    ]
    for (const n of notifs) {
      const { error } = await supabase.from('notifications').insert(n)
      if (error) console.log('❌ Notif:', error.message)
    }
    console.log('✅ Notifications: 3')
  }

  // ===== 帮推记录 =====
  if (insertedUsers[1] && insertedContents[0]) {
    const promotes = [
      { user_id: insertedUsers[1].id, content_id: insertedContents[0].id, points_earned: 20 },
      { user_id: insertedUsers[2].id, content_id: insertedContents[0].id, points_earned: 20 },
      { user_id: insertedUsers[3].id, content_id: insertedContents[1].id, points_earned: 20 },
    ]
    for (const p of promotes) {
      const { error } = await supabase.from('promotes').upsert(p, { onConflict: 'user_id,content_id' })
      if (error) console.log('❌ Promote:', error.message)
    }
    console.log('✅ Promotes: 3')
  }

  // ===== 成就 =====
  if (insertedUsers[0]) {
    const achievements = [
      { user_id: insertedUsers[0].id, achievement_id: 'first_publish', name: '初出茅庐', description: '首次发布内容', icon: '🚀', category: 'create', points_earned: 50 },
      { user_id: insertedUsers[0].id, achievement_id: 'first_promote', name: '热心肠', description: '首次帮推', icon: '🤝', category: 'promote', points_earned: 50 },
    ]
    for (const a of achievements) {
      const { error } = await supabase.from('user_achievements').upsert(a, { onConflict: 'user_id,achievement_id' })
      if (error) console.log('❌ Achievement:', error.message)
    }
    console.log('✅ Achievements: 2')
  }

  console.log('\n🎉 Done!')
}

seed()
