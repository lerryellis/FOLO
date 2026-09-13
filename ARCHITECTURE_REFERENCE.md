# FOLO - Architecture Reference

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ANDROID DEVICES (Multiple Users)                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                  JETPACK COMPOSE UI LAYER                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │ │
│  │  │ LoginScreen  │  │ DashboardUI  │  │ GoalsScreen  │ ...     │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │ │
│  │         │                 │                 │                  │ │
│  │  ┌──────┴─────────────────┴─────────────────┴──────────────┐   │ │
│  │  │              VIEWMODEL LAYER                             │   │ │
│  │  │  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐ │   │ │
│  │  │  │AuthViewModel │   │DashboardVM   │   │GoalsViewModel│ │   │ │
│  │  │  │ StateFlow    │   │ StateFlow    │   │ StateFlow    │ │   │ │
│  │  │  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘ │   │ │
│  │  └─────────┼──────────────────┼──────────────────┼──────────┘   │ │
│  │            │                  │                  │               │ │
│  │  ┌─────────┴──────────────────┴──────────────────┴──────────┐   │ │
│  │  │         REPOSITORY LAYER (Interfaces)                    │   │ │
│  │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │   │ │
│  │  │  │AuthRepo    │  │BudgetRepo  │  │GoalRepo    │ ...     │   │ │
│  │  │  └────────┬───┘  └────────┬───┘  └────────┬───┘         │   │ │
│  │  └───────────┼───────────────┼───────────────┼─────────────┘   │ │
│  │              │               │               │                  │ │
│  │  ┌───────────┴───────────────┴───────────────┴──────────────┐   │ │
│  │  │     REPOSITORY IMPLEMENTATIONS (Offline-First)           │   │ │
│  │  │                                                            │   │ │
│  │  │  ┌──────────────────────────────────────────────────────┐│   │ │
│  │  │  │              Local (Room SQLite)                     ││   │ │
│  │  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           ││   │ │
│  │  │  │  │DAO        │  │DAO        │  │DAO        │           ││   │ │
│  │  │  │  │Transaction│  │Budget     │  │Goal       │           ││   │ │
│  │  │  │  └──────────┘  └──────────┘  └──────────┘           ││   │ │
│  │  │  │                                                      ││   │ │
│  │  │  │  ┌──────────────────────────────────────────────────┐││   │ │
│  │  │  │  │   BudgetPlannerDatabase (Room)                  │││   │ │
│  │  │  │  │   - transactions table                          │││   │ │
│  │  │  │  │   - budgets table                               │││   │ │
│  │  │  │  │   - categories table                            │││   │ │
│  │  │  │  │   - goals table                                 │││   │ │
│  │  │  │  └──────────────────────────────────────────────────┘││   │ │
│  │  │  └──────────────────────────────────────────────────────┘│   │ │
│  │  │                          ↕ sync (background)             │   │ │
│  │  │  ┌──────────────────────────────────────────────────────┐│   │ │
│  │  │  │           Remote (Supabase API)                      ││   │ │
│  │  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           ││   │ │
│  │  │  │  │Service    │  │Service    │  │Service    │           ││   │ │
│  │  │  │  │Auth       │  │Budget     │  │Goal       │           ││   │ │
│  │  │  │  └──────────┘  └──────────┘  └──────────┘           ││   │ │
│  │  │  └──────────────────────────────────────────────────────┘│   │ │
│  │  └────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS
                               │ JWT Auth
                               ↓
            ┌──────────────────────────────────────┐
            │                                        │
            │   SUPABASE CLOUD (PostgreSQL)         │
            │                                        │
            │  ┌──────────────────────────────────┐ │
            │  │   Database Tables                │ │
            │  │   (RLS Policies enforced)        │ │
            │  │  ┌──────────────────────────────┐│ │
            │  │  │user_profiles                 ││ │
            │  │  │categories                    ││ │
            │  │  │budget_periods                ││ │
            │  │  │budget_items                  ││ │
            │  │  │transactions                  ││ │
            │  │  │financial_goals               ││ │
            │  │  │goal_transactions             ││ │
            │  │  └──────────────────────────────┘│ │
            │  └──────────────────────────────────┘ │
            │                                        │
            │  ┌──────────────────────────────────┐ │
            │  │   Auth Service                   │ │
            │  │   - Email/Password login         │ │
            │  │   - JWT token management         │ │
            │  │   - Session persistence          │ │
            │  └──────────────────────────────────┘ │
            │                                        │
            │  ┌──────────────────────────────────┐ │
            │  │   Real-Time Subscriptions        │ │
            │  │   - WebSocket connections        │ │
            │  │   - Broadcast updates            │ │
            │  │   - Multi-device sync            │ │
            │  └──────────────────────────────────┘ │
            │                                        │
            └──────────────────────────────────────┘
