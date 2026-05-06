#!/usr/bin/env python3
"""Fix pm2 PATH and restart all services"""
import paramiko, time, re

HOST = "81.70.71.132"
USER = "root"
PASS = "Qq1478535213"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=15)
print("connected")

NODE_BIN = "/usr/local/lighthouse/softwares/nodejs/node/bin"

def run(cmd, timeout=30):
    print(f"  $ {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out.strip():
        for line in out.strip().split('\n')[:10]:
            print(f"    {line}")
    if err.strip():
        for line in err.strip().split('\n')[:5]:
            print(f"    [err] {line}")
    return out.strip(), err.strip()

# 1. Symlink pm2 to /usr/local/bin
print("\n[1] Symlink pm2:")
run(f"ln -sf {NODE_BIN}/pm2 /usr/local/bin/pm2")
run("pm2 -v")

# 2. Kill any existing processes
print("\n[2] Kill existing:")
run("pkill -f 'node server' 2>/dev/null || true")
run("pkill -f cloudflared 2>/dev/null || true")
time.sleep(2)

# 3. Start node with pm2
print("\n[3] Start node (pm2):")
server_dir = "/opt/promotion-mvp/server"
run(f"cd {server_dir} && pm2 start server.js --name julang-server")
time.sleep(3)

# 4. Verify node
print("\n[4] Verify node:")
run("pm2 status")
run("curl -s http://localhost:3001/api/topics | head -c 100")

# 5. Start cloudflared with pm2
print("\n[5] Start cloudflared (pm2):")
run(f"pm2 start 'cloudflared tunnel --url http://localhost:3001 --logfile {server_dir}/tunnel.log' --name julang-tunnel")
time.sleep(8)

# 6. Get tunnel URL
print("\n[6] New tunnel URL:")
out, _ = run(f"tail -40 {server_dir}/tunnel.log")
match = re.search(r'https://[a-z0-9-]+\.trycloudflare\.com', out)
if match:
    tunnel_url = match.group(0)
    print(f"\n  >>> TUNNEL: {tunnel_url}")
else:
    print("  WARNING: no URL found!")
    tunnel_url = None

# 7. Save pm2 + auto-start
print("\n[7] Save pm2:")
run("pm2 save")
run("pm2 startup systemd -u root --hp /root 2>&1 | tail -3")

# 8. Final status
print("\n[8] Final:")
run("pm2 status")
run("curl -s http://localhost:3001/api/topics | head -c 100")

client.close()

if tunnel_url:
    print(f"\nTUNNEL={tunnel_url}")
print("DONE")
