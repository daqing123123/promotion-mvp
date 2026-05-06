#!/usr/bin/env python3
"""查找服务器上的 Node/npm 路径并启动服务"""
import paramiko

HOST = "81.70.71.132"
USER = "root"
PASS = "Qq1478535213"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=15)
print("connected")

def run(cmd):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=15)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return out.strip(), err.strip()

# Find Node
out, err = run("which node || find / -name node -type f 2>/dev/null | head -5")
print(f"node: {out}")

out, err = run("ls /usr/local/bin/node /usr/bin/node /root/.nvm/versions/node/*/bin/node 2>/dev/null")
print(f"ls check: {out}")

# Check if nvm is used
out, err = run("ls /root/.nvm 2>/dev/null && echo 'nvm exists' || echo 'no nvm'")
print(f"nvm: {out}")

# Check cloudflared
out, err = run("which cloudflared || find / -name cloudflared -type f 2>/dev/null | head -3")
print(f"cloudflared: {out}")

# Check if node process is running
out, err = run("ps aux | grep -v grep | grep node")
print(f"node processes: {out or 'none'}")

# Check if cloudflared is running
out, err = run("ps aux | grep -v grep | grep cloudflared")
print(f"cloudflared processes: {out or 'none'}")

client.close()
print("\ndone")
