# ✅ Crestfall Deployment Complete!

## 🌐 Live URLs
- **Frontend:** https://crestfall-phi.vercel.app
- **Backend:** http://54.79.67.55:8000

## 📊 What's Hosted
- ✅ **Backend:** AWS EC2 t3.micro (Free Tier - 12 months)
  - 46 companies loaded
  - 1GB RAM + 2GB swap
  - 30GB storage
  - Always on 24/7
- ✅ **Frontend:** Vercel (Free)
  - Auto-deploys from GitHub
  - Always on 24/7

## 💰 Costs
- **Current:** $0 (AWS Free Tier + Vercel Free)
- **After 12 months:** ~$12.50/month (AWS t3.micro)

## 🎯 You Can Now
1. Access the app anytime at https://crestfall-phi.vercel.app
2. Upload datasets up to 1GB
3. Close your computer - app stays online!
4. No Cloudflare Tunnel needed

## ⚠️ Important Notes
- AWS Free Tier expires in 12 months
- Keep your AWS account secure
- Monitor free tier usage in AWS Billing Dashboard
- After 12 months, it costs ~$12.50/month

## 📋 How to Stop the Instance
If you want to stop to save money:
1. Go to AWS EC2 Console
2. Select your instance (i-0b4409c13f18889c5)
3. Click "Instance state" → "Stop instance"
4. To start again: "Instance state" → "Start instance"

## 🔄 How to Update Code
Just push to GitHub:
```bash
git add .
git commit -m "your changes"
git push
```
Vercel auto-deploys the frontend.

For backend updates on AWS:
```bash
# In AWS browser terminal
cd /opt/CrestFall
sudo git pull
cd scenario_intelligence_engine
sudo docker compose down
sudo docker compose up -d --build
```

## 🎉 You're All Set!
The app is now permanently hosted on AWS Free Tier. No need to keep your computer on anymore!
