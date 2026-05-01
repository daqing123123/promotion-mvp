# 巨浪 - 全品类内容平台架构设计

> 设计时间：2026-05-01
> 状态：架构设计阶段

---

## 一、核心理念

**万物皆可发布，万物皆可刷到。**

用户不需要切换 App，不需要主动搜索 —— 刷就完了。
下一个可能是视频、游戏、电影、软件、产品……你永远不知道会遇到什么。

---

## 二、内容类型体系

### 已有类型（9 种）

| 类型 | 代码 | 图标 | 当前状态 |
|------|------|------|---------|
| 电影 | movie | 🎬 | 有 mock |
| 电视剧 | tvshow | 📺 | 有 mock |
| 书籍 | book | 📖 | 有 mock |
| 游戏 | game | 🎮 | 有 mock |
| 音乐 | music | 🎵 | 有 mock |
| 演唱会 | concert | 🎤 | 有 mock |
| 产品 | product | 📦 | 有 mock |
| 人物 | person | 👤 | 有 mock |
| 内容 | content | 📝 | 有 mock |

### 新增类型（5 种）

| 类型 | 代码 | 图标 | 交互方式 |
|------|------|------|---------|
| 软件 | software | 💻 | 可试用（iframe） |
| AI Skill | skill | 🧠 | 可安装 |
| 直播 | live | 📡 | 实时流 |
| 文章 | article | 📄 | 长文阅读 |
| 短视频 | shortvideo | 🎥 | 自动播放 |

---

## 三、统一内容协议

### 3.1 内容数据结构

```typescript
interface Content {
  // === 基础信息 ===
  id: string
  type: ContentType  // 'video' | 'image' | 'game' | 'movie' | 'tvshow' | 'product' | 'software' | 'skill' | 'article' | 'live' | 'music' | 'book' | 'person' | 'content'
  title: string
  description: string
  tags: string[]
  cover: string  // 封面图 URL
  
  // === 创作者 ===
  creator: {
    id: string
    name: string
    avatar: string
    level: number
    followerCount: number
  }
  
  // === 渲染配置 ===
  render: RenderConfig
  
  // === 交互配置 ===
  interaction: InteractionConfig
  
  // === 数据统计 ===
  stats: ContentStats
  
  // === 推广相关 ===
  promoTopic?: PromoTopic
  
  // === 稀有度（盲盒系统） ===
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  isBlindBox?: boolean
  
  // === 时间 ===
  createdAt: number
  updatedAt: number
}

// ===== 渲染配置 =====
interface RenderConfig {
  // 渲染模式
  mode: 'card'        // 普通卡片（图片、产品、人物）
       | 'player'     // 播放器（视频、音乐、直播）
       | 'reader'     // 阅读器（文章、书籍）
       | 'embed'      // 嵌入（游戏、软件试用）
       | 'trailer'    // 预告片 + 详情（电影、电视剧、演唱会）
       | 'installable' // 可安装（skill、插件）
  
  // 主内容源
  src?: string        // 视频/音频/iframe URL
  
  // 预告片（电影、电视剧用）
  trailer?: {
    src: string       // 预告片视频 URL
    duration: number  // 预告片时长（秒）
  }
  
  // 详情页配置
  detail?: {
    screenshots: string[]     // 截图列表
    features: string[]        // 功能/特色列表
    requirements?: string[]   // 系统要求（软件用）
    price?: number            // 价格
    platform?: string[]       // 支持平台
    version?: string          // 版本号（软件/skill）
    installUrl?: string       // 安装链接
    demoUrl?: string          // 试用链接
    purchaseUrl?: string      // 购买链接
    watchUrl?: string         // 观看链接（电影/剧集）
    trailerUrl?: string       // 预告片
  }
  
  // 内容比例
  aspect?: '9:16' | '16:9' | '1:1' | '4:3'
  
  // 自动播放
  autoplay?: boolean
}

// ===== 交互配置 =====
interface InteractionConfig {
  // 是否可交互
  playable: boolean     // 游戏、互动内容
  trialable: boolean    // 软件可试用
  installable: boolean  // skill 可安装
  watchable: boolean    // 电影/剧集可观看
  purchasable: boolean  // 产品可购买
  
  // 预计时长
  duration?: number     // 秒（视频、游戏、阅读）
  
  // 行动按钮
  cta?: {
    label: string       // "开始游戏" | "试用" | "安装" | "观看" | "购买"
    url?: string
    action?: string     // 预定义动作
  }
  
  // 试用限制
  trialLimit?: {
    duration?: number   // 试用时长限制（秒）
    features?: string[] // 可用功能列表
  }
}

// ===== 内容统计 =====
interface ContentStats {
  views: number
  likes: number
  promotes: number    // 帮推数
  shares: number
  comments: number
  favorites: number
  completions: number // 完播/完读/通关次数
  
  // 类型特有统计
  installs?: number   // 安装数（skill/软件）
  trials?: number     // 试用数（软件）
  purchases?: number  // 购买数（产品）
  plays?: number      // 游玩次数（游戏）
  watchTime?: number  // 观看时长（电影/视频）
}

// ===== 推广话题 =====
interface PromoTopic {
  category: ContentType
  targetName: string
  targetDesc: string
  rewardPool: number
  promoterCount: number
  totalExposure: number
  waveLevel: number
  daysLeft: number
  createdBy: string
}
```

