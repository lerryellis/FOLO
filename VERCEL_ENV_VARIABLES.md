# 🔐 Vercel Environment Variables for FOLO

## Copy-Paste These Into Vercel Dashboard

When deploying to Vercel, add these exact environment variables:

---

## 📋 Environment Variables to Add

### Variable 1: Supabase URL
```
Name:  NEXT_PUBLIC_SUPABASE_URL
Value: https://buejpvvhelpdsjwglemt.supabase.co
```

### Variable 2: Supabase Anon Key
```
Name:  NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: sb_publishable_9QQhCFJE0GBECbxzIS1SdA_Q4Z-Cua6
```

---

## 🎯 Where to Add Them in Vercel

1. Go to: https://vercel.com/new
2. Import your FOLO repo
3. Scroll down to **"Environment Variables"** section
4. Click **"Add"** for each variable

### Visual Steps:
```
┌─────────────────────────────────────┐
│  Environment Variables              │
├─────────────────────────────────────┤
│ [Name]          [Value]        [×]  │
│ ┌──────────────┐┌──────────────┐   │
│ │ NEXT_PUBLIC_ │ │ https://...  │   │
│ │ SUPABASE_URL │ │              │   │
│ └──────────────┘└──────────────┘   │
│                                     │
│ [+ Add]                             │
│                                     │
│ ┌──────────────┐┌──────────────┐   │
│ │ NEXT_PUBLIC_ │ │ sb_publishab │   │
│ │ SUPABASE_... │ │ le_9QQh...   │   │
│ └──────────────┘└──────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

## ⚠️ Important Notes

### Why `NEXT_PUBLIC_` prefix?
- These are **public** (safe to expose in browser)
- Only the anon/public key (not the service key)
- Supabase RLS policies protect private data

### What NOT to Add
❌ `SUPABASE_SERVICE_ROLE_KEY` - NEVER expose this
❌ Database password - NEVER expose this
❌ Private API keys

---

## ✅ Verification Checklist

After adding variables in Vercel:

- [ ] Both variables added
- [ ] No typos in variable names
- [ ] Values copied exactly
- [ ] Variables are for **Production** environment
- [ ] Clicked **"Deploy"**

---

## 🧪 Test After Deployment

After Vercel deploys, test connection:

```bash
# Visit your app URL
https://folo-web-xxxxx.vercel.app

# Open DevTools (F12) → Console
# You should see:
✅ "[supabase] subscribed to..."
✅ or "Supabase connected"

# NOT:
❌ "Failed to connect to Supabase"
❌ "Unauthorized"
❌ undefined
```

---

## 🔄 Update Variables Later

If you need to change variables:

1. Go to: https://vercel.com/dashboard
2. Select **folo-web** project
3. Click **Settings** → **Environment Variables**
4. Edit and save
5. Vercel auto-redeploys with new variables

---

## 📋 Quick Reference

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://buejpvvhelpdsjwglemt.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_9QQhCFJE0GBECbxzIS1SdA_Q4Z-Cua6` |

---

**Ready to deploy? Go to https://vercel.com/new** 🚀
