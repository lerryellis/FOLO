# FOLO Android App - Complete Getting Started Guide

## 🚀 Quick Start (30 minutes)

### Step 1: Set Up Supabase Backend

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Click "New Project"
   - Fill in details:
     - Project name: `BudgetPlannerDB`
     - Region: Choose closest to you
     - Database password: Generate strong password
   - Wait for project to initialize (~2 min)

2. **Get Your Credentials**
   - In Supabase dashboard, go to **Settings > API**
   - Copy:
     - `Project URL` (looks like `https://xxxxx.supabase.co`)
     - `Anon Public Key` (under "Key")
   - **Save these - you'll need them soon**

3. **Create Database Schema**
   - In Supabase, go to **SQL Editor**
   - Click **New Query**
   - Copy the entire content from `supabase_schema.sql`
   - Paste into the query editor
   - Click **Run**
   - Wait for confirmation (should take ~10 seconds)

4. **Enable Authentication**
   - Go to **Authentication > Providers**
   - Make sure "Email" is enabled (default)
   - Go to **URL Configuration**
   - Set "Redirect URLs" to:
     ```
     http://localhost:8081
     com.budgetplanner://auth-callback
     ```

---

### Step 2: Create Android Project

1. **Open Android Studio**
   - File → New → New Android Project
   
2. **Configure Project**
   - Template: **Empty Activity**
   - Name: `BudgetPlanner`
   - Package name: `com.budgetplanner`
   - Save location: `/Users/ellis/Documents/GitHub/BudgetPlanner`
   - Language: **Kotlin**
   - Minimum API: **28** (Android 9.0)
   - Build system: **Gradle (Kotlin DSL)**

3. **Wait for Gradle Sync**
   - Android Studio will automatically sync dependencies
   - Takes 2-3 minutes first time

---

### Step 3: Add Supabase Credentials

1. **Create `local.properties` file** (in project root, same level as `build.gradle`)
   ```properties
   supabase.url=https://YOUR_PROJECT_ID.supabase.co
   supabase.anon.key=YOUR_ANON_KEY_HERE
   ```

2. **Update `build.gradle.kts` (root project)**
   ```kotlin
   buildscript {
       repositories {
           google()
           mavenCentral()
       }
   }
   ```

---

### Step 4: Update Dependencies

Edit `app/build.gradle.kts`:

```kotlin
plugins {
    id("com.android.application")
    kotlin("android")
    kotlin("plugin.serialization")
    id("com.google.dagger.hilt.android")
    id("com.google.devtools.ksp")
}

android {
    namespace = "com.budgetplanner"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.budgetplanner"
        minSdk = 28
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = "11"
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.3"
    }
}

dependencies {
    // Core Android
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")

    // Jetpack Compose
    val composeBom = platform("androidx.compose:compose-bom:2024.09.00")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3:1.2.1")
    implementation("androidx.activity:activity-compose:1.9.2")

    // Lifecycle & ViewModel
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")

    // Navigation
    implementation("androidx.navigation:navigation-compose:2.8.2")

    // Room Database
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    ksp("androidx.room:room-compiler:2.6.1")

    // DataStore (for preferences)
    implementation("androidx.datastore:datastore-preferences:1.1.1")

    // Hilt Dependency Injection
    implementation("com.google.dagger:hilt-android:2.50")
    ksp("com.google.dagger:hilt-compiler:2.50")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")

    // Supabase
    implementation("io.github.supabase:supabase-kt:2.3.1")
    implementation("io.github.supabase:postgrest-kt:2.3.1")
    implementation("io.github.supabase:gotrue-kt:2.3.1")
    implementation("io.github.supabase:realtime-kt:2.3.1")

    // HTTP Client
    implementation("io.ktor:ktor-client-android:2.3.0")
    implementation("io.ktor:ktor-client-websockets:2.3.0")

    // JSON Serialization
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")

    // Logging
    implementation("io.github.aakira:napier:2.6.1")

    // WorkManager (for background sync)
    implementation("androidx.work:work-runtime-ktx:2.9.1")

    // Testing
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
```

---

### Step 5: Create Project Structure

Run these commands in terminal (from project root):

```bash
mkdir -p app/src/main/java/com/budgetplanner/{data,domain,ui,di,util}
mkdir -p app/src/main/java/com/budgetplanner/data/{local,remote,repository}
mkdir -p app/src/main/java/com/budgetplanner/data/local/{dao,entity}
mkdir -p app/src/main/java/com/budgetplanner/data/remote/{api,services}
mkdir -p app/src/main/java/com/budgetplanner/domain/models
mkdir -p app/src/main/java/com/budgetplanner/ui/{screens,components,theme,viewmodel,navigation}
mkdir -p app/src/main/res/drawable
```

---

### Step 6: Copy Core Files

1. **Copy domain models**
   - Copy content from `android_app_models.kt`
   - Create file: `app/src/main/java/com/budgetplanner/domain/models/Models.kt`
   - Paste content

2. **Copy Supabase setup & repositories**
   - Copy content from `android_supabase_setup.kt`
   - Create files:
     - `app/src/main/java/com/budgetplanner/data/remote/SupabaseClient.kt`
     - `app/src/main/java/com/budgetplanner/data/repository/*.kt`

3. **Copy ViewModels & Screens**
   - Copy content from `android_viewmodels_screens.kt`
   - Create files:
     - `app/src/main/java/com/budgetplanner/ui/viewmodel/*.kt`
     - `app/src/main/java/com/budgetplanner/ui/screens/DashboardScreen.kt`

