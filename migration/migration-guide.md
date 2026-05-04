# 巨浪 Julang - Supabase → MySQL 迁移指南

## 生成的文件

```
migration/
├── 01-mysql-schema.sql          # MySQL 建表语句（直接在 RDS 执行）
├── MIGRATION-GUIDE.md           # 本文件

server/
├── package.json                 # 后端依赖
├── .env.example                 # 环境变量模板
└── server.js                    # Express API 服务器（完整替代 Supabase）

frontend/src/lib/api/
└── client.ts                    # 前端 API 客户端（替代 @supabase/supabase-js）
```

## 迁移步骤

### Step 1: 建表

在阿里云 RDS MySQL DuckDB 实例的 DMS 控制台中执行：
```
migration/01-mysql-schema.sql
```

### Step 2: 启动后端

```bash
cd server
cp .env.example .env
# 编辑 .env 填入 RDS 连接信息
npm install
npm run dev
```

### Step 3: 修改前端

#### 3.1 替换导入

每个用到 supabase 的文件，把：
```typescript
import { supabase, xxx, yyy } from '../lib/supabase/client'
```
改为：
```typescript
import { xxx, yyy } from '../lib/api/client'
```

#### 3.2 逐页面改动清单

**pages/Login.tsx**
```diff
- import { signIn } from '../lib/supabase/client'
+ import { signIn } from '../lib/api/client'
// signIn 接口不变，已经是 signIn(username, password)
```

**pages/Register.tsx**
```diff
- import { signUp } from '../lib/supabase/client'
+ import { signUp } from '../lib/api/client'
// signUp 接口不变，已经是 signUp(username, password, name)
```

**pages/HomeV2.tsx**
```diff
- import { getContents, getTopics } from '../lib/supabase/client'
+ import { getContents, getTopics } from '../lib/api/client'
// 接口不变
```

**pages/Profile.tsx**
```diff
- import { supabase, getCurrentUser, ... } from '../lib/supabase/client'
+ import { getCurrentUser, getUserAchievements, getFollowCounts } from '../lib/api/client'
// 去掉所有 supabase.xxx 直接调用，改用封装好的函数
```

**pages/ContentDetail.tsx**
```diff
- import { supabase, getContentById, ... } from '../lib/supabase/client'
+ import { getContentById, getComments, addCommentWithPoints, toggleLike } from '../lib/api/client'
// 评论获取: supabase.from('comments').select() → getComments(targetType, targetId)
// 发评论: supabase.from('comments').insert() → addCommentWithPoints(targetType, targetId, content)
```

**pages/Topics.tsx**
```diff
- import { getTopics } from '../lib/supabase/client'
+ import { getTopics } from '../lib/api/client'
```

**pages/TopicDetail.tsx**
```diff
- import { supabase, getTopicById, getMemesByTopic } from '../lib/supabase/client'
+ import { getTopicById, getMemesByTopic } from '../lib/api/client'
```

**pages/Search.tsx**
```diff
- import { search } from '../lib/supabase/client'
+ import { search } from '../lib/api/client'
```

**pages/Settings.tsx**
```diff
- import { supabase, signOut } from '../lib/supabase/client'
+ import { signOut, updateUser } from '../lib/api/client'
// 更新用户: supabase.from('users').update() → updateUser(id, data)
```

**pages/Points.tsx**
```diff
- import { supabase, getPointsHistory } from '../lib/supabase/client'
+ import { getPointsHistory } from '../lib/api/client'
```

**pages/Tasks.tsx**
```diff
- import { supabase, getTasks, joinTask, completeTask } from '../lib/supabase/client'
+ import { getTasks, joinTask, completeTask } from '../lib/api/client'
// 注意: joinTask/completeTask 现在不需要传 userId，后端从 JWT 获取
```

**pages/Achievements.tsx**
```diff
- import { supabase, getUserAchievements } from '../lib/supabase/client'
+ import { getUserAchievements } from '../lib/api/client'
```

