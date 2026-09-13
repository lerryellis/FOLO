# FOLO Android App - Setup Guide

## Project Structure

```
BudgetPlanner/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/budgetplanner/
│   │   │   │   ├── BudgetPlannerApplication.kt
│   │   │   │   ├── di/
│   │   │   │   │   ├── AppModule.kt
│   │   │   │   │   ├── RepositoryModule.kt
│   │   │   │   ├── data/
│   │   │   │   │   ├── model/
│   │   │   │   │   │   ├── User.kt
│   │   │   │   │   │   ├── BudgetPeriod.kt
│   │   │   │   │   │   ├── Transaction.kt
│   │   │   │   │   │   ├── Category.kt
│   │   │   │   │   │   ├── FinancialGoal.kt
│   │   │   │   │   ├── local/
│   │   │   │   │   │   ├── BudgetDatabase.kt
│   │   │   │   │   │   ├── dao/
│   │   │   │   │   │   │   ├── TransactionDao.kt
│   │   │   │   │   │   │   ├── BudgetItemDao.kt
│   │   │   │   │   ├── remote/
│   │   │   │   │   │   ├── SupabaseClient.kt
│   │   │   │   │   │   ├── api/
│   │   │   │   │   │   │   ├── UserService.kt
│   │   │   │   │   │   │   ├── TransactionService.kt
│   │   │   │   │   ├── repository/
│   │   │   │   │   │   ├── AuthRepository.kt
│   │   │   │   │   │   ├── BudgetRepository.kt
│   │   │   │   │   │   ├── TransactionRepository.kt
│   │   │   │   │   │   ├── GoalRepository.kt
│   │   │   │   ├── ui/
│   │   │   │   │   ├── MainActivity.kt
│   │   │   │   │   ├── theme/
│   │   │   │   │   │   ├── Color.kt
│   │   │   │   │   │   ├── Type.kt
│   │   │   │   │   │   ├── Theme.kt
│   │   │   │   │   ├── screens/
│   │   │   │   │   │   ├── auth/
│   │   │   │   │   │   │   ├── LoginScreen.kt
│   │   │   │   │   │   │   ├── SignUpScreen.kt
│   │   │   │   │   │   ├── dashboard/
│   │   │   │   │   │   │   ├── DashboardScreen.kt
│   │   │   │   │   │   ├── transactions/
│   │   │   │   │   │   │   ├── TransactionListScreen.kt
│   │   │   │   │   │   │   ├── AddTransactionScreen.kt
│   │   │   │   │   │   ├── goals/
│   │   │   │   │   │   │   ├── GoalsScreen.kt
│   │   │   │   │   │   │   ├── AddGoalScreen.kt
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── BudgetCard.kt
│   │   │   │   │   │   ├── TransactionItem.kt
│   │   │   │   │   │   ├── GoalProgressCard.kt
│   │   │   │   │   ├── viewmodel/
│   │   │   │   │   │   ├── AuthViewModel.kt
│   │   │   │   │   │   ├── DashboardViewModel.kt
│   │   │   │   │   │   ├── TransactionViewModel.kt
│   │   │   │   │   │   ├── GoalViewModel.kt
│   │   │   │   ├── util/
│   │   │   │   │   ├── Constants.kt
│   │   │   │   │   ├── DateUtils.kt
│   │   │   │   │   ├── CurrencyFormatter.kt
│   │   │   ├── res/
│   │   │   │   ├── drawable/
│   │   │   │   ├── values/
│   │   │   │   │   ├── colors.xml
│   │   │   │   │   ├── strings.xml
│   │   │   │   │   ├── themes.xml
│   │   ├── test/ & androidTest/
│   ├── build.gradle.kts
│   └── proguard-rules.pro
├── build.gradle.kts (root)
├── settings.gradle.kts
└── gradle.properties

```

## Step 1: Create Project in Android Studio

```bash
# 1. Open Android Studio
# 2. File → New → New Android Project
# 3. Select "Empty Activity"
# 4. Configure:
#    - Name: BudgetPlanner
#    - Package: com.budgetplanner
#    - Language: Kotlin
#    - API Level: 28 (or higher)
#    - Build system: Gradle (KTS)
```

## Step 2: Add Dependencies

Edit `build.gradle.kts` (Module: app):

```kotlin
// Core dependencies
dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    
    // Jetpack Compose
    implementation("androidx.compose.ui:ui:1.6.0")
    implementation("androidx.compose.ui:ui-graphics:1.6.0")
    implementation("androidx.compose.ui:ui-tooling-preview:1.6.0")
    implementation("androidx.compose.material3:material3:1.2.1")
    implementation("androidx.activity:activity-compose:1.9.2")
    
    // ViewModel & Navigation
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.navigation:navigation-compose:2.8.2")
    
    // Room for local caching
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    ksp("androidx.room:room-compiler:2.6.1")
    
    // Supabase
    implementation("io.github.supabase:gotrue-kt:2.3.1")
    implementation("io.github.supabase:postgrest-kt:2.3.1")
    implementation("io.github.supabase:realtime-kt:2.3.1")
    implementation("io.github.supabase:supabase-kt:2.3.1")
    
    // HTTP Client
    implementation("io.ktor:ktor-client-android:2.3.0")
    
    // Dependency Injection (Hilt)
    implementation("com.google.dagger:hilt-android:2.50")
    ksp("com.google.dagger:hilt-compiler:2.50")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")
    
    // JSON Serialization
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
    
    // Logging
    implementation("io.github.aakira:napier:2.6.1")
    
    // Testing
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}
```

## Step 3: Set up Supabase Credentials

Create `local.properties` (in root project):
```properties
supabase.url=YOUR_SUPABASE_URL
supabase.anon.key=YOUR_SUPABASE_ANON_KEY
```

## Step 4: Update AndroidManifest.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:name=".BudgetPlannerApplication"
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.BudgetPlanner"
        tools:targetApi="31">

        <activity
            android:name=".ui.MainActivity"
            android:exported="true"
            android:theme="@style/Theme.BudgetPlanner">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

    </application>

</manifest>
```

## Next Steps

1. Run `./gradlew build` to sync dependencies
2. Create Supabase project at https://supabase.com
3. Execute the `supabase_schema.sql` in Supabase SQL editor
4. Add your Supabase URL and Anon Key to local.properties
5. Start implementing the data models and repositories
