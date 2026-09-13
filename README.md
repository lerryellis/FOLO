# 🎯 FOLO - Financial Budget & Goal Planner

A modern Android app for personal finance management with Supabase real-time sync, offline-first support, and comprehensive budget tracking.

## 📱 Features

- 💰 Budget creation and management (income, bills, expenses, savings, debt)
- 📊 Budget vs Actual tracking with visual comparisons
- 🎯 Financial goals (savings targets and debt payoff)
- 💾 Offline-first with real-time sync when online
- 🔄 Multi-device synchronization
- 🔐 Secure authentication and data privacy
- 📈 Transaction history and analytics

---

## 🚀 Quick Start

### 1. Start Here
- Read: [INDEX.md](INDEX.md) - Complete file guide
- Read: [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Project overview

### 2. Follow Setup Guide
- Read: [GETTING_STARTED.md](GETTING_STARTED.md) - 30-minute setup guide

### 3. Understand Architecture
- Read: [ARCHITECTURE_REFERENCE.md](ARCHITECTURE_REFERENCE.md) - Design patterns & diagrams

---

## 📂 Project Structure

```
FOLO/
├── README.md (you are here)
├── INDEX.md (file guide)
├── PROJECT_SUMMARY.md (overview)
├── GETTING_STARTED.md (setup guide)
├── ARCHITECTURE_REFERENCE.md (architecture)
├── ANDROID_SETUP_GUIDE.md (Android config)
│
├── supabase_schema.sql (database schema)
├── android_app_models.kt (Kotlin models)
├── android_supabase_setup.kt (repositories)
└── android_viewmodels_screens.kt (UI layer)
```

---

## 💻 Tech Stack

- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Mobile:** Android Studio + Kotlin
- **UI:** Jetpack Compose + Material 3
- **Architecture:** MVVM + Clean Architecture
- **Local DB:** Room (SQLite)
- **Async:** Kotlin Coroutines + Flow
- **DI:** Hilt

---

## 📋 Implementation Status

### ✅ Completed
- Database schema with 7 tables
- All domain models
- Repository pattern
- Authentication architecture
- Dashboard screen
- Transaction handling
- Goals tracking structure
- Complete documentation

### ⏳ Next Phase (You'll Build)
- Room entities & DAOs
- Hilt dependency injection
- Login/Signup UI screens
- Transaction screens
- Goals screens
- Background sync worker
- Charts & visualizations

---

## 🎯 30-Minute Setup

```bash
# 1. Set up Supabase (10 min)
- Create account at https://supabase.com
- Run supabase_schema.sql in SQL Editor
- Get credentials (URL & Anon Key)

# 2. Create Android Project (5 min)
- Open Android Studio
- New Project → Empty Activity
- Name: FOLO, Package: com.folo

# 3. Copy Code (10 min)
- Create folder structure
- Copy *.kt files to appropriate locations
- Update build.gradle.kts
- Add local.properties with credentials

# 4. Run (5 min)
- Gradle sync
- Connect device/emulator
- Run app
```

---

## 📚 Documentation

| File | Purpose | Time |
|------|---------|------|
| [INDEX.md](INDEX.md) | File guide & structure | 5 min |
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | Project overview & stack | 10 min |
| [GETTING_STARTED.md](GETTING_STARTED.md) | Step-by-step setup | 15 min |
| [ARCHITECTURE_REFERENCE.md](ARCHITECTURE_REFERENCE.md) | Diagrams & patterns | 20 min |
| [ANDROID_SETUP_GUIDE.md](ANDROID_SETUP_GUIDE.md) | Android project structure | 5 min |

---

## 🏗️ Architecture Overview

```
Jetpack Compose UI
      ↓
ViewModels (StateFlow + Flow)
      ↓
Repositories (Offline-First)
      ↓
   Room (Local) ←→ Supabase (Cloud)
```

**Key Features:**
- 🟢 Offline-first (works without internet)
- 🟡 Background sync (uploads happen async)
- 🔴 Real-time (changes sync across devices)
- 🟣 Type-safe (Kotlin + sealed classes)

---

## 📁 File Locations (After Setup)

```
BudgetPlanner/app/src/main/java/com/folo/
├── data/
│   ├── local/ → Room database
│   ├── remote/ → Supabase API
│   └── repository/ → Business logic
├── domain/
│   ├── models/ → Data classes
│   └── usecases/ → Calculations
├── ui/
│   ├── screens/ → Jetpack Compose screens
│   ├── viewmodel/ → State management
│   ├── components/ → Reusable UI components
│   └── theme/ → Colors, fonts, styles
├── di/ → Dependency injection
└── util/ → Utilities & extensions
```

---

## 🔐 Security

✅ Supabase Auth (email/password)
✅ Row-level security (RLS) - users only see own data
✅ HTTPS encryption
✅ JWT token management
✅ No passwords stored locally

---

## 📊 Data Models

### Core Models
- **User** - Profile info
- **BudgetPeriod** - Monthly budgets (Sept 1-30, etc.)
- **Category** - Income/Bills/Expenses/Savings/Debt
- **BudgetItem** - Individual budget line
- **Transaction** - Income/expense entry
- **FinancialGoal** - Savings/debt goal
- **BudgetSummary** - Dashboard calculations

---

## 🧪 Testing Your Setup

After creating the Android project:

```kotlin
// In any composable
viewModelScope.launch {
    try {
        val user = supabaseClient.auth.currentUserOrNull()
        if (user != null) println("✅ Connected!")
        else println("❌ Not authenticated")
    } catch (e: Exception) {
        println("❌ Error: ${e.message}")
    }
}
```

---

## 📈 What's Included

### Backend
✅ PostgreSQL database
✅ Email authentication
✅ Real-time subscriptions
✅ Row-level security
✅ Free tier available

### Android App
✅ Kotlin + Compose
✅ MVVM architecture
✅ Room for offline
✅ Supabase integration
✅ Real-time sync
✅ Error handling

### Features
✅ Budget management
✅ Transaction logging
✅ Goal tracking
✅ Sync across devices
✅ Offline support

---

## 🚦 Next Steps

1. **Read Documentation**
   - Start with [INDEX.md](INDEX.md)
   - Then [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

2. **Set Up Development Environment**
   - Follow [GETTING_STARTED.md](GETTING_STARTED.md)
   - Create Supabase project
   - Create Android project

3. **Understand Architecture**
   - Review [ARCHITECTURE_REFERENCE.md](ARCHITECTURE_REFERENCE.md)
   - Study the code files

4. **Start Implementing**
   - Create Room entities & DAOs
   - Set up Hilt dependency injection
   - Build Login screen
   - Build Dashboard screen
   - Add more features incrementally

---

## ❓ Common Questions

**Q: Do I need all these files?**
A: No! Start with dashboard. Other features can be added incrementally.

**Q: Can I add a web app later?**
A: Yes! The Supabase backend supports web, iOS, etc.

**Q: What if users go offline?**
A: Room database stores everything. When back online, background sync uploads changes.

**Q: Is Supabase free?**
A: Yes! Generous free tier. Upgrade as you grow.

---

## 📞 Resources

- **Supabase Docs:** https://supabase.com/docs
- **Android Docs:** https://developer.android.com
- **Jetpack Compose:** https://developer.android.com/jetpack/compose
- **Kotlin Coroutines:** https://kotlinlang.org/docs/coroutines-overview.html

---

## ✅ Success Criteria

Your app is working when:
- ✅ Users can sign up and login
- ✅ Dashboard displays budget summary
- ✅ Can add transactions
- ✅ Transactions appear in dashboard
- ✅ Budget vs actual calculations work
- ✅ Goals can be created and tracked
- ✅ Data syncs to Supabase
- ✅ Works offline with local caching

---

**Ready to build? Start with [INDEX.md](INDEX.md)** 🚀

---

## 📝 License

Personal use - Modify as needed for your project

## 🙏 Acknowledgments

Built with modern Android development patterns and best practices.
