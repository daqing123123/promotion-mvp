#!/usr/bin/env python3
"""Get pm2 status and tunnel URL - no fancy output"""
import paramiko, time, re, json

HOST = "81.70.71.132"
USER = "root"
PASS = "Qq1478535213"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=15)

NODE_BIN = "/usr/local/lighthouse/softwares/nodejs/node/bin"
server_dir = "/opt/promotion-mvp/server"

def run(cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return out.strip(), err.strip()

# Check pm2 status
out, err = run("pm2 jlist 2>/dev/null")
try:
    processes = json.loads(out)
    print(f"pm2 processes: {len(processes)}")
    for p in processes:
        print(f"  {p['name']}: {p['pm2_env']['status']} (pid={p['pid']}, restarts={p['pm2_env'].get('restart_time', 0)})")
except:
    print(f"pm2 raw: {out[:200]}")

# Check local API
out, err = run("curl -s http://localhost:3001/api/topics | head -c 100")
print(f"local API: {out}")

# Check if cloudflared is in pm2
has_tunnel = "julang-tunnel" in out if 'out' in dir() else False

# Start cloudflared if not running
if 'julang-tunnel' not in str(processes) if 'processes' in dir() else True:
    print("\nStarting cloudflared...")
    # First kill any old instance
    run("pkill -f cloudflared 2>/dev/null || true")
    time.sleep(1)
    run(f"pm2 start 'cloudflared tunnel --url http://localhost:3001 --logfile {server_dir}/tunnel.log' --name julang-tunnel")
    time.sleep(8)

# Get tunnel URL
out, err = run(f"tail -50 {server_dir}/tunnel.log 2>/dev/null")
tunnel_url = None
match = re.search(r'https://[a-z0-9-]+\.trycloudflare\.com', out)
if match:
    tunnel_url = match.group(0)
    print(f"\nTunnel: {tunnel_url}")

# Save pm2
run("pm2 save 2>/dev/null")
run("pm2 startup systemd -u root --hp /root 2>&1 | tail -2")

# Final check
out, err = run("pm2 jlist 2>/dev/null")
try:
    procs = json.loads(out)
    print(f"\nFinal: {len(procs)} processes running")
    for p in procs:
        print(f"  {p['name']}: {p['pm2_env']['status']}")
except:
    pass

# Test API through tunnel
if tunnel_url:
    out, err = run(f"curl -s {tunnel_url}/api/topics | head -c 100")
    print(f"Tunnel API test: {out}")

client.close()

if tunnel_url:
    print(f"\n>>> TUNNEL_URL={tunnel_url}")
print("DONE")
