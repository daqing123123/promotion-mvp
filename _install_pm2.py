#!/usr/bin/env python3
"""Setup pm2 on server - handles tunnel URL change"""
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
    return out, err

# Step 1: Create symlinks for node/npm
print("\n=== Step 1: Setup node PATH ===")
run(f"ln -sf {NODE_BIN}/node /usr/local/bin/node")
run(f"ln -sf {NODE_BIN}/npm /usr/local/bin/npm")
run(f"ln -sf {NODE_BIN}/npx /usr/local/bin/npx")
print("  verifying: ", end="")
run("node -v")

# Step 2: Install pm2
print("\n=== Step 2: Install pm2 ===")
run("npm install -g pm2", timeout=60)
run("pm2 -v")

# Step 3: Kill existing processes
print("\n=== Step 3: Kill existing processes ===")
run("pkill -f 'node server.js' 2>/dev/null; sleep 1; echo done")
run("pkill -f cloudflared 2>/dev/null; sleep 2; echo done")

# Step 4: Start node with pm2
print("\n=== Step 4: Start node with pm2 ===")
server_dir = "/opt/promotion-mvp/server"
run(f"cd {server_dir} && pm2 start server.js --name julang-server")
time.sleep(2)
run("pm2 status")

# Step 5: Start cloudflared with pm2, capture URL
print("\n=== Step 5: Start cloudflared with pm2 ===")
run(f"pm2 start 'cloudflared tunnel --url http://localhost:3001 --logfile {server_dir}/tunnel.log' --name julang-tunnel")
time.sleep(5)

# Step 6: Get tunnel URL from log
print("\n=== Step 6: Get new tunnel URL ===")
out, _ = run(f"cat {server_dir}/tunnel.log | tail -30")
match = re.search(r'https://[a-z0-9-]+\.trycloudflare\.com', out)
if match:
    tunnel_url = match.group(0)
    print(f"\n  >>> NEW TUNNEL URL: {tunnel_url}")
else:
    print("  WARNING: Could not find tunnel URL!")

# Step 7: Save pm2 config for auto-start
print("\n=== Step 7: Save pm2 ===")
run("pm2 save")
run("pm2 startup systemd -u root --hp /root 2>&1 | tail -5")

# Step 8: Final status
print("\n=== Step 8: Final status ===")
run("pm2 status")
run("curl -s http://localhost:3001/api/topics | head -c 100")

# Step 9: Output tunnel URL for frontend update
print("\n" + "="*60)
if match:
    print(f"TUNNEL_URL={tunnel_url}")
print("="*60)

client.close()