```

---

## Data Flow Diagram - Adding a Transaction

```
┌──────────────────┐
│  User Input      │
│  $50 groceries   │
└────────┬─────────┘
         │
         ↓
┌─────────────────────────────────────┐
│ AddTransactionScreen                │
│ - Validates input                   │
│ - Builds Transaction object         │
└────────┬────────────────────────────┘
         │ calls
         ↓
┌─────────────────────────────────────┐
│ AddTransactionViewModel             │
│ - Calls repository.addTransaction() │
│ - Updates UI state                  │
└────────┬────────────────────────────┘
         │ calls
         ↓
┌─────────────────────────────────────┐
│ TransactionRepository               │
│ - Implementation logic              │
└────────┬────────────────────────────┘
         │ splits into two paths
         │
         ├─────────────────────────────────────────┐
         │                                         │
         ↓ (Immediate)                             ↓ (Background)
    ┌─────────────┐                          ┌──────────────┐
    │ Room DAO    │                          │ Supabase API │
    │ - Insert    │                          │ - Upload     │
    │ - Local DB  │                          │ - Network    │
    │ - Immediate │                          │ - Async      │
    └─────────────┘                          └──────────────┘
         │                                         │
         ↓ (Real-time)                             ↓ (Real-time)
    ┌─────────────────────┐                  ┌──────────────────┐
    │ Flow emits update   │                  │ Subscription API │
    │ to subscribers      │                  │ Pushes to device │
    └─────────────────────┘                  └──────────────────┘
         │                                         │
         └──────────────────────────────┬──────────┘
                                        │
                                        ↓
                                   ┌─────────────────────┐
                                   │ DashboardViewModel  │
                                   │ - Observes flow     │
                                   │ - Updates state     │
                                   └─────────────────────┘
                                        │
                                        ↓
                                   ┌─────────────────────┐
                                   │ Jetpack Compose     │
                                   │ - Recomposes        │
                                   │ - Shows new balance │
                                   └─────────────────────┘
                                        │
                                        ↓
                                   ┌─────────────────────┐
                                   │ User Sees Update    │
                                   │ in ~50ms            │
                                   └─────────────────────┘
```

---

## Data Model Relationships

```
User (1:N) BudgetPeriod
  │
  └─→ (1:N) Category
  │         └─→ (1:N) BudgetItem
  │                  └─→ (1:N) Transaction
  │
  └─→ (1:N) Transaction
  │         (joins to Category, BudgetItem, BudgetPeriod)
  │
  └─→ (1:N) FinancialGoal
             └─→ (1:N) GoalTransaction

Example:
User: "alice@example.com"
  ├─ BudgetPeriod: "September 2024"
  │   └─ Category: "Groceries" (type: EXPENSES)
  │       ├─ BudgetItem: "$400" allocated
  │       └─ Transactions:
  │           ├─ Sept 1: $50
  │           ├─ Sept 5: $75
  │           └─ Sept 10: $60
  │
  └─ FinancialGoal: "Save for vacation"
      └─ GoalTransaction: "+$500"
```

---

## State Management Pattern

```
Compose View (Stateless)
       ↓ collects
Flow<UiState> from ViewModel
       ↑ observes
