#!/usr/bin/env python3
"""Execute blind box SQL on RDS via server"""
import paramiko

HOST = "81.70.71.132"
USER = "root"
PASS = "Qq1478535213"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=15)
print("connected")

# Read SQL file from local, upload and execute
with open(r"C:\Users\a1478\.openclaw-autoclaw\workspace\promotion-mvp\server\_migrate_blind_box.sql", 'rb') as f:
    sql_content = f.read()

# Upload SQL to server
sftp = client.open_sftp()
sftp.putfo(
    __import__('io').BytesIO(sql_content),
    '/opt/promotion-mvp/server/_migrate_blind_box.sql'
)
sftp.close()
print("SQL uploaded")

# Execute SQL
stdin, stdout, stderr = client.exec_command(
    'mysql -h rm-bp187s9336367ufd1vo.mysql.rds.aliyuncs.com -u daqing1001 -pQq1478535213 julang < /opt/promotion-mvp/server/_migrate_blind_box.sql 2>&1',
    timeout=30
)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print(f"out: {out}")
print(f"err: {err}")

# Verify tables created
stdin, stdout, stderr = client.exec_command(
    'mysql -h rm-bp187s9336367ufd1vo.mysql.rds.aliyuncs.com -u daqing1001 -pQq1478535213 julang -e "SELECT COUNT(*) AS cnt FROM blind_boxes" 2>&1',
    timeout=15
)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print(f"blind_boxes count: {out}")
if err: print(f"err: {err}")

client.close()
print("DONE")
