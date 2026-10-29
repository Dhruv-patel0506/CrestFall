# Crestfall Hosting Setup Guide

## Current Status
✅ **Backend** - Running locally on port 8000 with Cloudflare Tunnel
✅ **Cloudflare Tunnel** - Public URL: https://further-removable-language-remember.trycloudflare.com
✅ **Frontend** - Deployed to Vercel (Project: front-end-crest-form)
✅ **Vercel** - Live at: https://frontend-red-eta-80.vercel.app
✅ **Dataset Import Limit** - Increased from 50MB to 150MB

## Architecture
- **Frontend** (React) → Deployed to Vercel (free)
- **Backend** (Python FastAPI) → Running locally, exposed via Cloudflare Tunnel (free)
- **Data** (2GB CSVs) → Stored locally on your machine

## To Complete the Setup

### Option 1: Log in to Vercel (Recommended for permanent hosting)

1. **Login to Vercel:**
   ```bash
   vercel login
   ```
   This will open a browser for authentication.

2. **Deploy with your account:**
   ```bash
   cd scenario_intelligence_engine/frontend
   vercel
   ```
   Follow the prompts to:
   - Set project name (e.g., "crestfall")
   - Confirm framework preset: Vite
   - Confirm root directory: `.`
   - Build command: `npm run build`
   - Output directory: `dist`

3. **Add environment variable:**
   ```bash
   vercel env add VITE_API_BASE production
   ```
   When prompted, enter: `https://design-lectures-build-vat.trycloudflare.com/api`

4. **Redeploy:**
   ```bash
   vercel --prod
   ```

### Option 2: GitHub Pages (Alternative free hosting)

1. Push your code to GitHub
2. In frontend folder, build with production API URL:
   ```bash
   npm run build
   ```
3. Enable GitHub Pages in repo settings
4. Set source to `scenario_intelligence_engine/frontend/dist`

## Running the Backend

The backend needs to stay running for the app to work. To start it:

**Windows:**
```bash
cd scenario_intelligence_engine
.venv\Scripts\activate
python main.py
```

Or double-click: `scenario_intelligence_engine/start-crestfall.bat`

**Starting Cloudflare Tunnel (separate terminal):**
```bash
cd D:\Rocast
./cloudflared.exe tunnel --url http://localhost:8000
```

## Important Notes

⚠️ **Your computer must stay awake and connected** for the app to work with Cloudflare Tunnel:
- Plug in power
- Set sleep to "Never"
- Keep laptop open or use a dedicated machine

🔄 **Tunnel URL changes** each time you restart cloudflared. If the URL changes:
1. Check the new URL in the Cloudflare Tunnel window
2. Update Vercel:
   ```bash
   cd scenario_intelligence_engine/frontend
   vercel env rm VITE_API_BASE production --yes
   vercel env add VITE_API_BASE production --value <NEW_TUNNEL_URL>/api
   vercel --prod
   ```

💡 **For permanent hosting** (always on, no tunnel needed):
- Deploy backend to Render/Fly.io (approx $5-7/month for 2GB disk)
- Update `VITE_API_BASE` to that URL
- Then your computer doesn't need to stay awake

## Testing

Once Vercel is deployed:
1. Open your Vercel URL
2. Select a company (e.g., NVDA, AAPL)
3. The app should load forecasts from your local backend via the tunnel

## URLs

- Local backend: http://localhost:8000
- Tunnel backend: https://further-removable-language-remember.trycloudflare.com
- Vercel frontend: https://frontend-red-eta-80.vercel.app
