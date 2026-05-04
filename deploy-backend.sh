#!/bin/bash
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@81.70.71.132 << 'EOF'
cd /opt/promotion-mvp
git pull
cd backend
npm run build
pkill -f "node dist/server.js" 2>/dev/null
sleep 1
nohup npm run start > server.log 2>&1 &
echo "DONE"
EOF
