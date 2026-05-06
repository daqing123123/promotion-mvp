import paramiko, sys
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('81.70.71.132', username='root', password='Qq1478535213', timeout=15)

# Check pm2 status
i, o, e = c.exec_command('pm2 jlist 2>/dev/null')
data = o.read().decode('utf-8')
f = open('_check_result.txt', 'w', encoding='utf-8')
f.write("=== PM2 ===\n")
try:
    import json
    procs = json.loads(data)
    for p in procs:
        f.write(f"{p['name']}: {p['pm2_env']['status']}\n")
except:
    f.write(f"raw: {data[:300]}\n")

# Check blind-box API
i, o, e = c.exec_command('curl -s http://localhost:3001/api/blind-box/items')
api = o.read().decode('utf-8')
f.write("\n=== Blind Box API ===\n")
f.write(f"len={len(api)}\n")
f.write(api[:500])

# Check tunnel
i, o, e = c.exec_command('curl -s http://localhost:3001/api/health 2>/dev/null')
health = o.read().decode('utf-8')
f.write("\n=== Health ===\n")
f.write(health[:200])

f.close()
c.close()
print("DONE - check _check_result.txt")
