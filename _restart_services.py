#!/usr/bin/env python3
"""Restart services with correct Node path"""
import paramiko, time

HOST = "81.70.71.132"
USER = "root"
PASS = "Qq1478535213"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=15)
print("connected")

NODE_BIN = "/usr/local/lighthouse/softwares/nodejs/node/bin"
NODE = f"{NODE_BIN}/node"
NPM = f"{NODE_BIN}/npm"

def run(cmd, timeout=30):
    print(f"  $ {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out.strip():
        print(f"    {out.strip()}")
    if err.strip():
        print(f"    [err] {err.strip()}")
    return out.strip(), err.strip()

# 1. Check node version
print("\n[1] Node version:")
run(f"{NODE} -v")

# 2. Start node in background (temporary, then replace with pm2)
print("\n[2] Start node server:")
# Kill any existing first
run("pkill -f 'node server.js' 2>/dev/null; sleep 1; echo done")
# Start with nohup
run(f"cd /opt/promotion-mvp/server && nohup {NODE} server.js > server.log 2>&1 & echo PID=$!")
time.sleep(2)

# 3. Verify node started
print("\n[3] Check node process:")
run("ps aux | grep -v grep | grep 'node server'")

# 4. Start cloudflared
print("\n[4] Start cloudflared tunnel:")
run("pkill -f cloudflared 2>/dev/null; sleep 1; echo done")
# Start cloudflared, capture the tunnel URL
stdin, stdout, stderr = client.exec_command(
    "cd /opt/promotion-mvp/server && nohup cloudflared tunnel --url http://localhost:3001 > tunnel.log 2>&1 & echo PID=$!; sleep 3; cat tunnel.log",
    timeout=15
)
tunnel_log = stdout.read().decode('utf-8', errors='replace')
print(f"    tunnel log: {tunnel_log.strip()}")

# Try to extract the tunnel URL
import re
match = re.search(r'https://[a-z0-9-]+\.trycloudflare\.com', tunnel_log)
if match:
    tunnel_url = match.group(0)
    print(f"\n    === TUNNEL URL: {tunnel_url} ===")
else:
    print("\n    [WARN] Could not extract tunnel URL from log")

# 5. Install pm2
print("\n[5] Install pm2:")
run(f"{NPM} install -g pm2", timeout=60)

# 6. Test API
print("\n[6] Test API:")
run("sleep 2; curl -s http://localhost:3001/api/topics | head -c 200")

# 7. Check pm2
print("\n[7] pm2 path:")
run(f"which pm2 || ls {NODE_BIN}/pm2 2>/dev/null || find /usr/local/lighthouse -name pm2 -type f 2>/dev/null | head -3")

client.close()
print("\ndone")
