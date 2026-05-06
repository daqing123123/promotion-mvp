#!/usr/bin/env python3
"""Find pm2 and restart everything"""
import paramiko, time, re

HOST = "81.70.71.132"
USER = "root"
PASS = "Qq1478535213"

NODE_BIN = "/usr/local/lighthouse/softwares/nodejs/node/bin"

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
    return out.strip(), err.strip()

# 1. Find pm2
print("\n[1] Find pm2:")
run("find / -name pm2 -type f 2>/dev/null | head -5")
run(f"ls {NODE_BIN}/pm2 2>/dev/null && echo 'pm2 in node bin'")
run("npm config get prefix")

# 2. Find npm global bin
print("\n[2] Find npm global bin:")
run("npm bin -g 2>/dev/null || npm root -g")
run("ls /usr/local/lib/node_modules/pm2/bin/pm2 2>/dev/null && echo 'found'")

# 3. Add npm global to PATH
out, _ = run("npm root -g")
npm_global = out.strip().replace('/lib/node_modules', '/bin') if 'lib/node_modules' in out else "/usr/local/bin"
print(f"\n[3] npm global bin: {npm_global}")
run(f"ls {npm_global}/pm2 2>/dev/null")
# Try other locations
run("ls /usr/local/lib/node_modules/.bin/pm2 2>/dev/null && echo 'found in .bin'")

# Create symlink to pm2 if found
run("ls /usr/local/lib/node_modules/.bin/pm2 2>/dev/null && ln -sf /usr/local/lib/node_modules/.bin/pm2 /usr/local/bin/pm2 && echo 'symlinked'")

# 4. Verify pm2
print("\n[4] pm2 check:")
run("which pm2 || /usr/local/bin/pm2 -v || ls /usr/local/lib/node_modules/.bin/pm2")

client.close()
