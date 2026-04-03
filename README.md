# LocalPulse 🔍

**Competitive Intelligence Dashboard for Multi-Location Businesses**

A full-stack SaaS application that monitors competitor activity across multiple locations, tracks competitive advantages, and provides actionable intelligence for business growth.

## 🌐 Live Demo

- **Frontend:** https://frontend-neon-seven-26.vercel.app
- **Backend API:** https://reliable-solace-production-dd7a.up.railway.app/api
- **Status:** ✅ Production Ready

Demo uses fictional Vancouver coffee shops and competitors for testing.

## 🏗️ Architecture

### Frontend (React)
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS (dark theme)
- **Routing:** React Router v6 (SPA)
- **Charts:** Recharts for analytics
- **HTTP:** Axios API client
- **Hosting:** Vercel

### Backend (FastAPI)
- **Framework:** FastAPI with async endpoints
- **ORM:** SQLAlchemy
- **Database:** SQLite (demo) / PostgreSQL (production)
- **API:** REST endpoints with CORS
- **Hosting:** Railway

### Infrastructure
- **Version Control:** Git + GitHub
- **Frontend Deployment:** Vercel (auto-deploy from git)
- **Backend Deployment:** Railway (CLI deploy)
- **Environment Management:** Railway environment variables

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Git
- Vercel CLI
- Railway CLI

### Frontend Setup
```bash
cd frontend
npm install
npm run dev        # Local dev server on :5173
npm run build      # Production build
vercel --prod      # Deploy to Vercel
```

### Backend Setup
```bash
cd api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -c "from database import init_db; init_db()"  # Seed demo data
python -m uvicorn main:app --reload                  # Local API on :8000
railway up                                           # Deploy to Railway
```

## 🚀 Features

### Dashboard
- **KPI Cards:** 4 key metrics (locations, competitors, alerts, rating advantage)
- **Recent Alerts:** Feed of competitive changes
- **Rating Trend:** 8-week performance comparison
- **Review Velocity:** Top competitors by review activity

### Locations
- Browse all managed business locations
- View location details and ratings
- Quick access to competitor analysis

### Alerts
- Real-time notifications of competitive changes
- Severity levels (high, medium, low)
- Actionable intelligence

### Weekly Briefs
- AI-powered market summary
- Trend analysis
- Strategic recommendations

## 🔧 API Endpoints

```
GET    /api/health                    - Health check
GET    /api/dashboard/summary         - Dashboard KPIs
GET    /api/locations                 - List all locations
POST   /api/locations                 - Create location
GET    /api/locations/{id}/competitors - Competitors for location
GET    /api/competitors/{id}          - Competitor details
GET    /api/alerts                    - List alerts
POST   /api/alerts/{id}/read          - Mark alert read
GET    /api/briefs                    - List weekly briefs
POST   /api/briefs/generate           - Generate new brief
```

## 📊 Demo Data

**5 Locations:**
- Pulse Coffee Downtown (401 W Hastings St)
- Pulse Coffee Kitsilano (2182 W 4th Ave)
- Pulse Coffee Gastown (341 Water St)
- Pulse Coffee Mount Pleasant (2526 Main St)
- Pulse Coffee Commercial (1398 Commercial Dr)

**19 Competitors:**
- Starbucks, Tim Hortons, 49th Parallel, Nemesis Coffee, Matchstick Coffee, JJ Bean, Blenz Coffee, Revolver Coffee, Timbertrain Coffee Roasters, Elysian Coffee, Small Victory Bakery, Prado Cafe, Kafka's Coffee, and more...

**4 Active Alerts:**
- Competitor Rating Decline
- Location Underperforming
- Review Activity Spike
- New Food Truck Competition

**8 Weeks Historical Data:**
- Rating trends
- Review counts
- Competitive positioning
- Market trends

## 🔄 Deployment

### Automatic (Git-based)
```bash
# Frontend: Push to git and Vercel auto-deploys
git push origin main

# Backend: Use Railway CLI
railway up
```

### Manual
```bash
# Frontend
cd frontend && vercel --prod

# Backend
cd api && railway up
```

## 🛠️ Configuration

### Environment Variables (Railway)

**Frontend:**
- `VITE_API_URL` - Backend API URL (defaults to `/api` proxy)

**Backend:**
- `DEMO_MODE` - Enable/disable demo data (default: true)
- `FRONTEND_URL` - Frontend domain for CORS

### Files
- `frontend/vite.config.ts` - Vite bundler config
- `frontend/tailwind.config.js` - Tailwind CSS customization
- `frontend/vercel.json` - Vercel deployment & SPA routing
- `api/main.py` - FastAPI application
- `api/database.py` - SQLAlchemy setup
- `api/demo_data.py` - Demo dataset generator
- `deploy.sh` - Automated deployment script

## 🚀 Scaling to Production

To use with real data:

1. **Replace Demo Data:**
   - Integrate Google Places API for real locations
   - Implement Yelp/Google Reviews API for ratings
   - Add competitor discovery from multiple sources

2. **Add Authentication:**
   - Implement user accounts (Firebase, Auth0, etc.)
   - Add role-based access control
   - Secure API endpoints

3. **Upgrade Database:**
   - Move from SQLite to PostgreSQL
   - Add data backups and replication
   - Implement audit logging

4. **Add Real Alerts:**
   - Email/SMS notifications
   - Webhook integrations
   - Slack/Teams bot

5. **Enhanced Analytics:**
   - ML-powered insights
   - Sentiment analysis
   - Predictive trends

## 📝 Development

### Local Development
```bash
# Terminal 1: Frontend
cd frontend && npm run dev

# Terminal 2: Backend
cd api && python -m uvicorn main:app --reload

# Visit http://localhost:5173 (frontend)
# API at http://localhost:8000 (backend)
```

### Build & Deploy Checklist
- [ ] Run `npm run build` (frontend)
- [ ] Test locally: `vercel dev`
- [ ] Verify API: `curl http://localhost:8000/api/health`
- [ ] Commit: `git add -A && git commit -m "..."`
- [ ] Deploy frontend: `vercel --prod`
- [ ] Deploy backend: `railway up`
- [ ] Test live URLs

## 🔐 Security Considerations

**Current (Demo):**
- No user authentication
- Demo mode data only
- Public API endpoints
- SQLite (ephemeral storage)

**Before Production:**
- Add authentication layer
- Implement API rate limiting
- Use PostgreSQL with encryption
- Add HTTPS/TLS (already on Vercel & Railway)
- Restrict CORS origins
- Add request validation
- Implement audit logging

## 📚 Documentation

- `/api/main.py` - API endpoints and logic
- `/frontend/src/pages/` - Page components
- `/frontend/src/components/` - Reusable components
- `deploy.sh` - Deployment automation

## 🤝 Contributing

1. Clone the repo
2. Create a feature branch
3. Make changes
4. Test locally
5. Push and open PR
6. Deploy via Vercel/Railway

## 📞 Support

- **GitHub Issues:** https://github.com/samviras/localpulse/issues
- **API Health:** https://reliable-solace-production-dd7a.up.railway.app/api/health
- **Status:** Check deployment logs on Vercel & Railway dashboards

## 📄 License

MIT License - Free to use and modify for personal/commercial use.

---

**Built with ❤️ using React, FastAPI, and modern web technologies.**

**Status:** ✅ Production Ready | 🎯 Ready for Demo | 🚀 Ready to Scale
