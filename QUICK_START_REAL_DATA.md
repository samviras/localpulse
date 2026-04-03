# Quick Start: Load Real Coffee Shop Data

Get LocalPulse running with real Vancouver coffee shops in **5 minutes**.

## TL;DR

```bash
# 1. Get a Google Places API key (free)
# 2. Set it as environment variable
export GOOGLE_PLACES_API_KEY='your-api-key-here'

# 3. Load real data
cd api
python real_data.py

# 4. Restart backend and check dashboard
python -m uvicorn main:app --reload

# Visit https://frontend-neon-seven-26.vercel.app
# Should now show REAL Vancouver coffee shops!
```

## 📋 Step-by-Step

### 1. Get Google Places API Key (2 min)

**Go to:** https://console.cloud.google.com

**Steps:**
1. Create new project (or use existing)
2. Enable Places API (search in Library)
3. Create API Key in Credentials
4. Copy the key

**That's it!** You have free tier: 25k requests/month

### 2. Install & Run (2 min)

```bash
# Install dependency
pip install googlemaps

# Or from requirements.txt
pip install -r api/requirements.txt
```

### 3. Load Real Data (1 min)

```bash
cd api

# Option A: Environment variable
export GOOGLE_PLACES_API_KEY='your-key-here'
python real_data.py

# Option B: Command line argument
python real_data.py 'your-key-here'
```

**What it does:**
- ✅ Finds 5 real coffee shops in Vancouver
- ✅ Finds ~60 nearby competitors
- ✅ Creates 8 weeks of historical data
- ✅ Populates alerts

**Output:**
```
✅ REAL DATA LOADED SUCCESSFULLY
==================================================
  Locations: 5
  Competitors: 60
  Snapshots: 480
  Alerts: 2
```

### 4. Verify Real Data

```bash
# Restart backend
python -m uvicorn main:app --reload

# Check API
curl http://localhost:8000/api/locations

# Open dashboard
open https://frontend-neon-seven-26.vercel.app
```

**Should show:**
- ✅ Real Vancouver coffee shops (not "Pulse Coffee")
- ✅ Real competitors (Starbucks, JJ Bean, etc.)
- ✅ Real ratings from Google Maps

---

## 🤔 Questions?

**"What real locations will I get?"**
- 5 coffee shops from Vancouver downtown
- Based on Google Maps data
- Real ratings, real competitors

**"How much does it cost?"**
- First 25,000 requests/month: FREE
- Each location search: 1 API call
- You'll stay in free tier easily

**"Can I customize which shops?"**
- Yes! Edit `real_data.py` line 70 to change location or search radius
- See full guide in REAL_DATA_SETUP.md

**"What about production (Railway)?"**
- Same steps, but set environment variable on Railway:
  ```bash
  railway variables set GOOGLE_PLACES_API_KEY='your-key'
  ```
- Then run `python real_data.py` in Railway console

---

## 🚀 Next Steps

1. Load real data (this guide)
2. Add authentication (create user accounts)
3. Setup automatic updates (weekly refresh)
4. Add email alerts (notify on competitor changes)
5. Deploy to customers

---

**Questions?** See full guide: **REAL_DATA_SETUP.md**
