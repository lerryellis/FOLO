// ============================================
// SUPABASE CLIENT & INITIALIZATION
// ============================================
// Location: app/src/main/java/com/budgetplanner/data/remote/SupabaseClient.kt

package com.budgetplanner.data.remote

import android.content.Context
import io.github.supabase.gotrue.GoTrue
import io.github.supabase.postgrest.Postgrest
import io.github.supabase.realtime.Realtime
import io.ktor.client.HttpClient
import io.ktor.client.engine.android.Android
import io.ktor.client.plugins.logging.LogLevel
import io.ktor.client.plugins.logging.Logging
import io.ktor.client.plugins.websocket.WebSockets
import kotlinx.serialization.json.Json
import supabase.client.supabaseClient

object SupabaseConfig {
    // These should be fetched from BuildConfig or environment
    // In local.properties: supabase.url and supabase.anon.key
    const val SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co"
    const val SUPABASE_ANON_KEY = "YOUR_ANON_KEY_HERE"
}

class SupabaseClient(context: Context) {
    private val httpClient = HttpClient(Android) {
        install(Logging) {
            level = LogLevel.ALL
        }
        install(WebSockets)
    }

    val client = supabaseClient(
        supabaseUrl = SupabaseConfig.SUPABASE_URL,
        supabaseKey = SupabaseConfig.SUPABASE_ANON_KEY
    ) {
        install(GoTrue)
        install(Postgrest)
        install(Realtime)
        httpClient(httpClient)
        defaultSerializer = {
            Json {
                ignoreUnknownKeys = true
                isLenient = true
            }
        }
    }

    fun isAuthenticated(): Boolean = client.auth.currentSession != null

    suspend fun getCurrentUserId(): String? = client.auth.currentUserOrNull()?.id

    fun getAuthToken(): String? = client.auth.currentSession?.accessToken

    suspend fun signOut() {
        client.auth.signOut()
    }
}

// ============================================
// REPOSITORY INTERFACES
// ============================================
// Location: app/src/main/java/com/budgetplanner/data/repository/

package com.budgetplanner.data.repository

import com.budgetplanner.domain.models.*
import kotlinx.coroutines.flow.Flow

interface AuthRepository {
    suspend fun signUp(email: String, password: String): Result<User>
    suspend fun login(email: String, password: String): Result<User>
    suspend fun logout(): Result<Unit>
    suspend fun resetPassword(email: String): Result<Unit>
    fun getCurrentUser(): Flow<User?>
    suspend fun getCurrentUserId(): String?
}

interface BudgetRepository {
    suspend fun createBudgetPeriod(budgetPeriod: BudgetPeriod): Result<BudgetPeriod>
    suspend fun updateBudgetPeriod(budgetPeriod: BudgetPeriod): Result<Unit>
    suspend fun deleteBudgetPeriod(budgetPeriodId: String): Result<Unit>
    fun getBudgetPeriod(budgetPeriodId: String): Flow<BudgetPeriod?>
    fun getBudgetPeriodsForYear(year: Int): Flow<List<BudgetPeriod>>
    fun getBudgetPeriodForMonth(month: Int, year: Int): Flow<BudgetPeriod?>
    fun getBudgetSummary(budgetPeriodId: String): Flow<BudgetSummary?>
}

interface CategoryRepository {
    suspend fun createCategory(category: Category): Result<Category>
    suspend fun updateCategory(category: Category): Result<Unit>
    suspend fun deleteCategory(categoryId: String): Result<Unit>
    fun getCategories(type: CategoryType? = null): Flow<List<Category>>
    fun getCategoriesByType(type: CategoryType): Flow<List<Category>>
}

interface TransactionRepository {
    suspend fun addTransaction(transaction: Transaction): Result<Transaction>
    suspend fun updateTransaction(transaction: Transaction): Result<Unit>
    suspend fun deleteTransaction(transactionId: String): Result<Unit>
    fun getTransactionsForPeriod(budgetPeriodId: String): Flow<List<Transaction>>
    fun getTransactionsByCategory(categoryType: CategoryType, budgetPeriodId: String): Flow<List<Transaction>>
    fun observeTransactionChanges(budgetPeriodId: String): Flow<Transaction>
}

interface GoalRepository {
    suspend fun createGoal(goal: FinancialGoal): Result<FinancialGoal>
    suspend fun updateGoal(goal: FinancialGoal): Result<Unit>
    suspend fun deleteGoal(goalId: String): Result<Unit>
    fun getGoals(type: GoalType? = null): Flow<List<FinancialGoal>>
    suspend fun addGoalTransaction(transaction: GoalTransaction): Result<GoalTransaction>
    fun getGoalTransactions(goalId: String): Flow<List<GoalTransaction>>
}

interface SyncRepository {
    suspend fun syncAllData(): Result<Unit>
    suspend fun uploadPendingChanges(): Result<Unit>
    fun getSyncState(): Flow<SyncState>
    suspend fun resolveSyncConflict(itemId: String, takeRemote: Boolean): Result<Unit>
}

