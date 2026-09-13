# 🚀 FOLO Full-Stack Build Plan

**Status:** Ready to Build  
**Date:** 2026-09-13  
**Platforms:** Android (Kotlin) + Web (Next.js)  
**Backend:** Supabase (Shared)

---

## 📋 Quick Reference

| File | Purpose |
|------|---------|
| `PROGRESS.md` | Feature parity tracking (Android ↔ Web) |
| `FOLO.code-workspace` | VSCode workspace with all folders |
| `.vscode/tasks.json` | Build tasks for both platforms |
| `.vscode/settings.json` | Unified editor settings |
| This file | Build plan & architecture |

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────┐
│             SUPABASE (Shared Backend)            │
│ PostgreSQL + Auth + Realtime + Row-Level Security│
└──────────────────────────────────────────────────┘
                    ↙              ↘
        ┌─────────────────┐   ┌──────────────────┐
        │   Android App   │   │   Web App        │
        ├─────────────────┤   ├──────────────────┤
        │ Kotlin+Compose  │   │ Next.js+React    │
        │ Room (Local DB) │   │ TailwindCSS      │
        │ Flow+ViewModel  │   │ React Hooks      │
        │ Hilt DI         │   │ Zustand (State)  │
        │ Package: com.fo │   │ TypeScript       │
        └─────────────────┘   └──────────────────┘
```

---

## 🎯 Build Phases

### Phase 1️⃣ Setup & Infrastructure (Today)
**Goal:** Both projects initialized and connected to Supabase

#### Android
- [ ] Create Android Studio project
- [ ] Configure Gradle dependencies
- [ ] Create package structure (com.folo)
- [ ] Set up Supabase client
- [ ] Create local.properties with credentials

#### Web
- [ ] Create Next.js project
- [ ] Install dependencies
- [ ] Create project structure
- [ ] Set up @supabase/supabase-js
- [ ] Create .env.local with credentials

#### Both
- [ ] Test Supabase connection
- [ ] Verify authentication works
- [ ] Commit to git

**Estimated Time:** 2-3 hours

---

### Phase 2️⃣ Authentication (Days 1-3)
**Goal:** Users can sign up, log in, and stay logged in

#### Android Features
- [ ] LoginScreen UI (Compose)
- [ ] SignupScreen UI (Compose)
- [ ] AuthViewModel (state management)
- [ ] Password reset flow
- [ ] Session persistence

#### Web Features
- [ ] LoginPage (React+Next.js)
- [ ] SignupPage (React+Next.js)
- [ ] useAuth() hook
- [ ] Password reset flow
- [ ] Session persistence in cookies

#### Testing
- [ ] Test sign up → receive verification email
- [ ] Test login with valid credentials
- [ ] Test login with invalid credentials
- [ ] Test logout
- [ ] Test session persistence (refresh page)
- [ ] Test on both platforms simultaneously

**Estimated Time:** 3-4 days

---

### Phase 3️⃣ Dashboard (Days 4-5)
**Goal:** Display budget summary and financial overview

#### Android Features
- [ ] DashboardScreen (main content)
- [ ] BudgetOverviewCards (Income, Spent, Left)
- [ ] CategoryBreakdown (pie chart or list)
- [ ] MonthNavigation (prev/next month)
- [ ] Load data from Supabase

#### Web Features
- [ ] /dashboard page
- [ ] Overview cards (same as Android)
- [ ] Category breakdown chart
- [ ] Month navigation
- [ ] Real-time data sync

#### Data Flow
- [ ] Dashboard query budget summary from DB
- [ ] Calculate totals (income, spent, remaining)
- [ ] Handle month selection
- [ ] Display category breakdown
- [ ] Handle loading & error states

**Estimated Time:** 2-3 days

---

### Phase 4️⃣ Transactions (Days 6-8)
**Goal:** Users can record and view all financial transactions

#### Android Features
- [ ] AddTransactionScreen (form)
- [ ] TransactionListScreen (scrollable list)
- [ ] Transaction filters (by date, category)
- [ ] Edit transaction
- [ ] Delete transaction
- [ ] Real-time list updates

#### Web Features
- [ ] /transactions/new (add form)
- [ ] /transactions (list page)
- [ ] Transaction table with sorting/filtering
- [ ] Edit transaction modal
- [ ] Delete confirmation
- [ ] Real-time updates

#### Data Operations
- [ ] Insert transaction to Supabase
- [ ] Update transaction
- [ ] Delete transaction
- [ ] Query transactions by period
- [ ] Handle sync status (PENDING → SYNCED)

**Estimated Time:** 4-5 days

---

### Phase 5️⃣ Budget Management (Days 9-10)
**Goal:** Users can set budgets per category and track against actual

#### Android Features
- [ ] CreateBudgetScreen (new period)
- [ ] BudgetItemsScreen (set amounts per category)
- [ ] BudgetVsActualScreen (visual comparison)
- [ ] BudgetAlerts (overspending notification)

#### Web Features
- [ ] /budgets/new (create period)
- [ ] /budgets/[id] (edit items)
- [ ] Budget vs Actual chart
- [ ] Budget overview table
- [ ] Alert settings

#### Data Operations
- [ ] Create budget period (monthly)
- [ ] Set category budgets
- [ ] Calculate % spent vs budgeted
- [ ] Trigger alerts when > 80%
- [ ] Archive past periods

**Estimated Time:** 2-3 days

---

### Phase 6️⃣ Goals (Days 11-12)
**Goal:** Users can set financial goals and track progress

#### Android Features
- [ ] CreateGoalScreen (savings or debt goals)
- [ ] GoalsListScreen (view all goals)
- [ ] GoalDetailScreen (progress tracking)
- [ ] Goal progress chart

#### Web Features
- [ ] /goals/new (create goal)
- [ ] /goals (list)
- [ ] /goals/[id] (detail & progress)
- [ ] Goal progress visualization

#### Data Operations
- [ ] Create goal (type: SAVINGS or DEBT)
- [ ] Log goal progress (payments)
- [ ] Calculate % toward goal
- [ ] Archive completed goals
- [ ] Calculate estimated completion date

**Estimated Time:** 2-3 days

---

### Phase 7️⃣ Advanced Features (Days 13+)
**Optional enhancements**

#### Android
- [ ] Background sync worker (sync when online)
- [ ] Offline mode (works without internet)
- [ ] Charts (more visualization options)
- [ ] Data export (CSV, PDF)
- [ ] Settings screen (theme, notifications)

#### Web
- [ ] Advanced charts (Chart.js, Recharts)
- [ ] Data export (CSV, PDF)
- [ ] Settings page
- [ ] Dark mode support
- [ ] Mobile responsive design

**Estimated Time:** 5+ days

---

## 🛠️ Tech Stack Details

### Android
```kotlin
// Core
- Kotlin 1.9.20
- Android API 28+
- Gradle 8.2.0