### 3.2 内容类型与渲染模式映射

```typescript
const TYPE_RENDER_MAP: Record<ContentType, RenderConfig['mode']> = {
  video:     'player',
  shortvideo:'player',
  image:     'card',
  game:      'embed',
  movie:     'trailer',
  tvshow:    'trailer',
  music:     'player',
  book:      'reader',
  article:   'reader',
  product:   'card',
  software:  'embed',
  skill:     'installable',
  live:      'player',
  person:    'card',
  content:   'card',
}
```

---

## 四、Feed 流体验设计

### 4.1 全屏卡片流

```
┌────────────────────────────────┐
│                                │
│    [根据 render.mode 渲染]     │
│                                │
│    视频 → 自动播放              │
│    游戏 → 封面 + "开始游戏"     │
│    软件 → 截图 + "试用"         │
│    产品 → 图片 + "了解更多"     │
│    电影 → 预告片 + "观看"       │
│    文章 → 标题摘要 + "阅读全文" │
│    skill → 演示 + "安装"        │
│                                │
├────────────────────────────────┤
│  标题                          │
│  创作者 · 类型标签              │
│  ❤️ 1.2k  🔄 234  💬 89        │
│                                │
│  [CTA 按钮: 根据类型变化]       │
└────────────────────────────────┘
```

### 4.2 交互方式

- **上滑**：下一个内容
- **下滑**：上一个内容
- **点击内容**：进入交互模式（播放/游戏/试用）
- **双击**：点赞
- **长按**：更多选项（帮推、收藏、分享、举报）
- **右侧按钮**：点赞、帮推、评论、分享

### 4.3 CTA 按钮文案映射

```typescript
const CTA_LABELS: Record<ContentType, string> = {
  video:     '观看',
  shortvideo:'观看',
  image:     '查看',
  game:      '🎮 开始游戏',
  movie:     '🎬 观看电影',
  tvshow:    '📺 观看剧集',
  music:     '🎵 播放',
  book:      '📖 开始阅读',
  article:   '📄 阅读全文',
  product:   '🛒 了解更多',
  software:  '💻 立即试用',
  skill:     '🧠 一键安装',
  live:      '📡 进入直播',
  person:    '👤 关注',
  content:   '查看',
}
```

---

## 五、数据库设计

### 5.1 内容表 (contents)

```sql
CREATE TABLE contents (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  type            VARCHAR(20) NOT NULL,          -- 内容类型
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  cover_url       VARCHAR(500),
  tags            JSON,                           -- ["tag1", "tag2"]
  
  -- 创作者
  creator_id      BIGINT NOT NULL,
  
  -- 渲染配置
  render_mode     VARCHAR(20) NOT NULL,           -- card|player|reader|embed|trailer|installable
  render_src      VARCHAR(500),                   -- 主内容源 URL
  render_config   JSON,                           -- 完整渲染配置
  
  -- 交互配置
  interaction     JSON,                           -- 交互配置
  
  -- 统计
  view_count      INT DEFAULT 0,
  like_count      INT DEFAULT 0,
  promote_count   INT DEFAULT 0,
  share_count     INT DEFAULT 0,
  comment_count   INT DEFAULT 0,
  favorite_count  INT DEFAULT 0,
  completion_count INT DEFAULT 0,
  
  -- 类型特有统计
  install_count   INT DEFAULT 0,                  -- skill/软件
  trial_count     INT DEFAULT 0,                  -- 软件试用
  purchase_count  INT DEFAULT 0,                  -- 产品购买
  play_count      INT DEFAULT 0,                  -- 游戏游玩
  watch_time      BIGINT DEFAULT 0,               -- 观看时长（秒）
  
  -- 推广
  is_promoted     BOOLEAN DEFAULT FALSE,
  promo_config    JSON,                           -- 推广配置
  
  -- 盲盒
  is_blind_box    BOOLEAN DEFAULT FALSE,
  rarity          VARCHAR(20) DEFAULT 'common',
  
  -- 状态
  status          VARCHAR(20) DEFAULT 'published', -- draft|reviewing|published|rejected|deleted
  visibility      VARCHAR(20) DEFAULT 'public',    -- public|private|unlisted
  
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_type (type),
  INDEX idx_creator (creator_id),
  INDEX idx_status_created (status, created_at DESC),
  INDEX idx_type_status (type, status)
);
```