---

### Step 7: Build and Run

1. **Sync Gradle**
   - Android Studio → Sync Now
   - Wait for build to complete (~3 minutes)

2. **Run App**
   - Connect Android device or start emulator
   - Click "Run" (green play button)
   - Select device
   - App should compile and launch

3. **First Launch Checklist**
   - ✅ Splash screen appears
   - ✅ Login screen loads
   - ✅ Can tap fields without crashes
   - ✅ No red error messages in console

---

## 📋 Implementation Phases

### Phase 1: Foundation (Days 1-2)
- [x] Supabase project setup
- [x] Android project creation
- [x] Database schema created
- [x] Core models defined
- [x] Dependencies added
- [ ] **TODO:** Create Room Database entities
- [ ] **TODO:** Create DAOs for local queries
- [ ] **TODO:** Create basic Dependency Injection setup

### Phase 2: Authentication (Days 3-4)
- [ ] **TODO:** Build Supabase Auth service
- [ ] **TODO:** Create AuthRepository implementation
- [ ] **TODO:** Build LoginScreen UI
- [ ] **TODO:** Build SignUpScreen UI
- [ ] **TODO:** Test login/signup flow
- [ ] **TODO:** Add session persistence

### Phase 3: Dashboard (Days 5-6)
- [ ] **TODO:** Create BudgetRepository implementation
- [ ] **TODO:** Implement budget summary calculations
- [ ] **TODO:** Complete DashboardScreen UI
- [ ] **TODO:** Add month navigation
- [ ] **TODO:** Display real data from Supabase

### Phase 4: Transactions (Days 7-8)
- [ ] **TODO:** Complete AddTransactionViewModel
- [ ] **TODO:** Build AddTransactionScreen UI
- [ ] **TODO:** Build TransactionListScreen
- [ ] **TODO:** Add transaction filtering/sorting
- [ ] **TODO:** Implement transaction sync

### Phase 5: Advanced Features (Days 9-10)
- [ ] **TODO:** Create FinancialGoals screens
- [ ] **TODO:** Build Goal progress tracking
- [ ] **TODO:** Add budget vs actual charts
- [ ] **TODO:** Implement background sync
- [ ] **TODO:** Add offline support

### Phase 6: Polish & Testing (Days 11-12)
- [ ] **TODO:** Write unit tests
- [ ] **TODO:** Write integration tests
- [ ] **TODO:** Fix bugs and edge cases
- [ ] **TODO:** Optimize performance
- [ ] **TODO:** Prepare for production

---

## 🔧 Key Files Reference

| File | Purpose |
|------|---------|
| `supabase_schema.sql` | Database schema (run in Supabase SQL Editor) |
| `android_app_models.kt` | All domain models |
| `android_supabase_setup.kt` | Supabase client & repositories |
| `android_viewmodels_screens.kt` | ViewModels & Compose screens |
| `app/build.gradle.kts` | Dependencies configuration |
| `app/src/main/AndroidManifest.xml` | App configuration |

---

## 🛠️ Development Tips

### Testing Supabase Connection
```kotlin
// In any composable or viewmodel
viewModelScope.launch {
    try {
        val user = supabaseClient.auth.currentUserOrNull()
        if (user != null) {
            println("✅ Connected! User: ${user.email}")
        } else {
            println("❌ Not authenticated")
        }
    } catch (e: Exception) {
        println("❌ Error: ${e.message}")
    }
}
```

### Common Issues & Fixes

**Issue:** "Cannot find symbol SupabaseClient"
- **Fix:** Make sure you created the file in correct path and it has `package com.budgetplanner.data.remote`

**Issue:** Gradle sync fails with dependency errors
- **Fix:** Check internet connection, try "File > Invalidate Caches / Restart"

**Issue:** App crashes on launch
- **Fix:** Check logcat for errors, usually missing AndroidManifest permission or Hilt setup

**Issue:** Supabase connection fails
- **Fix:** Verify URL and Anon Key in `local.properties` are correct

---

## 📚 Next Steps After Getting Started

1. **Create Room Database Setup**
   - Follow the DAO pattern shown in plan
   - Create entity classes for each table

2. **Implement Missing Services**
   - CategoryService
   - TransactionService  
   - GoalService
   - SyncService

3. **Complete UI Screens**
   - Transaction list with filters
   - Goals tracking with charts
   - Settings screen
   - Transaction detail screen

4. **Add Real-time Sync**
   - WorkManager background sync
   - Conflict resolution UI
   - Offline-first caching strategy

5. **Testing & Optimization**
   - Unit tests for repositories
   - Integration tests with test Supabase
   - Performance profiling
   - Error handling improvements

---

## 📞 Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **Android Docs:** https://developer.android.com
- **Jetpack Compose:** https://developer.android.com/jetpack/compose
- **Kotlin Coroutines:** https://kotlinlang.org/docs/coroutines-overview.html

---

## 🎯 Success Criteria

Your app is working correctly when:
- ✅ Users can sign up and login
- ✅ Dashboard displays budget summary
- ✅ Can add transactions
- ✅ Transactions appear in list and dashboard
- ✅ Budget vs actual shows correct calculations
- ✅ Goals can be created and tracked
- ✅ Data syncs to Supabase
- ✅ App works offline with local caching

Good luck! 🚀