ViewModel (Stateful)
       │
       ├─ MutableStateFlow<UiState>
       │   - isLoading: Boolean
       │   - data: T
       │   - error: String?
       │
       └─ publishes via
         Flow<UiState>
              │
              └─ collects in Compose
                  └─ recomposition

Example:
data class DashboardUiState(
    val isLoading: Boolean,
    val budgetSummary: BudgetSummary?,
    val error: String?
)

val uiState: StateFlow<DashboardUiState>
    .collect { state ->
        if (state.isLoading) ShowSpinner()
        else if (state.error != null) ShowError(state.error)
        else ShowDashboard(state.budgetSummary)
    }
```

---

## Sync Strategy (Offline-First)

```
STATE 1: Online, making changes
User edits transaction → 
  ┌─ Insert to Room (immediately)
  │  ↓
  └─ UI updates (instant)
     ↓
  Upload to Supabase (async)
     ↓
  Mark as SYNCED

STATE 2: Offline, making changes
User edits transaction →
  ┌─ Insert to Room (immediately)
  │  ↓
  └─ Mark as PENDING
     ↓
  UI updates (instant)
     ↓
  (No upload possible)

STATE 3: Back online
Detect connectivity →
  ┌─ WorkManager wakes up
  │  ↓
  └─ Find all PENDING items
     ↓
  Upload to Supabase (batch)
     ↓
  Mark as SYNCED
     ↓
  Subscribe to real-time updates
     ↓
  Fetch remote changes
     ↓
  Update local cache
```

---

## ViewModel Lifecycle

```
ViewModel Created
    ↓
init {} called
    │
    ├─ Load initial data
    │  │
    │  └─ repository.getData()
    │      ↓
    │      Flow emits updates
    │      ↓
    │      collect { newData -> updateState() }
    │
    └─ Subscribe to observables
       │
       └─ flowOf(data).collect()

Screen Active
    ↓
collectAsStateWithLifecycle()
    │
    ├─ Collect while screen visible
    └─ Stop collection if paused
        (memory efficient)

User Action (e.g., click button)
    ↓
ViewModel.function() called
    │
    ├─ Update MutableStateFlow
    ├─ Call repository
    └─ Handle result
       ├─ Success → update state
       └─ Error → update error state

Screen Destroyed
    ↓
ViewModel.onCleared() called
    │
    └─ Cancel all coroutines
       (prevents memory leaks)
```

---

## Key Architectural Patterns

### 1. Repository Pattern
```kotlin
// Hides implementation details
interface BudgetRepository {
    fun getBudgetSummary(): Flow<BudgetSummary>
}

// Client only knows interface, not that it uses Room + Supabase
val viewModel = BudgetViewModel(budgetRepository)
```

### 2. Flow Pattern (Reactive)
```kotlin
// Data source emits updates
repository.getTransactions()
    .onEach { newTransactions ->
        updateUiState { copy(transactions = newTransactions) }
    }
    .launchIn(viewModelScope)

// UI automatically reacts
val uiState by viewModel.uiState.collectAsStateWithLifecycle()
```

### 3. Result Wrapper
```kotlin
sealed class Result<T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val exception: Exception) : Result<Nothing>()
}

// Type-safe error handling
when (result) {
    is Result.Success -> handleSuccess(result.data)
    is Result.Error -> handleError(result.exception)
}
```

### 4. Offline-First
```kotlin
// 1. Local write (immediate)
dao.insert(transaction)

// 2. Async upload (non-blocking)
viewModelScope.launch {
    try {
        api.uploadTransaction(transaction)
        dao.markSynced(transaction.id)
    } catch (e: Exception) {
        dao.markFailed(transaction.id)
    }
}

// 3. UI never waits for network
val uiState: StateFlow<UiState>
```

---

## Dependency Injection (Hilt) Pattern

```kotlin
// Modules provide dependencies
@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    @Provides
    @Singleton
    fun provideSupabaseClient(): SupabaseClient =
        SupabaseClient(...)
    
    @Provides
    @Singleton
    fun provideBudgetRepository(
        supabaseClient: SupabaseClient
    ): BudgetRepository =
        BudgetRepositoryImpl(supabaseClient)
}

