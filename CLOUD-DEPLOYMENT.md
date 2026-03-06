# Cloud Hosting Deployment Guide

## 🚀 Deploy to Render.com (EASIEST - FREE)

### Option 1: Deploy from GitHub (Recommended)

1. **Push code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/pagecopier.git
   git push -u origin main
   ```

2. **Go to [Render.com](https://render.com)** and sign up (free)

3. **Create New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `pagecopier` repo

4. **Configure:**
   - Name: `pagecopier`
   - Environment: `Node`
   - Build Command: `npm install && npx playwright install --with-deps chromium`
   - Start Command: `npm start`
   - Instance Type: **Free**

5. **Deploy!** 
   - Click "Create Web Service"
   - Wait 5-10 minutes for first deployment
   - You'll get a URL like: `https://pagecopier.onrender.com`

### Option 2: Deploy without GitHub

1. Install Render CLI:
   ```bash
   npm install -g render-cli
   ```

2. Login:
   ```bash
   render login
   ```

3. Deploy:
   ```bash
   render deploy
   ```

---

## 🚂 Deploy to Railway.app (EASY - FREE)

1. **Go to [Railway.app](https://railway.app)** and sign up

2. **Deploy:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Or click "Deploy from local directory" and select the folder

3. **Configure (auto-detected):**
   - Railway auto-detects Node.js
   - Automatically installs dependencies
   - Gets a URL like: `https://pagecopier.up.railway.app`

4. **Add Playwright install:**
   - Go to Settings → Deploy
   - Add custom start command:
     ```
     npx playwright install --with-deps chromium && npm start
     ```

---

## ✈️ Deploy to Fly.io (FREE)

1. **Install Fly CLI:**
   ```bash
   # Windows (PowerShell)
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   
   # Mac/Linux
   curl -L https://fly.io/install.sh | sh
   ```

2. **Sign up and login:**
   ```bash
   fly auth signup
   fly auth login
   ```

3. **Create app:**
   ```bash
   fly launch
   ```
   - Answer prompts (choose region, etc.)
   - It creates `fly.toml` automatically

4. **Deploy:**
   ```bash
   fly deploy
   ```

5. **Your app:** `https://pagecopier.fly.dev`

---

## 🌊 Deploy to DigitalOcean App Platform ($5/month)

1. **Go to [DigitalOcean](https://www.digitalocean.com)**

2. **Create App:**
   - Apps → Create App
   - Choose GitHub repo
   - Select Node.js

3. **Configure:**
   - Build Command: `npm install && npx playwright install --with-deps chromium`
   - Run Command: `npm start`
   - Plan: Basic ($5/month)

4. **Deploy:** Automatic!

---

## 🔶 Deploy to Heroku (PAID - ~$5/month)

1. **Install Heroku CLI:**
   ```bash
   npm install -g heroku
   ```

2. **Login:**
   ```bash
   heroku login
   ```

3. **Create app:**
   ```bash
   heroku create pagecopier
   ```

4. **Add Playwright buildpack:**
   ```bash
   heroku buildpacks:add jontewks/puppeteer
   heroku buildpacks:add heroku/nodejs
   ```

5. **Deploy:**
   ```bash
   git push heroku main
   ```

6. **Open app:**
   ```bash
   heroku open
   ```

---

## 🎯 RECOMMENDED: Render.com

**Why Render.com is best:**
- ✅ **FREE** forever (with limitations)
- ✅ Supports Playwright out of the box
- ✅ Auto-deploys from GitHub
- ✅ SSL certificate included
- ✅ Easy to use
- ✅ No credit card required for free tier

---

## 📊 Pricing Comparison

| Platform | Free Tier | Paid |
|----------|-----------|------|
| **Render.com** | ✅ Yes | $7/month |
| **Railway.app** | ✅ $5 credit/month | $5/month |
| **Fly.io** | ✅ Yes | $2+/month |
| **DigitalOcean** | ❌ No | $5/month |
| **Heroku** | ❌ No | $5/month |

---

## 🔧 Environment Variables

If your cloud platform requires environment variables:

```
PORT=3000
NODE_ENV=production
```

---

## 🐛 Troubleshooting

**Problem: Playwright install fails**
- Solution: Add `--with-deps` flag to install system dependencies

**Problem: Out of memory**
- Solution: Upgrade to paid tier with more RAM

**Problem: Deployment timeout**
- Solution: First build takes 5-10 minutes (Chromium download)

---

## ✅ Success!

After deployment, you'll get a URL like:
- `https://pagecopier.onrender.com`
- `https://pagecopier.up.railway.app`
- `https://pagecopier.fly.dev`

Share this URL with anyone - it's live! 🎉

---

## 🔒 Optional: Add Custom Domain

Most platforms support custom domains:
1. Go to Settings → Custom Domains
2. Add your domain: `pagecopier.yourdomain.com`
3. Update DNS records as instructed
4. SSL automatically provisioned

---

## 📈 Monitoring

All platforms provide:
- Logs viewer
- Metrics (CPU, RAM, requests)
- Auto-restart on crash
- Health checks

---

Need help? Each platform has excellent documentation and support!
