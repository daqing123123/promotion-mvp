# 2026-05-06 白屏修复 + pm2 进程守护

## 问题
用户反馈 `julang-80snr01de.maozi.io` 白屏，且问为什么不能一直开着。

## 排查
- HTML/JS/CSS 资源正常返回 200
- 发现 Cloudflare trycloudflare 隧道 URL 已变更：`corporate-prints-anti-replacing` → `referring-breakdown-mining-buffer`
- 前端 client.ts 中 API_BASE 写死了旧隧道地址，请求失败导致白屏
- Node 和 cloudflared 无进程守护，崩了没人管

## 修复

### 前端
1. App.tsx 添加 ErrorBoundary 组件（防白屏，崩溃显示错误提示+重载按钮）
2. client.ts 更新 API_BASE 为新隧道 URL
3. 构建 + 推 GitHub（commit ac18769），等帽子云自动部署

### 服务器（81.70.71.132）
1. 创建 node/npm/npx 软链接到 /usr/local/bin
2. 安装 pm2（npm install -g pm2）
3. pm2 管理两个进程：
   - julang-server: node server.js (端口3001)
   - julang-tunnel: cloudflared tunnel --url http://localhost:3001
4. pm2 save + pm2 startup systemd（开机自启）
5. 隧道 URL 保持为 referring-breakdown-mining-buffer.trycloudflare.com

## 当前状态
- pm2: 2个进程均 online，崩了自动重启
- 隧道 URL 稳定（pm2 防止意外重启）
- 前端代码已推，等待帽子云构建

## 遗留风险
- 服务器重启时隧道 URL 可能变，需更新前端 API_BASE 并重新构建
- 长期方案：绑定域名或使用服务器 IP 直连（避免隧道依赖）