// ViewModels receive dependencies automatically
@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val budgetRepository: BudgetRepository
) : ViewModel() {
    // budgetRepository is injected
}

// Compose screens use hiltViewModel()
@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel = hiltViewModel()
) {
    // viewModel is injected and scoped properly
}
```

---

## File Organization Summary

```
com.budgetplanner/
├── data/                           # Data layer
│   ├── local/
│   │   ├── BudgetPlannerDatabase  # Room database
│   │   ├── dao/                   # Data access objects
│   │   └── entity/                # Room entities
│   ├── remote/
│   │   ├── SupabaseClient         # Supabase setup
│   │   └── services/              # API services
│   └── repository/
│       ├── (interfaces)           # Repository contracts
│       └── impl/                  # Implementations
├── domain/                         # Domain layer
│   ├── models/                    # Data classes
│   └── usecases/                  # Business logic
├── ui/                            # UI layer
│   ├── screens/                   # Composable screens
│   ├── components/                # Reusable components
│   ├── viewmodel/                 # ViewModels
│   ├── navigation/                # Navigation setup
│   └── theme/                     # Colors, fonts, etc.
├── di/                            # Dependency injection
│   ├── AppModule                  # Provides repositories
│   └── DatabaseModule             # Provides Room DB
└── util/                          # Utilities
    ├── Constants
    ├── Extensions
    └── Formatters
```

---

## Performance Considerations

| Operation | Time | Strategy |
|-----------|------|----------|
| Add transaction | ~50ms | Room write + Flow emit |
| Load dashboard | ~200ms | Room query + calculations |
| Sync to cloud | 1-5s | Background, non-blocking |
| UI update | ~16ms | Compose recomposition |
| Real-time push | 100-500ms | WebSocket subscription |

**Key Optimizations:**
- ✅ Writes are local-first (no network latency)
- ✅ Queries are indexed in Room
- ✅ Sync happens in background thread
- ✅ UI never blocks on I/O
- ✅ Pagination for large lists (future)

---

## Common Pitfalls & Solutions

| Pitfall | Problem | Solution |
|---------|---------|----------|
| Blocking UI on network call | Frozen screen | Always use `viewModelScope.launch` |
| Memory leaks | App crashes | Cancel flows in `onCleared()` |
| Duplicate API calls | Wasted bandwidth | Use `SharedFlow` for subscriptions |
| Lost offline changes | Data loss | Mark as PENDING, sync on reconnect |
| Race conditions | Corruption | Use timestamp-based merging |
| Unhandled errors | Bad UX | Always catch and display error |

---

## Extension Points (How to Add Features)

### Adding a New Feature
1. **Create new model** in `domain/models/`
2. **Create new service** in `data/remote/services/`
3. **Create new DAO** in `data/local/dao/`
4. **Create new repository** in `data/repository/`
5. **Create new ViewModel** in `ui/viewmodel/`
6. **Create new screen** in `ui/screens/`
7. **Add to navigation** in `ui/navigation/`
8. **Add Hilt module** if needed in `di/`

### Example: Adding Budget Categories
```kotlin
// 1. Model exists: Category.kt

// 2. Service created: CategoryService.kt
class CategoryService(val supabaseClient: SupabaseClient) {
    suspend fun getCategories(): List<Category> = ...
}

// 3. DAO created: CategoryDao.kt
@Dao interface CategoryDao {
    @Query("SELECT * FROM categories")
    fun getAllCategories(): Flow<List<CategoryEntity>>
}

// 4. Repository created: CategoryRepository.kt
interface CategoryRepository {
    fun getCategories(): Flow<List<Category>>
}

// 5. ViewModel created: CategoryViewModel.kt
@HiltViewModel
class CategoryViewModel @Inject constructor(
    private val repo: CategoryRepository
) : ViewModel() { ... }

// 6. Screen created: CategoryScreen.kt
@Composable
fun CategoryScreen(viewModel: CategoryViewModel) { ... }

// Done! Feature is complete
```

---

This is your complete architectural reference! Use this document when you're implementing features to understand how everything connects.
