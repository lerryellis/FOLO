# 🚀 Deployment Guide - FOLO to Vercel

## ✅ Status
- [x] Supabase MCP connected
- [x] Database schema ready
- [x] Web app built & tested
- [x] .env.local configured locally
- [ ] Deploy to Vercel (YOU ARE HERE)
- [ ] Android app ready for Google Play

---

## 🌐 Deploy Web App to Vercel (5 minutes)

### Step 1: Go to Vercel
Open: https://vercel.com/new

### Step 2: Import GitHub Repository
1. Click **"Import Project"**
2. Select **GitHub** as source
3. Find and click your repo: **`lerryellis/FOLO`**
4. Click **Import**

### Step 3: Configure Project
Fill in these settings:

| Field | Value |
|-------|-------|
| **Project Name** | `folo-web` (or your preference) |
| **Framework** | Next.js ✅ (auto-detected) |
| **Root Directory** | `web/` ← **IMPORTANT** |
| **Build Command** | `npm run build` ✅ (default) |
| **Output Directory** | `.next` ✅ (default) |

### Step 4: Add Environment Variables
Click **"Environment Variables"** and add:

```
NEXT_PUBLIC_SUPABASE_URL = https://buejpvvhelpdsjwglemt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_9QQhCFJE0GBECbxzIS1SdA_Q4Z-Cua6
```

⚠️ **Note:** These start with `NEXT_PUBLIC_` so they're exposed in the browser (safe, they're public keys)

### Step 5: Deploy
Click **"Deploy"** button and wait ~2-3 minutes

---

## 🎉 You're Live!

After deployment, Vercel will show:
```
✅ Production Deployment Ready
🔗 https://folo-web-xxxxx.vercel.app
```

**Your web app is now live!** 🎊

---

## 🔄 Set Up Database Schema

### Option A: Supabase Dashboard (Easiest)
1. Go to: https://supabase.com/dashboard
2. Select project: `buejpvvhelpdsjwglemt`
3. Click **SQL Editor**
4. Click **New Query**
5. Copy & paste entire contents of `supabase_schema.sql`
6. Click **Run**

### Option B: Using Supabase CLI
```bash
supabase db push
```

---

## 🧪 Test Your Deployment

### 1. Test Web App Connection
Go to: https://folo-web-xxxxx.vercel.app

You should see:
- ✅ App loads without errors
- ✅ No "Supabase connection failed" errors
- ✅ Page renders successfully

### 2. Test Sign Up
1. Click **Sign Up** (once you build auth UI)
2. Enter email & password
3. Should receive verification email
4. Verify and log in
5. Should see dashboard

### 3. Test Real-Time Sync
1. Open app on **Web**
2. Open app on **Android** (same user)
3. Add transaction on Web
4. Should appear on Android in real-time

---

## 📱 Deploy Android App

### Google Play Store
1. Create signed APK/AAB (in Android Studio)
2. Go to: https://play.google.com/console
3. Upload to **Internal Testing** first
4. Test on multiple devices
5. Submit to **Production** when ready

### For Beta Testing
Use **Google Play Beta** or **Firebase App Distribution**

---

## 🔐 Security Checklist

✅ `web/.env.local` - Not committed (in .gitignore)
✅ `android/local.properties` - Not committed (in .gitignore)
✅ Credentials in Vercel **Environment Variables** ✅
✅ Supabase **Row Level Security** enabled ✅
✅ Only public keys exposed in browser ✅

---

## 🆘 Troubleshooting

### "Build failed" on Vercel
```
Error: Cannot find module '@supabase/supabase-js'
```
**Fix:** Vercel needs to run `npm install` in `web/` folder
- Go to Vercel settings → **Root Directory** → Set to `web/`

### "Supabase connection failed"
```
Error: failed to connect to https://buejpvvhelpdsjwglemt.supabase.co
```
**Fix:** Check environment variables in Vercel dashboard
- Verify `NEXT_PUBLIC_SUPABASE_URL` is set correctly
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set correctly

### "Unauthorized" when signing up
```
Error: [401] Unauthorized
```
**Fix:** Check Supabase email authentication is enabled
1. Go to: Supabase Dashboard → Settings → Auth
2. Click **Providers** → **Email**
3. Toggle **Enable Email Authentication** ✅

### "Build succeeds but shows blank page"
**Fix:** 
1. Open DevTools (F12)
2. Check **Console** for errors
3. Check **Network** tab for failed requests
4. Verify env variables are set

---

## 📊 Monitoring

### Vercel Dashboard
- Monitor deployments at: https://vercel.com/dashboard
- View logs: Click deployment → **Logs**
- Check build time: Should be < 2 minutes

### Supabase Dashboard
- View API activity: https://supabase.com/dashboard
- Check real-time connections
- Monitor database queries

---

## 🚀 Next Steps

1. ✅ Web app deployed to Vercel
2. Create database schema (copy SQL to Supabase)
3. Build Auth screens (Phase 2)
4. Build Dashboard (Phase 3)
5. Deploy Android app to Google Play

See `docs/BUILD_PLAN.md` for full roadmap.

---

## 📞 Useful Links

| Resource | URL |
|----------|-----|
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **Supabase Dashboard** | https://supabase.com/dashboard |
| **GitHub Repo** | https://github.com/lerryellis/FOLO |
| **Your Web App** | https://folo-web-xxxxx.vercel.app |

---

**Questions? Check `SYNC_GUIDE.md` for concurrent dev workflow** 🚀