// UI
- Jetpack Compose
- Material 3
- Navigation Compose

// State & Async
- Flow & StateFlow
- Kotlin Coroutines
- ViewModel & Lifecycle

// Local Storage
- Room Database
- DataStore (preferences)

// Remote
- Supabase Kotlin client
- Ktor HTTP client

// DI
- Hilt

// Background
- WorkManager
```

### Web
```typescript
// Framework
- Next.js 14+
- React 18+
- TypeScript 5+

// UI & Styling
- TailwindCSS
- Shadcn/ui components
- Lucide icons

// State
- React Hooks (useState, useEffect, useContext)
- Zustand (if complex state needed)

// HTTP
- @supabase/supabase-js
- TanStack Query (for data fetching)

// Forms
- React Hook Form
- Zod (validation)

// Build
- Turbopack (Next.js 14 bundler)
```

### Shared (Backend)
```sql
-- Database
- PostgreSQL 15+
- 7 tables with RLS

-- Auth
- Supabase Auth
- JWT tokens
- Email verification

-- Real-time
- Supabase Realtime
- WebSocket subscriptions

-- API
- REST API
- PostgreSQL functions
```

---

## 📁 Project Structure

```
FOLO/
├── android/                          # Android Studio Project
│   ├── app/src/main/
│   │   ├── java/com/folo/
│   │   │   ├── data/
│   │   │   │   ├── local/
│   │   │   │   │   ├── dao/          # Room DAOs
│   │   │   │   │   └── entity/       # Room entities
│   │   │   │   ├── remote/
│   │   │   │   │   └── SupabaseClient.kt
│   │   │   │   └── repository/       # Data layer
│   │   │   ├── domain/
│   │   │   │   ├── models/           # Data classes
│   │   │   │   └── usecases/         # Business logic
│   │   │   ├── ui/
│   │   │   │   ├── screens/          # Compose screens
│   │   │   │   ├── viewmodel/        # ViewModels
│   │   │   │   ├── components/       # Reusable UI
│   │   │   │   └── theme/            # Material 3 theme
│   │   │   ├── di/                   # Hilt modules
│   │   │   ├── util/                 # Extensions & utils
│   │   │   └── MainActivity.kt
│   │   ├── res/                      # Resources (layouts, drawables)
│   │   └── AndroidManifest.xml
│   ├── build.gradle.kts              # App gradle config
│   └── local.properties              # Supabase credentials
│
├── web/                              # Next.js Web Project
│   ├── app/
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Home page
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── reset-password/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── transactions/
│   │   │   ├── budgets/
│   │   │   ├── goals/
│   │   │   └── settings/
│   │   └── api/                      # API routes (optional)
│   ├── components/
│   │   ├── auth/                     # Auth components
│   │   ├── dashboard/                # Dashboard components
│   │   ├── forms/                    # Form components
│   │   └── ui/                       # Shadcn/ui components
│   ├── lib/
│   │   ├── supabase.ts               # Supabase client
│   │   ├── hooks/                    # Custom hooks
│   │   └── utils/                    # Utilities
│   ├── types/                        # TypeScript types
│   ├── styles/                       # Global styles
│   ├── public/                       # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── .env.local                    # Supabase credentials
│   └── .env.example
│
├── supabase/
│   └── schema.sql                    # Database schema
│
├── docs/
│   ├── README.md                     # Project overview
│   ├── GETTING_STARTED.md            # Setup guide
│   ├── ARCHITECTURE_REFERENCE.md     # Architecture
│   ├── ANDROID_SETUP_GUIDE.md        # Android specifics
│   ├── BUILD_PLAN.md                 # This file
│   └── API.md                        # API documentation
│
├── .vscode/
│   ├── tasks.json                    # Build tasks
│   ├── settings.json                 # Editor settings
│   └── launch.json                   # Debug configs
│
├── FOLO.code-workspace              # VSCode workspace
├── PROGRESS.md                       # Progress tracking
├── .gitignore
└── README.md
```

---

## 🔑 Key Credentials & Files

### Android (`android/local.properties`)
```properties
supabase.url=https://YOUR_PROJECT_ID.supabase.co
supabase.anon.key=YOUR_ANON_KEY_HERE
```

### Web (`web/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