// ============================================
// REPOSITORY IMPLEMENTATIONS
// ============================================

package com.budgetplanner.data.repository.impl

import com.budgetplanner.data.local.dao.*
import com.budgetplanner.data.remote.SupabaseClient
import com.budgetplanner.domain.models.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

// ============================================
// Auth Repository Implementation
// ============================================

class AuthRepositoryImpl(
    private val supabaseClient: SupabaseClient,
    private val userDao: UserDao
) : AuthRepository {

    override suspend fun signUp(email: String, password: String): Result<User> {
        return try {
            val response = supabaseClient.client.auth.signUpWith(email, password)
            val user = User(
                id = response.user?.id ?: "",
                email = email,
                displayName = email.substringBefore("@"),
                createdAt = System.currentTimeMillis(),
                updatedAt = System.currentTimeMillis()
            )
            userDao.insertUser(user.toEntity())
            Result.Success(user)
        } catch (e: Exception) {
            Result.Error(e, "Sign up failed: ${e.message}")
        }
    }

    override suspend fun login(email: String, password: String): Result<User> {
        return try {
            val response = supabaseClient.client.auth.signInWith(email, password)
            val user = User(
                id = response.user?.id ?: "",
                email = email,
                displayName = email.substringBefore("@"),
                createdAt = System.currentTimeMillis(),
                updatedAt = System.currentTimeMillis()
            )
            userDao.insertUser(user.toEntity())
            Result.Success(user)
        } catch (e: Exception) {
            Result.Error(e, "Login failed: ${e.message}")
        }
    }

    override suspend fun logout(): Result<Unit> {
        return try {
            supabaseClient.signOut()
            userDao.deleteAllUsers()
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(e, "Logout failed: ${e.message}")
        }
    }

    override suspend fun resetPassword(email: String): Result<Unit> {
        return try {
            supabaseClient.client.auth.resetPasswordForEmail(email)
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(e, "Reset failed: ${e.message}")
        }
    }

    override fun getCurrentUser(): Flow<User?> = flow {
        val userId = supabaseClient.getCurrentUserId()
        if (userId != null) {
            userDao.getUserById(userId)
                .map { it?.toDomain() }
                .collect { emit(it) }
        } else {
            emit(null)
        }
    }

    override suspend fun getCurrentUserId(): String? = supabaseClient.getCurrentUserId()
}

// ============================================
// Budget Repository Implementation
// ============================================

class BudgetRepositoryImpl(
    private val supabaseClient: SupabaseClient,
    private val budgetPeriodDao: BudgetPeriodDao,
    private val budgetItemDao: BudgetItemDao,
    private val transactionDao: TransactionDao,
    private val categoryDao: CategoryDao,
    private val coroutineScope: CoroutineScope
) : BudgetRepository {

    override suspend fun createBudgetPeriod(budgetPeriod: BudgetPeriod): Result<BudgetPeriod> {
        return try {
            // Save locally first (optimistic)
            budgetPeriodDao.insertBudgetPeriod(budgetPeriod.toEntity())

            // Sync to remote
            val response = supabaseClient.client
                .from("budget_periods")
                .insert(budgetPeriod)

            Result.Success(budgetPeriod)
        } catch (e: Exception) {
            Result.Error(e, "Failed to create budget: ${e.message}")
        }
    }

    override suspend fun updateBudgetPeriod(budgetPeriod: BudgetPeriod): Result<Unit> {
        return try {
            budgetPeriodDao.updateBudgetPeriod(budgetPeriod.toEntity())
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(e, "Failed to update budget: ${e.message}")
        }
    }

    override suspend fun deleteBudgetPeriod(budgetPeriodId: String): Result<Unit> {
        return try {
            budgetPeriodDao.deleteBudgetPeriod(budgetPeriodId)
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(e, "Failed to delete budget: ${e.message}")
        }
    }

    override fun getBudgetPeriod(budgetPeriodId: String): Flow<BudgetPeriod?> {
        return budgetPeriodDao.getBudgetPeriodById(budgetPeriodId)
            .map { it?.toDomain() }
    }

    override fun getBudgetPeriodsForYear(year: Int): Flow<List<BudgetPeriod>> {
        return budgetPeriodDao.getBudgetPeriodsByYear(year)
            .map { it.map { entity -> entity.toDomain() } }
    }

    override fun getBudgetPeriodForMonth(month: Int, year: Int): Flow<BudgetPeriod?> {
        return budgetPeriodDao.getBudgetPeriodForMonth(month, year)
            .map { it?.toDomain() }
    }

    override fun getBudgetSummary(budgetPeriodId: String): Flow<BudgetSummary?> = flow {
        budgetPeriodDao.getBudgetPeriodById(budgetPeriodId)
            .zip(
                budgetItemDao.getBudgetItemsByPeriod(budgetPeriodId)
            ) { budgetPeriodEntity, budgetItems ->
                if (budgetPeriodEntity == null) {
                    emit(null)
                    return@zip
                }

                val budgetPeriod = budgetPeriodEntity.toDomain()
                val transactions = transactionDao.getTransactionsForPeriod(budgetPeriodId)
                    .first()
                    .map { it.toDomain() }

                val categories = categoryDao.getAllCategories()
                    .first()
                    .map { it.toDomain() }
                    .groupBy { it.type }

                val summary = BudgetSummary(
                    budgetPeriod = budgetPeriod,
                    totalIncome = transactions
                        .filter { it.categoryType == CategoryType.INCOME }
                        .sumOf { it.amount },
                    totalBills = transactions
                        .filter { it.categoryType == CategoryType.BILLS }
                        .sumOf { it.amount },
                    totalExpenses = transactions
                        .filter { it.categoryType == CategoryType.EXPENSES }
                        .sumOf { it.amount },
                    totalSavings = transactions
                        .filter { it.categoryType == CategoryType.SAVINGS }
                        .sumOf { it.amount },
                    totalDebt = transactions
                        .filter { it.categoryType == CategoryType.DEBT }
                        .sumOf { it.amount },
                    categories = categories,
                    transactions = transactions
                )
                emit(summary)
            }.collect()
    }
}

