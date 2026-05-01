# 巨浪 - 全品类内容平台

> 万物皆可发布，万物皆可刷到。

## 🎯 核心理念

一个统一的内容发现平台，用户可以在同一个 Feed 流里刷到各种类型的内容：

| 类型 | 图标 | 交互方式 |
|------|------|---------|
| 🎬 视频 | 短视频、Vlog | 自动播放 |
| 🎥 短视频 | 15秒以内 | 自动播放 |
| 📷 图片 | 摄影、设计 | 浏览 |
| 🎮 游戏 | HTML5 小游戏 | **即开即玩** |
| 🎬 电影 | 电影、纪录片 | 预告片 + 观看 |
| 📺 剧集 | 电视剧、综艺 | 预告片 + 观看 |
| 🎵 音乐 | 歌曲、播客 | 播放 |
| 📖 书籍 | 电子书 | 阅读 |
| 📄 文章 | 长文、教程 | 阅读 |
| 📦 产品 | 实物、数字产品 | 了解/购买 |
| 💻 软件 | App、工具 | **可试用** |
| 🧠 Skill | AI Skill、插件 | **一键安装** |
| 📡 直播 | 实时直播 | 进入直播间 |
| 👤 人物 | 创作者、素人 | 关注 |
| 📝 动态 | 文字、想法 | 查看 |

## 🏗️ 架构

```
promotion-mvp/
├── frontend/                    # React + TypeScript + Tailwind + Vite
│   └── src/
│       ├── lib/
│       │   ├── contentTypes.ts  # 内容类型定义（15 种）
│       │   ├── contentData.ts   # 统一内容数据结构
│       │   ├── mockDataV2.ts    # 全品类 Mock 数据
│       │   ├── recommendation.ts # 推荐算法
│       │   └── ...
│       ├── components/
│       │   ├── FeedContainer.tsx # 全屏滑动 Feed 容器
│       │   ├── ContentRenderer.tsx # 内容渲染器（根据类型）
│       │   ├── FeedControls.tsx # 右侧互动按钮
│       │   └── ContentInfo.tsx  # 底部信息栏
│       ├── pages/
│       │   ├── HomeV2.tsx       # 新首页（Feed 流）
│       │   ├── PublishV2.tsx    # 全品类发布页
│       │   └── ...
│       └── App.tsx
│
├── backend/                     # Express + TypeScript + MySQL
│   └── src/
│       ├── routes/index.ts      # API 路由（完整）
│       ├── schema.sql           # 数据库 Schema
│       └── app.ts
│
└── docs/
    └── architecture.md          # 架构设计文档
```

## 🚀 快速开始

```bash
# 前端
cd frontend
npm install
npm run dev

# 后端
cd backend
npm install
npm run dev
```

## 📱 Feed 流体验

- **上滑**：下一个内容
- **下滑**：上一个内容
- **点击内容**：进入交互（播放/游戏/试用）
- **双击**：点赞
- **右侧按钮**：点赞、帮推、评论、收藏、分享

## 🎮 游戏体验

刷到游戏 → 点击"开始游戏" → 直接在页面里玩 → 上滑继续

## 💻 软件试用

刷到软件 → 点击"立即试用" → iframe 嵌入体验 → 决定是否下载

## 🧠 Skill 安装

刷到 Skill → 查看能力演示 → 点击"一键安装" → 直接可用

## 📊 推荐算法

推荐分 = 内容质量 × 40% + 用户匹配 × 30% + 帮推热度 × 20% + 新鲜度 × 10% + 新创作者加分

## 🗄️ 数据库

15 张核心表：
- `users` - 用户
- `contents` - 通用内容
- `content_games` - 游戏
- `content_software` - 软件
- `content_skills` - Skill
- `content_media` - 电影/剧集
- `content_products` - 产品
- `content_articles` - 文章
- `comments` - 评论
- `likes` - 点赞
- `favorites` - 收藏
- `follows` - 关注
- `point_logs` - 积分记录
- `tasks` - 任务
- `task_participants` - 任务参与

## 📋 API 端点

- `GET /api/feed` - 获取推荐 Feed
- `GET /api/content-types` - 获取内容类型
- `POST /api/contents` - 发布内容
- `POST /api/contents/:id/like` - 点赞
- `POST /api/contents/:id/promote` - 帮推
- `POST /api/contents/:id/install` - 安装（Skill）
- `POST /api/contents/:id/trial` - 试用（软件）
- `POST /api/contents/:id/purchase` - 购买（产品）
- `POST /api/contents/:id/play` - 游玩（游戏）
- `POST /api/contents/:id/watch` - 观看（电影/视频）

## 🎨 设计原则

1. **即开即用**：任何内容都不要让用户等待
2. **统一发现**：不需要切换 App，刷就完了
3. **游戏化**：积分、等级、成就、稀有度
4. **反马太**：新创作者获得更多曝光
5. **帮推机制**：每个人都可以帮别人推广

## 📋 下一步

- [ ] Phase 1：协议层 + 数据库
- [ ] Phase 2：Feed 改造 + 内容渲染器
- [ ] Phase 3：发布流程
- [ ] Phase 4：交互功能
- [ ] Phase 5：后端实现
- [ ] Phase 6：审核 + 搜索 + 通知
