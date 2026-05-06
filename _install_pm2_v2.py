#!/usr/bin/env python3
"""Install pm2 (background) then configure it"""
import paramiko, time, re

HOST = "81.70.71.132"
USER = "root"
PASS = "Qq1478535213"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=15)
print("connected")

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
    return out, err

# Step 1: Check symlinks already done
print("\n=== Step 1: Verify node ===")
run("node -v && npm -v")

# Step 2: Install pm2 globally - longer timeout, background
print("\n=== Step 2: Install pm2 (may take 1-2 min) ===")
# Use exec_command with a longer timeout
stdin, stdout, stderr = client.exec_command("npm install -g pm2 2>&1", timeout=120)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print(f"  {out.strip()}")
if err.strip():
    print(f"  [err] {err.strip()}")
run("pm2 -v")

# Step 3: Kill existing processes
print("\n=== Step 3: Kill existing ===")
run("pm2 kill 2>/dev/null; pkill -f 'node server' 2>/dev/null; pkill -f cloudflared 2>/dev/null; sleep 2; echo done")

# Step 4: Start node with pm2
print("\n=== Step 4: Start node (pm2) ===")
server_dir = "/opt/promotion-mvp/server"
run(f"cd {server_dir} && pm2 start server.js --name julang-server")
time.sleep(3)

# Step 5: Check node started
run("curl -s http://localhost:3001/api/topics | head -c 100")

# Step 6: Start cloudflared
print("\n=== Step 5: Start cloudflared (pm2) ===")
run(f"pm2 start 'cloudflared tunnel --url http://localhost:3001 --logfile {server_dir}/tunnel.log' --name julang-tunnel")
time.sleep(8)

# Step 7: Get tunnel URL
print("\n=== Step 6: Tunnel URL ===")
out, _ = run(f"cat {server_dir}/tunnel.log | tail -30")
match = re.search(r'https://[a-z0-9-]+\.trycloudflare\.com', out)
if match:
    tunnel_url = match.group(0)
    print(f"\n  >>> NEW TUNNEL: {tunnel_url}")
else:
    print("  WARNING: Could not find tunnel URL!")
    tunnel_url = None

# Step 8: Save pm2
print("\n=== Step 7: Save pm2 config ===")
run("pm2 save")
run("pm2 startup systemd -u root --hp /root 2>&1 | tail -3")

# Step 9: Status
print("\n=== Step 8: Final status ===")
run("pm2 status")
run("curl -s http://localhost:3001/api/topics | head -c 100")

client.close()

if tunnel_url:
    print(f"\nTUNNEL_URL={tunnel_url}")
print("DONE")