// ============================================
// Transaction Repository Implementation
// ============================================

class TransactionRepositoryImpl(
    private val supabaseClient: SupabaseClient,
    private val transactionDao: TransactionDao
) : TransactionRepository {

    override suspend fun addTransaction(transaction: Transaction): Result<Transaction> {
        return try {
            // Save locally first (optimistic)
            transactionDao.insertTransaction(transaction.toEntity())

            // Sync to remote
            supabaseClient.client
                .from("transactions")
                .insert(transaction)

            Result.Success(transaction)
        } catch (e: Exception) {
            Result.Error(e, "Failed to add transaction: ${e.message}")
        }
    }

    override suspend fun updateTransaction(transaction: Transaction): Result<Unit> {
        return try {
            transactionDao.updateTransaction(transaction.toEntity())
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(e, "Failed to update transaction: ${e.message}")
        }
    }

    override suspend fun deleteTransaction(transactionId: String): Result<Unit> {
        return try {
            transactionDao.deleteTransaction(transactionId)
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(e, "Failed to delete transaction: ${e.message}")
        }
    }

    override fun getTransactionsForPeriod(budgetPeriodId: String): Flow<List<Transaction>> {
        return transactionDao.getTransactionsForPeriod(budgetPeriodId)
            .map { it.map { entity -> entity.toDomain() } }
    }

    override fun getTransactionsByCategory(
        categoryType: CategoryType,
        budgetPeriodId: String
    ): Flow<List<Transaction>> {
        return transactionDao.getTransactionsByCategory(categoryType.name, budgetPeriodId)
            .map { it.map { entity -> entity.toDomain() } }
    }

    override fun observeTransactionChanges(budgetPeriodId: String): Flow<Transaction> = flow {
        // Listen to realtime changes from Supabase
        try {
            supabaseClient.client
                .from("transactions")
                .on("*") { payload ->
                    // Handle real-time updates
                }
                .subscribe()
        } catch (e: Exception) {
            // Handle subscription error
        }
    }
}

// ============================================
// Goal Repository Implementation
// ============================================

class GoalRepositoryImpl(
    private val supabaseClient: SupabaseClient,
    private val goalDao: GoalDao,
    private val goalTransactionDao: GoalTransactionDao
) : GoalRepository {

    override suspend fun createGoal(goal: FinancialGoal): Result<FinancialGoal> {
        return try {
            goalDao.insertGoal(goal.toEntity())
            Result.Success(goal)
        } catch (e: Exception) {
            Result.Error(e, "Failed to create goal: ${e.message}")
        }
    }

    override suspend fun updateGoal(goal: FinancialGoal): Result<Unit> {
        return try {
            goalDao.updateGoal(goal.toEntity())
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(e, "Failed to update goal: ${e.message}")
        }
    }

    override suspend fun deleteGoal(goalId: String): Result<Unit> {
        return try {
            goalDao.deleteGoal(goalId)
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(e, "Failed to delete goal: ${e.message}")
        }
    }

    override fun getGoals(type: GoalType?): Flow<List<FinancialGoal>> {
        return if (type != null) {
            goalDao.getGoalsByType(type.name)
                .map { it.map { entity -> entity.toDomain() } }
        } else {
            goalDao.getAllGoals()
                .map { it.map { entity -> entity.toDomain() } }
        }
    }

    override suspend fun addGoalTransaction(transaction: GoalTransaction): Result<GoalTransaction> {
        return try {
            goalTransactionDao.insertGoalTransaction(transaction.toEntity())
            Result.Success(transaction)
        } catch (e: Exception) {
            Result.Error(e, "Failed to add goal transaction: ${e.message}")
        }
    }

    override fun getGoalTransactions(goalId: String): Flow<List<GoalTransaction>> {
        return goalTransactionDao.getGoalTransactions(goalId)
            .map { it.map { entity -> entity.toDomain() } }
    }
}

// TODO: Implement mapping extensions (toDomain(), toEntity()) for all models
