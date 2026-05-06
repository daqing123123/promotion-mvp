#!/usr/bin/env python3
"""Find Node.js and restart services"""
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

# Search for node binary in common locations
out, err = run("ls -la /usr/local/bin/node* /usr/bin/node* /opt/node*/bin/node* 2>/dev/null")
print(f"node bins: {out or 'not found in common paths'}")

# Check if node is available via bash login shell
out, err = run("bash -lc 'which node' 2>/dev/null")
print(f"bash login node: {out or 'not found'}")

# Check all npm/node in PATH
out, err = run("echo $PATH")
print(f"PATH: {out}")

# Check /opt/promotion-mvp
out, err = run("ls -la /opt/promotion-mvp/")
print(f"promotion-mvp: {out}")

# Check server dir
out, err = run("ls -la /opt/promotion-mvp/server/ | head -20")
print(f"server dir: {out}")

# Try to find node binary using locate or find in /usr
out, err = run("find /usr -maxdepth 4 -name 'node' -type f 2>/dev/null | head -5")
print(f"find in /usr: {out}")

# Check if snap or apt has node
out, err = run("dpkg -l | grep nodejs 2>/dev/null || snap list node 2>/dev/null || echo 'no nodejs package'")
print(f"package check: {out}")

# Check .bashrc/.profile for nvm
out, err = run("grep -r 'nvm\|node' /root/.bashrc /root/.profile /root/.bash_profile 2>/dev/null | head -5")
print(f"shell config: {out or 'no node refs'}")

client.close()
