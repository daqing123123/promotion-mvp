#!/usr/bin/env python3
"""Create blind box tables using Node.js (mysql2 already installed)"""
import paramiko, time

HOST = "81.70.71.132"
USER = "root"
PASS = "Qq1478535213"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=15)
print("connected")

# Upload SQL
sftp = client.open_sftp()
with open(r"C:\Users\a1478\.openclaw-autoclaw\workspace\promotion-mvp\server\_migrate_blind_box.sql", 'rb') as f:
    sftp.putfo(__import__('io').BytesIO(f.read()), '/opt/promotion-mvp/server/_migrate_blind_box.sql')
sftp.close()
print("SQL uploaded")

# Node script to execute SQL
node_script = r"""
const fs = require('fs');
const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'rm-bp187s9336367ufd1vo.mysql.rds.aliyuncs.com',
    port: 3306, user: 'daqing1001', password: 'Qq1478535213',
    database: 'julang', multipleStatements: true
  });
  const sql = fs.readFileSync('/opt/promotion-mvp/server/_migrate_blind_box.sql', 'utf8');
  // Split by semicolons and execute each statement
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
  for (const stmt of statements) {
    try {
      await conn.query(stmt);
      console.log('OK:', stmt.substring(0, 60));
    } catch(e) { console.log('SKIP:', e.message.substring(0, 80)); }
  }
  // Verify
  const [rows] = await conn.query('SELECT COUNT(*) as cnt FROM blind_boxes');
  console.log('blind_boxes rows:', rows[0].cnt);
  await conn.end();
})();
"""

import base64
encoded = base64.b64encode(node_script.encode('utf-8')).decode('ascii')

stdin, stdout, stderr = client.exec_command(
    f'echo {encoded} | base64 -d > /tmp/_run_sql.js && cd /opt/promotion-mvp/server && /usr/local/lighthouse/softwares/nodejs/node/bin/node /tmp/_run_sql.js 2>&1',
    timeout=30
)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print(f"out: {out}")
if err: print(f"err: {err}")

client.close()
print("DONE")
