# 🎯 FOLO - Full-Stack Financial Budget & Goal Planner

A modern **full-stack financial app** with Android (Kotlin) and Web (Next.js) frontends, sharing a **Supabase backend** for real-time sync, offline support, and comprehensive budget tracking.

---

## 📱 Platforms

| Platform | Stack | Status |
|----------|-------|--------|
| **Android** | Kotlin + Jetpack Compose + Room + Supabase | 🚀 Building |
| **Web** | Next.js 14 + React 18 + TypeScript + TailwindCSS | 🚀 Building |
| **Backend** | Supabase (PostgreSQL + Auth + Realtime) | ✅ Ready |

---

## 🎯 Features

- 💰 Budget creation and management (income, bills, expenses, savings, debt)
- 📊 Budget vs Actual tracking with visual comparisons
- 🎯 Financial goals (savings targets and debt payoff)
- 💾 Offline-first with real-time sync when online
- 🔄 Multi-device synchronization (Android ↔ Web)
- 🔐 Secure authentication and data privacy
- 📈 Transaction history and analytics
- 🌍 Works on phone, tablet, and desktop

---

## 📁 Project Structure

```
FOLO/
├── android/                    # 📱 Android App (Kotlin + Compose)
│   ├── app/src/main/
│   │   ├── java/com/folo/
│   │   │   ├── data/          # Repositories, DAOs
│   │   │   ├── domain/        # Models, UseCases
│   │   │   ├── ui/            # Screens, ViewModels, Components
│   │   │   └── di/            # Hilt modules
│   │   └── res/
│   ├── build.gradle.kts
│   └── local.properties        # 🔐 Supabase credentials
│
├── web/                        # 🌐 Web App (Next.js + React)
│   ├── app/
│   │   ├── (auth)/            # Login, Signup pages
│   │   ├── (dashboard)/       # Protected routes
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── forms/
│   │   └── ui/
│   ├── lib/
│   │   ├── supabase.ts        # Supabase client
│   │   ├── hooks/             # Custom React hooks
│   │   └── utils/
│   ├── package.json
│   ├── .env.local             # 🔐 Supabase credentials
│   └── next.config.js
│
├── docs/
│   ├── BUILD_PLAN.md          # Full development roadmap
│   ├── PROGRESS.md            # Feature parity tracker
│   ├── GETTING_STARTED.md     # Setup instructions
│   ├── ARCHITECTURE_REFERENCE.md
│   └── ...
│
├── supabase_schema.sql        # Database schema
├── FOLO.code-workspace        # VSCode workspace for both projects
├── .gitignore
└── README.md (you are here)
```

---

## 🚀 Quick Start

### 1️⃣ Clone & Setup

```bash
# Clone the repo
git clone https://github.com/lerryellis/FOLO.git
cd FOLO

# Install dependencies (both apps)
cd web && npm install
cd ../android && ./gradlew sync
```

### 2️⃣ Configure Supabase

1. Create account at https://supabase.com
2. Run `supabase_schema.sql` in SQL Editor
3. Get credentials from **Settings → API**

### 3️⃣ Add Credentials

**Android** → `android/local.properties`:
```properties
supabase.url=https://YOUR_PROJECT_ID.supabase.co
supabase.anon.key=YOUR_ANON_KEY_HERE
```

**Web** → `web/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

### 4️⃣ Run Both Apps

```bash
# Terminal 1: Web app
cd web
npm run dev
# → Open http://localhost:3000

# Terminal 2: Android (in Android Studio)
# Click "Run" or press Shift+F10
```

---

## 📊 Development Workflow

### Working Concurrently on Both Apps

Since you're building **Android and Web simultaneously**, here's the best workflow:

#### Option A: Parallel Development (Recommended)
```
┌─────────────────┬─────────────────┐
│  Android Studio │  VS Code / IDE  │
│  (Android app)  │   (Web app)     │
│                 │                 │
│ Built in:       │ Built in:       │
│ Kotlin/Compose  │ Next.js/React   │
└─────────────────┴─────────────────┘
         ↓              ↓
    Shared Supabase Backend
```

**Workflow per feature:**
1. **Branch:** `git checkout -b feature/auth`
2. **Build Android:** Implement auth screen in Kotlin/Compose
3. **Build Web:** Implement same feature in Next.js/React
4. **Test both** against the same Supabase instance
5. **Commit:** `git commit -m "Feature: Auth (Android + Web)"`
6. **Push:** `git push origin feature/auth`
7. **PR & Merge**

#### Option B: VSCode Workspace (All in One IDE)
```bash
code FOLO.code-workspace
```
This opens both `android/` and `web/` folders side-by-side, perfect for:
- Quick navigation between platforms
- Comparing implementations
- Running build tasks

---

## 🔄 Syncing Between Android & Web

### Problem: Features on Android but not Web

**Solution:**
1. Check `docs/PROGRESS.md` for feature status
2. Implement missing feature on other platform
3. Both platforms must have identical features
4. Update PROGRESS.md when done

### Problem: Data Not Syncing in Real-Time

**Debug:**
1. Check both apps have **same Supabase credentials**
2. Verify Supabase subscriptions are active
3. Check browser console (Web) or Logcat (Android)
4. Both apps must query the same tables

### Problem: Conflicting Git Changes

**Strategy:**
- Keep `android/` and `web/` **isolated** in code
- Only shared file: `supabase_schema.sql` (rarely changes)
- Merge conflicts should be rare
- Use feature branches for parallel work

---

## 📝 Git Workflow for Concurrent Development

### Commit Pattern
```bash
# Work on Android
cd android && [make changes]
git add android/
git commit -m "feat(android): Add transaction screen"