**Get these from:** Supabase Dashboard → Settings → API

---

## 🚀 How to Use This Plan

### Day 1: Setup
```bash
# Follow Phase 1️⃣
# Create both Android and Web projects
# Test Supabase connection
# Commit to git
```

### Days 2-14: Development
```bash
# For each feature:
1. Update PROGRESS.md (mark as In Progress)
2. Build Android version → mark Done
3. Build Web version → mark Done
4. Commit & push
```

### Running Tasks in VSCode
```bash
# Open workspace
code FOLO.code-workspace

# Then use VSCode command palette:
Cmd/Ctrl + Shift + P → Tasks: Run Task

# Examples:
- 🤖 Android: Build Debug APK
- 🌐 Web: Dev Server
- 📊 Show Progress Report
- 📝 Git: Push to Origin
```

---

## 📊 Progress Tracking

### Template for Each Feature
```markdown
## Feature: Authentication

### Android ✅ Done
- [x] LoginScreen built
- [x] AuthViewModel implemented
- [x] Tested login flow

### Web ✅ Done
- [x] LoginPage built
- [x] useAuth hook created
- [x] Tested login flow

### Status: 🟩 Both Complete
Date: 2026-09-17
```

---

## ⚠️ Important Notes

### Supabase Setup (Required First)
Before building either app, you MUST:
1. Create Supabase project at https://supabase.com
2. Run `supabase_schema.sql` in SQL Editor
3. Get Project URL & Anon Key from Settings > API
4. Enable Email authentication
5. Verify your Redirect URLs are set

### Testing Both Platforms
- Always test the feature on BOTH platforms before moving on
- Features must work identically on Android and Web
- Test real-time sync across devices
- Test offline functionality (Android only initially)

### Git Commits
After completing each feature, commit:
```bash
git add .
git commit -m "Feature: [Phase] - [Feature Name] (Android + Web complete)"
git push origin main
```

---

## 📞 Troubleshooting

### Android Issues
- **Gradle sync fails:** Check Java version (11+), SDK path
- **Supabase connection error:** Verify local.properties credentials
- **Build error:** Check logcat in Android Studio

### Web Issues
- **Node modules conflict:** Delete node_modules and package-lock.json, run `npm install`
- **Port 3000 already in use:** Kill process or change port
- **Build fails:** Check TypeScript errors with `npm run type-check`

### Git Issues
- **Can't push:** Ensure you're on `main` branch and origin is set
- **Conflicts:** Pull latest with `git pull origin main`

---

## 🎯 Success Criteria

You're done when:

✅ **Both projects deployed**
- Android app on Google Play (or internal testing)
- Web app on Vercel (or your hosting)

✅ **All phases complete**
- Authentication working
- Dashboard showing real data
- Transactions CRUD functional
- Budgets set and tracked
- Goals created and tracked

✅ **Feature parity**
- Same features on Android and Web
- Same data shown on both
- Real-time sync working

✅ **Quality standards**
- No build errors
- Tested on multiple devices
- Code follows architecture patterns
- Documentation is current

---

## 📅 Timeline

| Phase | Days | End Date |
|-------|------|----------|
| Phase 1️⃣: Setup | 1 | 2026-09-13 |
| Phase 2️⃣: Auth | 3-4 | 2026-09-17 |
| Phase 3️⃣: Dashboard | 2-3 | 2026-09-20 |
| Phase 4️⃣: Transactions | 4-5 | 2026-09-25 |
| Phase 5️⃣: Budget | 2-3 | 2026-09-28 |
| Phase 6️⃣: Goals | 2-3 | 2026-10-01 |
| Phase 7️⃣: Advanced | 5+ | 2026-10-07+ |
| **Total** | **18-23 days** | **~2026-10-01** |

---

**Ready to build? Start with Phase 1️⃣ setup!** 🚀

