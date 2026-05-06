#!/usr/bin/env python3
"""在腾讯云服务器上安装 pm2 并配置 julang-server 和 cloudflared 进程守护"""
import paramiko
import time

HOST = "81.70.71.132"
USER = "root"
PASS = "Qq1478535213"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

print("连接服务器...")
client.connect(HOST, username=USER, password=PASS, timeout=15)
print("已连接！")

def run(cmd, desc=""):
    if desc:
        print(f"\n>>> {desc}")
    print(f"  $ {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out.strip():
        print(f"  {out.strip()}")
    if err.strip():
        print(f"  [stderr] {err.strip()}")
    return out, err

# Step 1: 安装 pm2
run("npm install -g pm2", "安装 pm2")

# Step 2: 停掉旧 node 进程
run("pkill -f 'node server.js' || true", "停旧 Node 进程")
time.sleep(1)

# Step 3: 停掉旧 cloudflared
run("pkill -f cloudflared || true", "停旧 cloudflared")
time.sleep(1)

# Step 4: 用 pm2 启动 Node
run("cd /opt/promotion-mvp/server && pm2 start server.js --name julang-server", "pm2 启动 Node")

# Step 5: 用 pm2 启动 cloudflared 隧道
run("pm2 start 'cloudflared tunnel --url http://localhost:3001' --name julang-tunnel", "pm2 启动隧道")

# Step 6: 保存 pm2 配置
run("pm2 save", "保存 pm2 配置")

# Step 7: 开机自启
run("pm2 startup systemd -u root --hp /root 2>&1 | head -5", "配置开机自启")

# Step 8: 查看状态
print("\n" + "="*50)
print("当前状态：")
run("pm2 status", "pm2 状态")
run("pm2 logs --lines 5 --nostream", "最近日志")

# Step 9: 获取最新隧道 URL
print("\n" + "="*50)
out, _ = run("curl -s http://localhost:3001/api/topics | head -1", "测试本地 API")
if out:
    print("  ✅ 本地 API 正常")

client.close()
print("\n✅ 完成！")
