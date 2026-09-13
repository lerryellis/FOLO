# 🔄 Syncing Android & Web Development

**Problem:** You're building Android in Android Studio AND Web in VSCode/IDE simultaneously. How do you keep them in sync?

**Solution:** Feature-based branch workflow with shared backend + feature parity tracking.

---

## 📋 Quick Reference

| Scenario | Solution |
|----------|----------|
| **Working on same feature in both** | Use feature branch (e.g., `feature/auth`) |
| **Android done, Web behind** | Check `PROGRESS.md`, implement on Web |
| **Web done, Android behind** | Implement on Android, test with Web |
| **Data not syncing between apps** | Both apps must share same Supabase project |
| **Need both running at once** | Terminal 1: Web dev server, Android Studio separate |

---

## 🚀 Daily Workflow

### Morning: Start Session
```bash
# Pull latest changes
git pull origin main

# Check what needs doing
cat docs/PROGRESS.md

# Create feature branch
git checkout -b feature/transactions
```

### During Development

#### Terminal 1: Web App
```bash
cd web
npm run dev  # Runs on http://localhost:3000
```

#### Android Studio: Android App
```
Open FOLO/android project in Android Studio
Click "Run" or press Shift+F10
```

#### Shared Backend
Both apps automatically use the same Supabase project (credentials in `.env.local` and `local.properties`)

---

## ✅ Feature Parity Workflow

### When Starting a New Feature

1. **Create feature branch**
   ```bash
   git checkout -b feature/goals
   ```

2. **Update PROGRESS.md** (mark In Progress)
   ```markdown
   ## Feature: Goals
   
   ### Android 🟡 In Progress
   - [ ] Create goal screen
   - [ ] Goal list screen
   - [ ] Progress tracking
   
   ### Web 🔲 Not Started
   - [ ] Create goal page
   - [ ] Goals list page
   - [ ] Progress charts
   ```

3. **Build on Android**
   - Create screens in Kotlin/Compose
   - Test with Supabase (will work automatically if Web also connects)
   - Commit: `git add android/ && git commit -m "feat(android): Goal screens"`

4. **Build on Web**
   - Create pages in Next.js/React
   - Use exact same Supabase queries
   - Commit: `git add web/ && git commit -m "feat(web): Goal pages"`

5. **Test Both Together**
   - Add goal on Android → See it on Web (real-time)
   - Add goal on Web → See it on Android (real-time)
   - Both show same data ✅

6. **Update PROGRESS.md** (mark Done)
   ```markdown
   ## Feature: Goals
   
   ### Android ✅ Done
   - [x] Create goal screen
   - [x] Goal list screen
   - [x] Progress tracking
   
   ### Web ✅ Done
   - [x] Create goal page
   - [x] Goals list page
   - [x] Progress charts
   
   ### Status: 🟩 Complete
   Date: 2026-09-20
   ```

7. **Merge to main**
   ```bash
   git add docs/PROGRESS.md
   git commit -m "feat: Goals (Android + Web complete)"
   git push origin feature/goals
   # Create PR and merge
   ```

---

## 🐛 Debugging Out-of-Sync Data

### Symptoms
- Data on Android ≠ Data on Web
- Changes don't appear immediately on other app
- New transactions visible on one app but not other

### Root Causes & Fixes

#### 1. Different Supabase Credentials
**Check:**
```bash
# Android: View android/local.properties
cat android/local.properties | grep supabase

# Web: View web/.env.local
cat web/.env.local | grep SUPABASE

# Both should show SAME URL and KEY
```

**Fix:** Update both to use same credentials from Supabase Dashboard

#### 2. App Not Subscribed to Real-Time
**Check:**
```kotlin
// Android: Verify subscription
supabaseClient.realtime.subscribe(CHANNEL) { /* update UI */ }

// Check Logcat for: "Listening to channel..."
```

```typescript
// Web: Verify subscription
const subscription = supabase
  .from('transactions')
  .on('*', payload => { /* update state */ })
  .subscribe()

// Check Console for: "[supabase] subscribed to..."
```

**Fix:** Make sure both apps have `.on('*')` listening to all changes

#### 3. Stale Cache / App Not Refreshing
**Fix for Android:**
```bash
# Clear app data
adb shell pm clear com.folo

# Restart app
```

**Fix for Web:**
```bash
# Hard refresh browser
Cmd/Ctrl + Shift + R

# Or clear cache
DevTools → Application → Clear Storage
```

#### 4. Transaction Sync Status
**Check DB:**
```sql
-- View all transactions
SELECT id, description, sync_status, created_at FROM transactions;

-- Should be SYNCED for both apps to see
```

**If stuck as PENDING:**
```sql
-- Manual sync (temporary)
UPDATE transactions SET sync_status = 'SYNCED' WHERE id = 'xxx';
```

---

## 📝 Git Workflow for Parallel Development

### Branch Strategy
```
main (always working, tested on both platforms)
  ↓
feature/auth (Android + Web in parallel)
  ├─ android/: Login screen + ViewModel
  ├─ web/: Login page + useAuth hook
  └─ Merge when BOTH done & tested
```

### Commit Pattern

**Isolated changes (one platform only):**
```bash
git add android/
git commit -m "feat(android): Add goal screen UI"

# Later, add web changes
git add web/
git commit -m "feat(web): Add goal page with charts"
```

