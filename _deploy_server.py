#!/usr/bin/env python3
"""Deploy updated server.js and restart via pm2"""
import paramiko, io

HOST = "81.70.71.132"
USER = "root"
PASS = "Qq1478535213"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=15)
print("connected")
sftp = client.open_sftp()

# Upload server.js
with open(r"C:\Users\a1478\.openclaw-autoclaw\workspace\promotion-mvp\server\server.js", 'rb') as f:
    sftp.putfo(io.BytesIO(f.read()), '/opt/promotion-mvp/server/server.js')
print("server.js uploaded")

sftp.close()

# Restart via pm2
stdin, stdout, stderr = client.exec_command(
    'cd /opt/promotion-mvp/server && pm2 restart julang-server 2>&1',
    timeout=15
)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print(f"pm2 restart: {out}")
if err: print(f"err: {err}")

# Verify
import time
time.sleep(2)
stdin, stdout, stderr = client.exec_command(
    'curl -s http://localhost:3001/api/blind-box/items 2>&1 | head -c 200',
    timeout=10
)
out = stdout.read().decode('utf-8', errors='replace')
print(f"Blind box API: {out}")

client.close()
print("DONE")
