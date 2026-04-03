# LocalPulse — Real Data Setup Guide

Transform LocalPulse from demo to production by loading real coffee shop data from Google Places API.

## 📋 Prerequisites

- Google Cloud account (free tier available)
- Google Places API enabled
- API key with Places API access

## 🔑 Step 1: Get Google Places API Key

### 1a. Create Google Cloud Project
1. Go to **https://console.cloud.google.com**
2. Click the project dropdown at the top
3. Click **NEW PROJECT**
4. Name it "LocalPulse"
5. Click **CREATE**

### 1b. Enable Places API
1. Go to **APIs & Services** → **Library**
2. Search for **"Places API"**
3. Click on it
4. Click **ENABLE**
5. Wait for it to activate (~1 minute)

### 1c. Create API Key
1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS**
3. Select **API Key**
4. Copy the key (you'll need it)
5. ⚠️ **Restrict it to Places API only:**
   - Click the edit icon (pencil)
   - Under "API restrictions" select **Places API**
   - Save

### 1d. Enable Billing (Optional but Recommended)
- Free tier: 25,000 Place Details + 100,000 Text Search requests/month
- If you hit limits, add a billing account for pay-as-you-go
- Places API: ~$7 per 1,000 requests

---

## 📦 Step 2: Install Dependencies

```bash
cd api

# Install google-maps-services
pip install googlemaps

# Or update requirements.txt
pip install -r requirements.txt
```

---

## 🚀 Step 3: Load Real Data

### Option A: Environment Variable (Recommended)

```bash
# Set your API key
export GOOGLE_PLACES_API_KEY='your-api-key-here'

# Run the loader
cd api
python real_data.py
```

### Option B: Pass as Argument

```bash
cd api
python real_data.py 'your-api-key-here'
```

### What It Does

The loader will:

1. ✅ Find **5 real coffee shops** in Vancouver
2. ✅ For each location, find **nearby competitors** (within 500m)
3. ✅ Create **8 weeks of historical snapshots** with real ratings
4. ✅ Generate **sample alerts** for competitive changes
5. ✅ Populate the database with production-ready data

### Example Output

```
🔄 Initializing Places API...
✅ Cleared existing data
🔍 Finding real coffee shops near (49.2827, -123.1207)...
✅ Found 147 coffee shops
  ✅ Added location: Straight Coffee Roasters
  ✅ Added location: The Wallflower Café
  ✅ Added location: Kafka's Coffee
  ✅ Added location: JJ Bean Coffee
  ✅ Added location: Elysian Coffee

🔍 Finding competitors for each location...
  📍 Straight Coffee Roasters: Found 12 nearby cafes
  ✅ Added competitors
  📍 The Wallflower Café: Found 14 nearby cafes
  ...

📊 Creating historical snapshots...
✅ Created snapshots for 60 competitors

🚨 Creating sample alerts...
✅ Created sample alerts

==================================================
✅ REAL DATA LOADED SUCCESSFULLY
==================================================
  Locations: 5
  Competitors: 60
  Snapshots: 480
  Alerts: 2
```

---

## 🔄 Step 4: Restart the Backend

```bash
# Kill the old server
# Then restart:

cd api
python -m uvicorn main:app --reload

# Or deploy to Railway:
railway up
```

---

## ✅ Step 5: Verify Real Data

### Option A: Check Dashboard
1. Open https://frontend-neon-seven-26.vercel.app
2. Should show **real Vancouver coffee shops**
3. Competitors should be **actual nearby cafes**
4. Ratings from **Google Places**

### Option B: Query API Directly

```bash
# Get real locations
curl https://reliable-solace-production-dd7a.up.railway.app/api/locations

# Get real competitors
curl https://reliable-solace-production-dd7a.up.railway.app/api/locations/1/competitors

# Get dashboard summary
curl https://reliable-solace-production-dd7a.up.railway.app/api/dashboard/summary
```

---

## 🛠️ Advanced: Customize Search

Edit `real_data.py` to change the search:

```python
# Different location (e.g., Commercial Drive)
load_real_coffee_shops(
    location=(49.2733, -123.0694),  # Commercial Drive
    radius=3000,  # 3km instead of 5km
    limit=10  # Load 10 shops instead of 5
)

# Different search query
coffee_shops = places_client.find_coffee_shops(
    location=location,
    query="espresso bar"  # Search for espresso bars instead
)
```

---

## 📊 Real Data Sources

### What You Get
- ✅ **Real shop names and addresses** from Google Maps
- ✅ **Current ratings** (e.g., 4.3 ⭐)
- ✅ **Review counts** (how many people reviewed)
- ✅ **Competitor locations** (auto-discovered nearby)
- ✅ **Business status** (Open, Closed, Permanently Closed)
- ✅ **Opening hours** (when shops are open)

### What You Don't Get (Requires More Setup)
- ❌ Historical rating trends (Google doesn't expose this)
- ❌ Detailed reviews (requires additional endpoint)
- ❌ Photos (requires additional permission)
- ❌ Individual review sentiment (requires NLP)

**Workaround:** Create your own snapshot records by calling the API weekly/monthly to track rating changes over time.

---

## 💰 Cost Estimates

**Free Tier (25k requests/month):**
- Load 5 locations + 10 competitors each = 50 API calls (first time)
- Perfect for development and testing

**Small Scale (~1000 locations):**
- Initial load: 1,000 API calls = ~$7
- Weekly updates: 1,000 API calls/week = ~$28/month

**Enterprise Scale:**
- Add premium support and billing as needed

---

## 🔒 Security Best Practices

1. **Never commit your API key** to git:
   ```bash
   # Add to .gitignore
   echo "*.env" >> .gitignore
   echo "api_key.txt" >> .gitignore
   ```

2. **Use environment variables:**
   ```bash
   export GOOGLE_PLACES_API_KEY='...'
   ```

3. **Restrict API key in Google Cloud:**
   - Limit to Places API only
   - Set HTTP restrictions (your domain only)
   - Monitor usage in Google Cloud Console

4. **On Railway, set environment variable:**
   ```bash
   railway variables set GOOGLE_PLACES_API_KEY='your-key'
   ```

---

## 🚀 Going Further

### Add Real Reviews
```python
from places_api import PlacesAPIClient

places = PlacesAPIClient()
reviews = places.get_reviews(place_id)

# Save reviews to database
for review in reviews:
    # Create review record
```

### Track Changes Over Time
```python
# Run this weekly to track rating changes
competitors = db.query(Competitor).all()
for comp in competitors:
    new_data = places.get_place_details(comp.google_place_id)
    
    # Save new snapshot
    snapshot = CompetitorSnapshot(
        competitor_id=comp.id,
        rating=new_data['rating'],
        review_count=new_data['review_count'],
        ...
    )
```

### Automate with Cron
```bash
# Weekly update via cron
# Edit crontab:
crontab -e

# Add this line:
0 9 * * 1 cd ~/localpulse/api && python real_data.py
# (Runs every Monday at 9 AM)
```

---

## ❓ Troubleshooting

### "No API key provided"
- Set `GOOGLE_PLACES_API_KEY` environment variable
- Or pass API key as argument: `python real_data.py 'your-key'`

### "Places API not enabled"
- Go to Google Cloud Console
- APIs & Services → Library
- Search "Places API" and click Enable

### "Quota exceeded"
- Check your API usage in Google Cloud Console
- Upgrade to paid plan or wait for monthly reset
- Use a smaller radius/limit in search

### "No coffee shops found"
- Try different coordinates (Vancouver: 49.2827, -123.1207)
- Try different radius (5000m = 5km)
- Check API key has Places API enabled

### "Network error"
- Check internet connection
- Verify API key is valid
- Check if Places API is responding (outage?)

---

## 📞 Support

- **Google Places API Docs:** https://developers.google.com/maps/documentation/places
- **API Reference:** https://googlemaps.github.io/google-maps-services-python/
- **GitHub Issues:** https://github.com/samviras/localpulse/issues

---

## ✅ Checklist

- [ ] Created Google Cloud Project
- [ ] Enabled Places API
- [ ] Created and restricted API Key
- [ ] Installed googlemaps: `pip install googlemaps`
- [ ] Set GOOGLE_PLACES_API_KEY environment variable
- [ ] Ran `python real_data.py`
- [ ] Verified real data loaded successfully
- [ ] Restarted backend
- [ ] Checked dashboard showing real coffee shops
- [ ] Committed changes to git

---

**Once real data is loaded, LocalPulse becomes a fully operational competitive intelligence platform for your coffee business.** ☕