**Features done together:**
```bash
# Both platforms have changes
git add android/ web/
git commit -m "feat: Goal creation (Android + Web)"
```

**Documentation updates:**
```bash
git add docs/PROGRESS.md
git commit -m "docs: Mark goal feature complete"
```

### Avoid Conflicts

✅ **DO:**
- Keep `android/` and `web/` changes **separate** in commits
- Merge `main` before starting new feature
- One developer per platform (if possible)

❌ **DON'T:**
- Edit both `android/local.properties` and `web/.env.local` in one commit
- Force push shared branches
- Merge without testing both platforms

---

## 🔐 Credential Management

### Setup (One-time)

**Android** → `android/local.properties`
```properties
supabase.url=https://YOUR_PROJECT.supabase.co
supabase.anon.key=YOUR_KEY
# gitignore: ✅ ignored
```

**Web** → `web/.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_KEY
# gitignore: ✅ ignored
```

### Verify Both Use Same Project
```bash
# Android credential
grep "supabase.url" android/local.properties

# Web credential
grep "SUPABASE_URL" web/.env.local

# Both should end with same PROJECT_ID: https://PROJECT_ID.supabase.co
```

---

## 🧪 Testing Workflow

### Before Committing
- [ ] Feature works on **Android**
- [ ] Feature works on **Web**
- [ ] Real-time sync works (change on Android → see on Web, vice versa)
- [ ] No TypeScript errors on Web (`npm run type-check`)
- [ ] No build errors on Android (check Logcat)

### Test Checklist Example: Transactions
```
[ ] Add transaction on Android
    → Web shows it immediately
    
[ ] Add transaction on Web
    → Android shows it immediately
    
[ ] Edit transaction on Android
    → Web displays updated amount
    
[ ] Delete transaction on Web
    → Android list is updated
    
[ ] Go offline on Android
    → Can still add transactions
    
[ ] Go back online on Android
    → Changes sync to Supabase & Web
```

---

## 🔄 Syncing Process Diagram

```
┌─────────────────────────────────────────────────────┐
│          Your Feature Branch (feature/auth)          │
└─────────────────────────────────────────────────────┘
                    ↙              ↘
    ┌──────────────────┐    ┌──────────────────┐
    │  Android Studio  │    │  VS Code / IDE   │
    │  (Kotlin+Compose)│    │ (Next.js+React)  │
    └──────────────────┘    └──────────────────┘
              ↓                      ↓
        LoginScreen            LoginPage
        AuthViewModel          useAuth hook
              ↓                      ↓
        [Test signing up]     [Test signing up]
              ↓                      ↓
    ┌──────────────────────────────────────┐
    │  SAME SUPABASE PROJECT               │
    │  Both apps see same users/data       │
    │  Real-time subscriptions active      │
    └──────────────────────────────────────┘
              ↑                      ↑
        ✅ Works!           ✅ Works!
```

---

## 📊 Progress Tracking

### Where to Find Status
File: `docs/PROGRESS.md`

Shows:
- Which features are done on Android
- Which features are done on Web
- Which are in progress
- Overall completion %

### How to Update
```bash
# After implementing feature on Android
# Edit docs/PROGRESS.md
# Mark: Android ✅ Done, Web 🔲 Not Started

# After implementing on Web
# Update: Web ✅ Done
# Change status to: 🟩 Both Complete

git add docs/PROGRESS.md
git commit -m "docs: Update feature status"
```

---

## 🚨 Common Issues & Fixes

### Issue: "Port 3000 already in use" (Web won't start)
```bash
# Kill the process using port 3000
lsof -i :3000
kill -9 <PID>

# Or use a different port
npm run dev -- -p 3001
```

### Issue: "Android can't connect to Supabase"
```bash
# Check credentials
cat android/local.properties

# Verify in Supabase Dashboard
# Settings → API → Check URL and Key match

# Check network
# Emulator: Make sure it has internet
# Device: Verify WiFi/cellular connected
```

### Issue: "Gradle sync fails"
```bash
# In Android Studio:
File → Sync Now

# Or terminal:
cd android
./gradlew clean build
```

### Issue: "Web shows old data"
```bash
# Hard refresh browser
Cmd/Ctrl + Shift + R

# Or clear storage
DevTools → Application → Clear Storage
```

### Issue: "Both apps show different data"
```bash
# Check Supabase credentials match
grep supabase.url android/local.properties
grep SUPABASE_URL web/.env.local

# Both should show SAME project URL
```

---

## 📚 Related Files

- **BUILD_PLAN.md** — Full development roadmap
- **PROGRESS.md** — Feature parity tracker (check this daily!)
- **README.md** — Main project overview
- **ARCHITECTURE_REFERENCE.md** — Design patterns

---

## 🎯 Next Steps

1. **Open both projects**
   ```bash
   # Web
   cd web && npm run dev
   
   # Android (in Android Studio)
   Open android/ folder
   ```

2. **Test connection**
   - Sign up on Web
   - Sign in on Android
   - Verify same user data appears

3. **Start building Phase 2 (Auth)**
   - Follow BUILD_PLAN.md
   - Update PROGRESS.md
   - Test on both platforms
   - Commit and push

---

**Keep PROGRESS.md updated as you build!** 🚀