# Work on Web
cd ../web && [make changes]
git add web/
git commit -m "feat(web): Add transaction page"

# Both together
git commit -m "feat: Transaction feature (Android + Web)"
```

### Branch Names
```
feature/auth              # Feature branch
feature/dashboard-android # Android-specific
feature/dashboard-web     # Web-specific
feature/dashboard         # Both at once
```

### Keep Branches Updated
```bash
# Before starting new feature
git checkout main
git pull origin main

# Then create your feature branch
git checkout -b feature/your-feature
```

---

## 🛠️ Build Tasks

### Web (Next.js)
```bash
cd web

npm run dev       # Dev server (port 3000)
npm run build     # Production build
npm run start     # Run production build
npm run type-check # Check TypeScript errors
```

### Android (Kotlin)
```bash
# In Android Studio:
- Build → Build APK
- Run → Run App
- Logcat → View logs

# Or terminal:
cd android
./gradlew build          # Build
./gradlew installDebug   # Install on device
./gradlew connectedTest  # Run tests
```

---

## 📊 Feature Parity Tracking

Check `docs/PROGRESS.md` to track which features are done on which platform:

```markdown
## Feature: Authentication

### Android ✅
- [x] Login screen
- [x] Signup flow
- [x] Session persistence

### Web ✅
- [x] Login page
- [x] Signup form
- [x] Session persistence

### Status: 🟩 Complete
```

---

## 🔐 Environment Variables

### Android (`android/local.properties`)
```properties
# Supabase credentials (never commit!)
supabase.url=YOUR_URL
supabase.anon.key=YOUR_KEY
```

### Web (`web/.env.local`)
```
# Must start with NEXT_PUBLIC_ to be accessible in browser
NEXT_PUBLIC_SUPABASE_URL=YOUR_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_KEY
```

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| `docs/BUILD_PLAN.md` | Full development roadmap with phases |
| `docs/PROGRESS.md` | Feature parity tracker |
| `docs/ARCHITECTURE_REFERENCE.md` | Architecture & design patterns |
| `docs/GETTING_STARTED.md` | Step-by-step setup |
| `docs/ANDROID_SETUP_GUIDE.md` | Android-specific config |

---

## 🧪 Testing Both Platforms

### Test Checklist per Feature
- [ ] Feature works on **Android**
- [ ] Feature works on **Web**
- [ ] Data is **identical** on both
- [ ] Real-time sync works (change on one, see on other)
- [ ] **Offline mode** works (Android)
- [ ] **Error handling** tested

### Example: Testing Auth
```
1. Sign up on Web → See new user in Supabase
2. Log in on Android → Same user data appears
3. Change password on Web → Can't log in on Android with old password
4. Log in on Android with new password → Success ✅
```

---

## 🚀 Deployment

### Web (Next.js)
```bash
# Deploy to Vercel (recommended)
npm install -g vercel
vercel

# Or build and host yourself
npm run build
npm start
```

### Android
```bash
# Build release APK
cd android
./gradlew bundleRelease

# Upload to Google Play Console
```

---

## ⚠️ Important Notes

✅ **Do's:**
- Keep both apps in **same git repo** (monorepo)
- Test features on **both platforms** before merging
- Update `PROGRESS.md` as you build
- Use **same Supabase credentials** for both apps
- Commit `docs/` and `.gitignore`, not credentials

❌ **Don'ts:**
- ❌ Commit `android/local.properties`
- ❌ Commit `web/.env.local`
- ❌ Build features on only one platform
- ❌ Rebase shared branches (use merge)

---

## 📖 Next Steps

1. **Read:** `docs/BUILD_PLAN.md` - Full development roadmap
2. **Setup:** `docs/GETTING_STARTED.md` - Configure Supabase
3. **Start Phase 1:** Create both projects, test connection
4. **Track Progress:** Update `docs/PROGRESS.md` as you build

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Gradle sync fails (Android) | Check Java version (11+), SDK path |
| Port 3000 in use (Web) | `lsof -i :3000` then `kill -9 <PID>` |
| Can't connect to Supabase | Verify credentials in `.env.local` / `local.properties` |
| Data not syncing | Check both apps use **same** Supabase project |
| Git conflicts | Run `git pull origin main`, resolve conflicts |

---

## 📞 Resources

- **Supabase Docs:** https://supabase.com/docs
- **Android Docs:** https://developer.android.com
- **Next.js Docs:** https://nextjs.org/docs
- **React Docs:** https://react.dev

---

**Ready to build? Open the [BUILD_PLAN.md](docs/BUILD_PLAN.md)** 🚀