**pages/Notifications.tsx**
```diff
- import { supabase, getNotifications, markNotificationRead, markAllNotificationsRead } from '../lib/supabase/client'
+ import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../lib/api/client'
```

**pages/Invite.tsx**
```diff
- import { supabase, getOrCreateInviteCode, getInviteStats, getInviteLeaderboard } from '../lib/supabase/client'
+ import { getOrCreateInviteCode, getInviteStats, getInviteLeaderboard } from '../lib/api/client'
```

**pages/CheckIn.tsx**
```diff
- import { supabase, checkIn, getTodaySignIn, getConsecutiveDays, getSignInHistory } from '../lib/supabase/client'
+ import { checkIn, getTodaySignIn, getConsecutiveDays, getSignInHistory } from '../lib/api/client'
```

**pages/Activities.tsx**
```diff
- import { supabase, getActivities, joinActivity } from '../lib/supabase/client'
+ import { getActivities, joinActivity } from '../lib/api/client'
// joinActivity 现在不需要传 userId
```

**pages/PointsCenter.tsx**
```diff
- import { supabase, ... } from '../lib/supabase/client'
+ import { checkIn, getTodaySignIn, ... } from '../lib/api/client'
```

**pages/PublishV2.tsx**
```diff
- import { supabase, createContent } from '../lib/supabase/client'
+ import { createContent } from '../lib/api/client'
```

**pages/EditProfile.tsx**
```diff
- import { supabase, getCurrentUser } from '../lib/supabase/client'
+ import { getCurrentUser, updateUser } from '../lib/api/client'
// 更新用户: supabase.from('users').update() → updateUser(id, data)
```

**pages/Promote.tsx**
```diff
- import { supabase, promoteContent } from '../lib/supabase/client'
+ import { promoteContent } from '../lib/api/client'
```

**pages/UserProfile.tsx**
```diff
- import { supabase, getUserById, ... } from '../lib/supabase/client'
+ import { getUserById, getMemesByUser, getFollowCounts, toggleFollow, isFollowing } from '../lib/api/client'
```

**components/FeedContainer.tsx**
```diff
- import { getContents } from '../lib/supabase/client'
+ import { getContents } from '../lib/api/client'
```

**components/FeedControls.tsx**
```diff
- import { toggleLikeWithPoints, toggleFavorite } from '../lib/supabase/client'
+ import { toggleLikeWithPoints, toggleFavorite } from '../lib/api/client'
```

**components/CommentSheet.tsx**
```diff
- import { supabase, addCommentWithPoints, getComments } from '../lib/supabase/client'
+ import { addCommentWithPoints, getComments } from '../lib/api/client'
// getComments 现在不需要先查 user_id，直接调用即可
```

**components/MemeModal.tsx**
```diff
- import { supabase, ... } from '../lib/supabase/client'
+ import { toggleLike, addCommentWithPoints, getComments } from '../lib/api/client'
```

### Step 4: 删除 Supabase 依赖

```bash
npm uninstall @supabase/supabase-js
```

删除 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 环境变量。

添加 `VITE_API_URL=http://localhost:3001`（或你的后端地址）。

### Step 5: 数据迁移

从 Supabase 导出数据，导入 MySQL：

```bash
# 在 Supabase Dashboard → SQL Editor 导出 CSV
# 或者用 pg_dump

# 然后用 mysqlimport 或 LOAD DATA 导入 RDS MySQL
mysql -h xxx.mysql.rds.aliyuncs.com -u root -p julang < data.sql
```

## 注意事项

1. **UUID 格式**：Supabase 用的 UUID 格式和 MySQL 的 `CHAR(36)` 兼容
2. **时间格式**：Supabase 的 `timestamptz` → MySQL 的 `timestamp`，注意时区
3. **JSON 字段**：Supabase 的 `jsonb` → MySQL 的 `json`，读写方式一样
4. **密码迁移**：Supabase Auth 的密码无法导出（加密存储），用户需要重置密码或重新注册
5. **认证 token**：旧的 Supabase token 无效了，所有用户需要重新登录