### 5.2 游戏内容表 (content_games)

```sql
CREATE TABLE content_games (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  content_id      BIGINT NOT NULL UNIQUE,
  
  -- 游戏特有
  game_url        VARCHAR(500) NOT NULL,          -- 游戏 HTML URL
  game_type       VARCHAR(50),                    -- puzzle|action|strategy|casual|...
  control_type    VARCHAR(50),                    -- touch|keyboard|mouse|tilt
  difficulty      VARCHAR(20),                    -- easy|medium|hard
  avg_play_time   INT,                            -- 平均游玩时长（秒）
  max_score       INT,                            -- 最高分
  
  FOREIGN KEY (content_id) REFERENCES contents(id)
);
```

### 5.3 软件内容表 (content_software)

```sql
CREATE TABLE content_software (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  content_id      BIGINT NOT NULL UNIQUE,
  
  -- 软件特有
  demo_url        VARCHAR(500),                   -- 试用 URL
  install_url     VARCHAR(500),                   -- 安装/下载 URL
  website_url     VARCHAR(500),                   -- 官网
  platforms       JSON,                           -- ["web","ios","android","windows","mac"]
  version         VARCHAR(50),
  price           DECIMAL(10,2),
  trial_duration  INT,                            -- 试用时长限制（秒）
  trial_features  JSON,                           -- 试用可用功能
  category        VARCHAR(50),                    -- productivity|design|dev|ai|...
  
  FOREIGN KEY (content_id) REFERENCES contents(id)
);
```

### 5.4 Skill 内容表 (content_skills)

```sql
CREATE TABLE content_skills (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  content_id      BIGINT NOT NULL UNIQUE,
  
  -- Skill 特有
  skill_id        VARCHAR(100) NOT NULL,          -- skill 标识符
  skill_version   VARCHAR(20),
  install_url     VARCHAR(500),
  registry        VARCHAR(100),                   -- 来源（clawhub|npm|custom）
  capabilities    JSON,                           -- 能力列表
  permissions     JSON,                           -- 所需权限
  demo_config     JSON,                           -- 演示配置
  
  FOREIGN KEY (content_id) REFERENCES contents(id)
);
```

### 5.5 电影/剧集内容表 (content_media)

```sql
CREATE TABLE content_media (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  content_id      BIGINT NOT NULL UNIQUE,
  
  -- 媒体特有
  media_type      VARCHAR(20) NOT NULL,           -- movie|tvshow|documentary|anime
  trailer_url     VARCHAR(500),                   -- 预告片
  watch_url       VARCHAR(500),                   -- 观看链接
  duration        INT,                            -- 时长（分钟）
  episodes        INT,                            -- 集数（剧集用）
  year            INT,                            -- 年份
  genre           JSON,                           -- 类型标签
  cast            JSON,                           -- 演员
  rating          DECIMAL(3,1),                   -- 评分
  platform        VARCHAR(100),                   -- 播放平台
  
  FOREIGN KEY (content_id) REFERENCES contents(id)
);
```

### 5.6 产品内容表 (content_products)

```sql
CREATE TABLE content_products (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  content_id      BIGINT NOT NULL UNIQUE,
  
  -- 产品特有
  price           DECIMAL(10,2),
  currency        VARCHAR(10) DEFAULT 'CNY',
  purchase_url    VARCHAR(500),                   -- 购买链接
  brand           VARCHAR(100),
  category        VARCHAR(50),
  specs           JSON,                           -- 规格参数
  images          JSON,                           -- 商品图片列表
  
  FOREIGN KEY (content_id) REFERENCES contents(id)
);
```

