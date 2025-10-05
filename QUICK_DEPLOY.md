# ⚡ Quick Deploy - Nivasi PWA

**Time Required:** 10 minutes  
**Cost:** Free (using free tiers)

---

## 🚀 Fastest Path: Vercel + Neon

### Step 1: Pre-Deployment Check (1 min)

```bash
node deploy-check.js
```

If all checks pass ✅, continue!

---

### Step 2: Setup Database (3 min)

1. **Create Neon Database:**
   - Go to: https://neon.tech
   - Sign up (free)
   - Create project: "nivasi"
   - Copy connection string

2. **Run Schema:**
   - Neon Dashboard → SQL Editor
   - Copy content from `database/schema.sql`
   - Click "Run"

---

### Step 3: Push to GitHub (2 min)

```bash
# In your project directory
git init
git add .
git commit -m "Nivasi PWA - Initial deployment"
git branch -M main

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/nivasi-pwa.git
git push -u origin main
```

---

### Step 4: Deploy to Vercel (4 min)

1. **Go to Vercel:**
   - https://vercel.com
   - Sign up with GitHub
   - Click "New Project"

2. **Import Repository:**
   - Select your nivasi-pwa repo
   - Click "Import"

3. **Configure:**
   - Framework: **Other**
   - Build Command: `npm run build`
   - Output: `build/client`

4. **Environment Variables:**

   Add these 3 variables:

   ```env
   DATABASE_URL
   ```
   Paste your Neon connection string (add `?sslmode=require` at the end)

   ```env
   AUTH_SECRET
   ```
   Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

   ```env
   AUTH_URL
   ```
   Leave empty for now, will update after deployment

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Copy deployment URL

6. **Update AUTH_URL:**
   - Settings → Environment Variables
   - Edit AUTH_URL → Add your Vercel URL: `https://your-app.vercel.app`
   - Deployments → Redeploy

---

## ✅ Test Your PWA

1. **Visit your URL**
2. **Install PWA:**
   - Look for install button (⊕) in browser
   - Click "Install"
3. **Test offline:**
   - Open app
   - Disconnect internet
   - Should still work!

---

## 🎉 Done!

Your PWA is live at: `https://your-app.vercel.app`

**Share with users:**
- Desktop: Install via browser button
- Mobile: "Add to Home Screen"

---

## 🐛 Issues?

**Build failed?**
- Check Node.js version (need 20+)
- Verify all dependencies in package.json

**Can't connect to database?**
- Ensure connection string ends with `?sslmode=require`
- Test connection in Neon dashboard

**App loads but errors?**
- Check Vercel logs
- Verify AUTH_SECRET is set
- Ensure AUTH_URL matches deployment URL

---

## 📚 Need More Help?

See full guides:
- **DEPLOY_PWA.md** - Complete deployment guide
- **PWA_SETUP.md** - PWA features and customization
- **DEPLOY_NOW.md** - Alternative deployment options

---

**Total Time:** ~10 minutes  
**Total Cost:** $0 (free tier)  
**Status:** Production-ready PWA! 🎊
