#!/usr/bin/env python3
"""Restart services on server"""
import paramiko, time, re

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
server_dir = "/opt/promotion-mvp/server"

def run(cmd, timeout=20):
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

def run_bg(cmd):
    """Run background - disconnect IO"""
    print(f"  $ {cmd}")
    channel = client.get_transport().open_session()
    channel.exec_command(f"{cmd} </dev/null >/dev/null 2>&1 &")
    # Don't read, just close
    channel.close()

# 1. Node version
print("\n[1] Node v:", end=" ")
run(f"{NODE} -v")

# 2. Kill existing processes
print("\n[2] Kill old processes:")
run("pkill -f 'node server.js' 2>/dev/null || true")
run("pkill -f cloudflared 2>/dev/null || true")
time.sleep(2)

# 3. Start node in background
print("\n[3] Start node server:")
run_bg(f"cd {server_dir} && nohup {NODE} server.js >> server.log 2>&1")
time.sleep(2)

# 4. Start cloudflared
print("\n[4] Start cloudflared:")
run_bg(f"cloudflared tunnel --url http://localhost:3001 --logfile {server_dir}/tunnel.log")
time.sleep(5)

# 5. Check processes
print("\n[5] Check processes:")
run("ps aux | grep -v grep | grep -E 'node server|cloudflared'")

# 6. Check tunnel URL
print("\n[6] Tunnel URL:")
out, _ = run(f"cat {server_dir}/tunnel.log 2>/dev/null | tail -20")
match = re.search(r'https://[a-z0-9-]+\.trycloudflare\.com', out)
if match:
    tunnel_url = match.group(0)
    print(f"\n    ===> TUNNEL: {tunnel_url}")
else:
    print("    Could not find tunnel URL in log")

# 7. Test API
print("\n[7] Test local API:")
run("curl -s http://localhost:3001/api/topics 2>/dev/null | head -c 100")

# 8. Install pm2
print("\n[8] Install pm2:")
run(f"{NPM} install -g pm2", timeout=60)

# 9. Check pm2
print("\n[9] pm2 path:")
run(f"ls {NODE_BIN}/pm2 2>/dev/null && echo 'pm2 OK' || echo 'pm2 not in node bin'")
run("which pm2 2>/dev/null || find /usr/local/lighthouse -name pm2 2>/dev/null | head -3")

client.close()
print("\n[DONE]")
