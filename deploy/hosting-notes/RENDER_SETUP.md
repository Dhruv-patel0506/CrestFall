# Render Deployment Guide for Crestfall Backend

## Step 1: Create Render Account
1. Go to https://render.com
2. Sign up (free account)
3. Verify your email

## Step 2: Connect GitHub
1. In Render dashboard, click "New +"
2. Select "Web Service"
3. Click "Connect GitHub"
4. Authorize Render to access your repositories
5. Select `Dhruv-patel0506/CrestFall` repository

## Step 3: Configure Web Service
### Basic Settings
- **Name:** crestfall-backend
- **Region:** Oregon (or closest to you)
- **Branch:** main

### Build & Deploy Settings
- **Runtime:** Docker
- **Dockerfile Path:** `./scenario_intelligence_engine/Dockerfile`
- **Docker Context:** `./scenario_intelligence_engine/`

### Environment
- **Instance Type:** Starter (2 GB RAM, 2 vCPU, $7/month)
- **Instances:** 1

### Advanced
- **Command:** (leave empty - uses Dockerfile CMD)
- **Working Directory:** `/app`

## Step 4: Add Disk Storage
1. Scroll down to "Disks" section
2. Click "Add Disk"
3. **Name:** data
4. **Mount Path:** `/app/new_data`
5. **Size:** 3 GB (for your CSV files)
6. Click "Save"

## Step 5: Deploy
1. Click "Create Web Service"
2. Wait for deployment (2-5 minutes)
3. Render will build and start your backend

## Step 6: Get Your Backend URL
After deployment:
1. Go to your service dashboard
2. Copy the URL (e.g., `https://crestfall-backend.onrender.com`)
3. Test it: `https://crestfall-backend.onrender.com/api/health`

## Step 7: Update Frontend
Update the frontend to use the new Render URL:

```bash
# Edit .env.production
cd scenario_intelligence_engine/frontend
# Change VITE_API_BASE to your Render URL
git add .env.production
git commit -m "Update API base URL to Render"
git push
```

## Step 8: Stop Cloudflare Tunnel
Once Render is working:
1. Close the Cloudflare Tunnel window
2. Stop the local Python backend
3. Your app now runs entirely on cloud services!

## Costs
- **Frontend (Vercel):** FREE
- **Backend (Render):** ~$7/month (Starter plan with 2GB disk)
- **Total:** ~$7/month for 24/7 hosting

## Notes
- Render includes a free SSL certificate
- Automatic restarts if the service crashes
- Logs available in Render dashboard
- Can scale up if needed

## Troubleshooting
If deployment fails:
1. Check Render logs in the dashboard
2. Ensure Dockerfile is in the correct location
3. Verify disk mount path matches render.yaml
4. Make sure all files are pushed to GitHub