### 5.7 文章内容表 (content_articles)

```sql
CREATE TABLE content_articles (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  content_id      BIGINT NOT NULL UNIQUE,
  
  -- 文章特有
  body            LONGTEXT NOT NULL,              -- 文章正文（Markdown/HTML）
  word_count      INT,
  read_time       INT,                            -- 预计阅读时长（秒）
  format          VARCHAR(20) DEFAULT 'markdown', -- markdown|html|richtext
  
  FOREIGN KEY (content_id) REFERENCES contents(id)
);
```

---

## 六、API 设计

### 6.1 内容 Feed

```
GET  /api/feed                    # 获取推荐 Feed
     ?type=game                  # 按类型筛选（可选）
     &cursor=xxx                 # 翻页游标
     &limit=20                   # 每页数量

GET  /api/feed/trending           # 热门内容
GET  /api/feed/fresh              # 最新内容
GET  /api/feed/following          # 关注的人的内容
```

### 6.2 内容 CRUD

```
POST   /api/contents              # 发布内容
GET    /api/contents/:id          # 获取内容详情
PUT    /api/contents/:id          # 更新内容
DELETE /api/contents/:id          # 删除内容
```

### 6.3 内容交互

```
POST  /api/contents/:id/like      # 点赞
POST  /api/contents/:id/promote   # 帮推
POST  /api/contents/:id/share     # 分享
POST  /api/contents/:id/comment   # 评论
POST  /api/contents/:id/favorite  # 收藏
POST  /api/contents/:id/view      # 记录浏览
POST  /api/contents/:id/complete  # 记录完成（完播/通关/读完）
```

### 6.4 类型特有交互

```
POST  /api/contents/:id/install   # 安装（skill）
POST  /api/contents/:id/trial     # 试用（软件）
POST  /api/contents/:id/purchase  # 购买（产品）
POST  /api/contents/:id/play      # 游玩（游戏）
POST  /api/contents/:id/watch     # 观看（电影/视频）
```

### 6.5 发布流程

```
GET    /api/publish/types          # 获取可用内容类型及配置
POST   /api/publish/draft          # 创建草稿
PUT    /api/publish/draft/:id      # 更新草稿
POST   /api/publish/draft/:id/submit  # 提交审核
POST   /api/upload                 # 上传文件（图片、视频、游戏包等）
```

---

## 七、发布流程设计

### 7.1 统一发布入口

```
用户点击「+」发布
    ↓
选择内容类型（9 种图标）
    ↓
根据类型显示不同的表单
    ↓
填写信息 + 上传内容
    ↓
预览
    ↓
发布（进入审核或直接上线）
```

### 7.2 各类型发布表单

#### 视频/短视频
- 视频文件上传 或 视频 URL
- 封面图（自动截取或手动上传）
- 标题、描述、标签
- 时长（自动检测）

#### 图片
- 图片上传（支持多张）
- 标题、描述、标签
- 图片排序

#### 游戏
- 游戏文件上传（HTML5 zip 包）或 游戏 URL
- 封面图 / 截图（多张）
- 标题、描述、标签
- 游戏类型（puzzle/action/strategy/casual）
- 操作方式（touch/keyboard/mouse）
- 预计游玩时长

#### 电影/剧集
- 预告片视频
- 海报/封面
- 标题、描述、标签
- 类型、年份、演员
- 播放平台链接
- 评分

#### 软件
- 截图（多张）/ 演示视频
- Logo
- 标题、描述、标签
- 支持平台（web/ios/android/windows/mac/linux）
- 版本号
- 价格
- 试用链接 / 下载链接
- 官网链接

#### Skill
- 演示截图 / 视频
- 标题、描述、标签
- Skill ID 和版本
- 来源（ClawHub/npm/自定义）
- 能力列表
- 所需权限
- 安装链接

#### 产品
- 商品图片（多张）
- 标题、描述、标签
- 价格
- 品牌
- 购买链接
- 规格参数

#### 文章
- 富文本编辑器
- 封面图
- 标题、摘要、标签
- 正文（Markdown/富文本）

#### 音乐
- 音频文件上传 或 音乐 URL
- 封面图
- 标题、描述、标签
- 歌手/乐队
- 专辑

---

