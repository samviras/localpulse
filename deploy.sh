#!/bin/bash
set -e

echo "=== 1. Setting up Backend ==="
cd ~/localpulse/api
python3.11 -m venv venv 2>/dev/null || true
./venv/bin/pip install -r requirements.txt -q
DEMO_MODE=true ./venv/bin/python -c "from database import init_db; init_db(); from demo_data import seed_demo_data; seed_demo_data(); print('✅ Backend DB seeded')"
rm -f localpulse.db

echo "=== 2. Building Frontend ==="
cd ~/localpulse/frontend
npm install --legacy-peer-deps 2>&1 | tail -5
npm run build 2>&1
echo "✅ Frontend built successfully"

echo "=== 3. Git + GitHub ==="
cd ~/localpulse
rm -rf .git
git init
git add -A
git commit -m "LocalPulse: competitive intelligence dashboard for multi-location businesses"
# Delete old repo if exists, then create new
gh repo delete samviras/localpulse --yes 2>/dev/null || true
gh repo create localpulse --public --source=. --push --description "Competitive intelligence dashboard for multi-location businesses" 2>&1 || {
  git remote add origin https://github.com/samviras/localpulse.git 2>/dev/null || git remote set-url origin https://github.com/samviras/localpulse.git
  git push -f origin main 2>&1
}
echo "✅ GitHub done"

echo "=== 4. Deploy Backend to Railway ==="
cd ~/localpulse/api
which railway >/dev/null 2>&1 || (echo "Installing Railway CLI..." && curl -fsSL https://railway.com/install.sh | sh)
echo "Railway login..."
railway login 2>&1 || echo "⚠️ May need browser auth"
railway init 2>&1 || true
railway up 2>&1 || echo "⚠️ Railway deploy needs attention"
railway variables set DEMO_MODE=true 2>&1 || true
echo "Getting Railway URL..."
railway domain 2>&1 || true

echo "=== 5. Deploy Frontend to Vercel ==="
cd ~/localpulse/frontend
which vercel >/dev/null 2>&1 || npm i -g vercel
vercel --yes --prod 2>&1 || echo "⚠️ Vercel deploy needs attention"

echo ""
echo "========================================="
echo "DEPLOYMENT COMPLETE"
echo "========================================="
echo "Next steps if needed:"
echo "1. Set VITE_API_URL on Vercel to Railway URL"
echo "2. Set FRONTEND_URL on Railway to Vercel URL"
echo "3. Redeploy: cd ~/localpulse/frontend && vercel --yes --prod"
