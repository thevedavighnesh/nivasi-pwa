# 🚀 START HERE - Deploy to Render

**Your Nivasi app deployment in 6 simple steps**

---

## 🎯 Quick Steps (15 minutes)

### 1️⃣ Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2️⃣ Go to Render
👉 **https://render.com** → Sign up with GitHub

### 3️⃣ Deploy
- Click **"New +"** → **"Blueprint"**
- Connect your **nivasi** repository
- Click **"Apply"**
- ⏳ Wait 5 minutes

### 4️⃣ Set AUTH_URL
- Go to **nivasi-web** service
- Click **"Environment"** → Edit **AUTH_URL**
- Paste your app URL (like `https://nivasi-web.onrender.com`)
- Save (will redeploy)

### 5️⃣ Setup Database
```bash
# Get database URL from Render dashboard → nivasi-db → Connect
# Add to .env file:
DATABASE_URL=postgresql://...

# Run setup:
npm run setup-db
```

### 6️⃣ Test Your App
- Open: `https://nivasi-web.onrender.com`
- Sign up / Login
- ✅ Done!

---

## 📚 Detailed Guides

Need more help? Read these in order:

1. **RENDER_CHECKLIST.md** ⭐ ← Start here!
   - Step-by-step with screenshots
   - Troubleshooting tips
   - Quick reference

2. **RENDER_DEPLOYMENT_GUIDE.md**
   - Complete deployment guide
   - Advanced configuration
   - Monitoring & optimization

3. **NETLIFY_ISSUE.md**
   - Why Netlify didn't work
   - Platform comparison
   - Alternative options

---

## 🛠️ Useful Commands

```bash
# Check if database is ready
npm run check-db

# Setup database schema
npm run setup-db

# Local development
npm run dev

# Build for production
npm run build

# Type check
npm run typecheck
```

---

## 🆘 Quick Troubleshooting

### App not loading?
- Wait 30 seconds (free tier spin-up)
- Check Dashboard → nivasi-web → Logs

### Database errors?
```bash
npm run check-db
```

### Build failed?
- Check all code is pushed to GitHub
- Verify Node version 20 in render.yaml

---

## 💰 Free vs Paid

**Free Tier (Current):**
- ✅ Perfect for testing
- ⚠️ Spins down after 15 min (first load slow)
- ⚠️ Database limited to 90 days

**Starter Plan ($7/month):**
- ✅ Always on (no delays)
- ✅ Better performance
- ✅ Unlimited database

---

## ✅ Your Deployment Config

Already configured in your project:

- ✅ `render.yaml` - Deployment settings
- ✅ `database/schema.sql` - Database structure
- ✅ `setup-render-db.js` - Database setup script
- ✅ `check-db.js` - Database verification
- ✅ `Dockerfile` - Container config (backup)
- ✅ `.dockerignore` - Optimize builds

---

## 🎉 After Deployment

Your app will be live at:
```
https://nivasi-web.onrender.com
```

**Auto-deployment enabled!**
Every push to `main` branch automatically deploys.

---

## 📞 Need Help?

1. Read **RENDER_CHECKLIST.md** (most common issues covered)
2. Check Render logs (Dashboard → nivasi-web → Logs)
3. Render Discord: https://discord.gg/render
4. Render Docs: https://render.com/docs

---

**Ready? Follow RENDER_CHECKLIST.md step by step!**

⭐ Pro tip: Keep the checklist open while deploying
