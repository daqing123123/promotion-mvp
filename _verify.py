#!/usr/bin/env python3
"""Verify blind box API and pm2 status"""
import paramiko
HOST = "81.70.71.132"
USER = "root"
PASS = "Qq1478535213"
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=15)
s = client.exec_command('curl -s http://localhost:3001/api/blind-box/items', timeout=10)
out = s[1].read().decode('utf-8', errors='replace')
print(f"API result (first 300 chars): {out[:300]}")
s2 = client.exec_command('pm2 jlist 2>/dev/null', timeout=10)
import json
try:
    procs = json.loads(s2[1].read().decode('utf-8'))
    for p in procs:
        print(f"  {p['name']}: {p['pm2_env']['status']}")
except: print("pm2 parse failed")
client.close()
