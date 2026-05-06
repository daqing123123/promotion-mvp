#!/usr/bin/env python3
"""Query MySQL tables through server"""
import paramiko

HOST = "81.70.71.132"
USER = "root"
PASS = "Qq1478535213"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=15)

stdin, stdout, stderr = client.exec_command(
    'mysql -h rm-bp187s9336367ufd1vo.mysql.rds.aliyuncs.com -u daqing1001 -pQq1478535213 julang -e "SHOW TABLES"', 
    timeout=15
)
print(stdout.read().decode('utf-8', errors='replace'))
client.close()
