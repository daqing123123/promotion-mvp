#!/usr/bin/env python3
"""Create blind box tables - upload files then run"""
import paramiko, time, io

HOST = "81.70.71.132"
USER = "root"
PASS = "Qq1478535213"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=15)
print("connected")
sftp = client.open_sftp()

# Upload SQL
with open(r"C:\Users\a1478\.openclaw-autoclaw\workspace\promotion-mvp\server\_migrate_blind_box.sql", 'rb') as f:
    sftp.putfo(io.BytesIO(f.read()), '/opt/promotion-mvp/server/_migrate_blind_box.sql')
print("SQL uploaded")

# Upload Node runner script
node_script = """
const fs = require('fs');
const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'rm-bp187s9336367ufd1vo.mysql.rds.aliyuncs.com',
    port: 3306, user: 'daqing1001', password: 'Qq1478535213',
    database: 'julang', multipleStatements: true
  });
  let sql = fs.readFileSync('/opt/promotion-mvp/server/_migrate_blind_box.sql', 'utf8');
  // Remove comments
  sql = sql.replace(/--.*$/gm, '').replace(/\\n/g, ' ');
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const stmt of statements) {
    try {
      await conn.query(stmt);
      console.log('OK:', stmt.substring(0, 60).replace(/\\n/g, ' '));
    } catch(e) {
      console.log('SKIP:', e.message.substring(0, 100));
    }
  }
  const [rows] = await conn.query('SELECT COUNT(*) as cnt FROM blind_boxes');
  console.log('DONE. blind_boxes rows:', rows[0].cnt);
  await conn.end();
})().catch(e => console.error('FATAL:', e.message));
"""
sftp.putfo(io.BytesIO(node_script.encode('utf-8')), '/tmp/_run_blind_sql.js')
sftp.close()

# Execute
stdin, stdout, stderr = client.exec_command(
    'cd /opt/promotion-mvp/server && /usr/local/lighthouse/softwares/nodejs/node/bin/node /tmp/_run_blind_sql.js 2>&1',
    timeout=30
)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print(out)
if err: print(f"STDERR: {err}")

client.close()