## 八、前端组件架构

```
src/
├── components/
│   ├── Feed/
│   │   ├── FeedContainer.tsx      # Feed 容器（滑动手势）
│   │   ├── FeedCard.tsx           # 通用卡片容器
│   │   └── FeedControls.tsx       # 右侧互动按钮
│   │
│   ├── ContentRenderers/          # 各类型渲染器
│   │   ├── VideoPlayer.tsx        # 视频播放器
│   │   ├── ImageCard.tsx          # 图片卡片
│   │   ├── GameEmbed.tsx          # 游戏嵌入（iframe）
│   │   ├── MovieTrailer.tsx       # 电影预告片 + 详情
│   │   ├── MusicPlayer.tsx        # 音乐播放器
│   │   ├── ArticleReader.tsx      # 文章阅读器
│   │   ├── ProductCard.tsx        # 产品卡片
│   │   ├── SoftwareDemo.tsx       # 软件试用
│   │   ├── SkillInstaller.tsx     # Skill 安装
│   │   ├── LivePlayer.tsx         # 直播播放器
│   │   └── PersonCard.tsx         # 人物卡片
│   │
│   ├── Publish/                   # 发布流程
│   │   ├── PublishRouter.tsx      # 发布路由（选择类型后跳转）
│   │   ├── TypeSelector.tsx       # 类型选择器
│   │   ├── forms/
│   │   │   ├── VideoForm.tsx
│   │   │   ├── GameForm.tsx
│   │   │   ├── SoftwareForm.tsx
│   │   │   ├── SkillForm.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   ├── ArticleForm.tsx
│   │   │   ├── MovieForm.tsx
│   │   │   ├── MusicForm.tsx
│   │   │   └── ImageForm.tsx
│   │   └── Preview.tsx            # 发布预览
│   │
│   └── shared/                    # 通用组件
│       ├── MediaUploader.tsx
│       ├── TagInput.tsx
│       ├── StatsBar.tsx
│       └── CTAButton.tsx
│
├── lib/
│   ├── contentTypes.ts            # 内容类型定义
│   ├── renderConfig.ts            # 渲染配置
│   ├── recommendation.ts          # 推荐算法（已有，需扩展）
│   ├── mockData.ts                # Mock 数据（需扩展）
│   └── api.ts                     # API 客户端
│
└── pages/
    ├── Home.tsx                   # Feed 首页（已有，需改造）
    ├── Publish.tsx                # 发布页（已有，需改造）
    ├── ContentDetail.tsx          # 内容详情页
    └── Profile.tsx                # 个人主页（已有）
```

---

## 九、实施计划

### Phase 1：协议层（1-2 天）
- [ ] 定义内容类型枚举和配置
- [ ] 设计统一内容协议
- [ ] 扩展数据库 schema
- [ ] 扩展 API 路由

### Phase 2：Feed 改造（2-3 天）
- [ ] 重构 FeedContainer 支持全屏滑动
- [ ] 实现通用 FeedCard 组件
- [ ] 实现各类型渲染器（至少 video、game、product、software）
- [ ] 对接推荐算法

### Phase 3：发布流程（2-3 天）
- [ ] 实现类型选择器
- [ ] 实现各类型发布表单（至少 video、game、software、product）
- [ ] 文件上传组件
- [ ] 发布预览

### Phase 4：交互功能（2-3 天）
- [ ] 点赞、帮推、评论、收藏
- [ ] 游戏试用（iframe 嵌入）
- [ ] 软件试用
- [ ] Skill 安装
- [ ] 产品购买跳转

### Phase 5：后端实现（3-5 天）
- [ ] 用户系统（注册/登录/JWT）
- [ ] 内容 CRUD
- [ ] 文件上传（OSS/本地）
- [ ] 推荐算法
- [ ] 数据统计

### Phase 6：优化迭代
- [ ] 审核系统
- [ ] 搜索功能
- [ ] 通知系统
- [ ] 数据分析后台

---

## 十、技术栈确认

### 前端
- React 18 + TypeScript
- Tailwind CSS
- Vite
- Zustand（状态管理）
- React Router

### 后端
- Express + TypeScript
- MySQL
- Redis
- JWT 认证
- 文件上传（multer + OSS）

### 部署
- 前端：Vercel
- 后端：自有服务器 / 云函数
- 数据库：MySQL
- 缓存：Redis
- 文件存储：OSS / S3
