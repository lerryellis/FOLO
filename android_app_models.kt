// ============================================
// DOMAIN MODELS - FOLO App
// ============================================
// Location: app/src/main/java/com/budgetplanner/domain/models/

package com.budgetplanner.domain.models

import java.time.LocalDate
import java.time.YearMonth
import java.util.UUID

// ============================================
// User Model
// ============================================
data class User(
    val id: String,
    val email: String,
    val displayName: String,
    val currencySymbol: String = "$",
    val currencyCode: String = "USD",
    val profileImageUrl: String? = null,
    val createdAt: Long,
    val updatedAt: Long
)

// ============================================
// Budget Period Model
// ============================================
data class BudgetPeriod(
    val id: String = UUID.randomUUID().toString(),
    val userId: String,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val startingBalance: Double = 0.0,
    val notes: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
) {
    val yearMonth: YearMonth
        get() = YearMonth.from(startDate)

    val daysRemaining: Int
        get() = (endDate.toEpochDay() - LocalDate.now().toEpochDay()).toInt().coerceAtLeast(0)
}

// ============================================
// Category Model
// ============================================
enum class CategoryType {
    INCOME,
    BILLS,
    EXPENSES,
    SAVINGS,
    DEBT
}

data class Category(
    val id: String = UUID.randomUUID().toString(),
    val userId: String,
    val type: CategoryType,
    val name: String,
    val icon: String? = null,
    val color: String? = null,
    val isActive: Boolean = true,
    val createdAt: Long = System.currentTimeMillis()
)

// ============================================
// Budget Item Model
// ============================================
data class BudgetItem(
    val id: String = UUID.randomUUID().toString(),
    val budgetPeriodId: String,
    val categoryId: String,
    val userId: String,
    val subcategoryName: String,
    val budgetedAmount: Double = 0.0,
    val orderIndex: Int = 0,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
) {
    val actualAmount: Double
        get() = 0.0 // Will be calculated from transactions
}

// ============================================
// Transaction Model
// ============================================
data class Transaction(
    val id: String = UUID.randomUUID().toString(),
    val userId: String,
    val budgetPeriodId: String,
    val budgetItemId: String? = null,
    val categoryType: CategoryType,
    val categoryName: String,
    val subcategoryName: String? = null,
    val amount: Double,
    val transactionDate: LocalDate = LocalDate.now(),
    val notes: String? = null,
    val syncStatus: SyncStatus = SyncStatus.PENDING,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

// ============================================
// Financial Goal Model
// ============================================
enum class GoalType {
    SAVINGS,
    DEBT
}

data class FinancialGoal(
    val id: String = UUID.randomUUID().toString(),
    val userId: String,
    val goalType: GoalType,
    val name: String,
    val targetAmount: Double,
    val startingAmount: Double = 0.0,
    val currentProgress: Double = 0.0,
    val goalDate: LocalDate? = null,
    val description: String? = null,
    val isCompleted: Boolean = false,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
) {
    val remainingAmount: Double
        get() = (targetAmount - currentProgress).coerceAtLeast(0.0)

    val progressPercentage: Float
        get() = (currentProgress / targetAmount * 100f).coerceIn(0f, 100f)
}

data class GoalTransaction(
    val id: String = UUID.randomUUID().toString(),
    val goalId: String,
    val userId: String,
    val amount: Double,
    val transactionDate: LocalDate = LocalDate.now(),
    val notes: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)

// ============================================
// Sync Status Enum
// ============================================
enum class SyncStatus {
    PENDING,    // Not yet synced
    SYNCING,    // Currently syncing
    SYNCED,     // Synced successfully
    FAILED,     // Sync failed
    CONFLICT    // Conflict detected
}

// ============================================
// Budget Summary (Computed Model)
// ============================================
data class BudgetSummary(
    val budgetPeriod: BudgetPeriod,
    val totalIncome: Double = 0.0,
    val totalBills: Double = 0.0,
    val totalExpenses: Double = 0.0,
    val totalSavings: Double = 0.0,
    val totalDebt: Double = 0.0,
    val totalBudgetedIncome: Double = 0.0,
    val totalBudgetedBills: Double = 0.0,
    val totalBudgetedExpenses: Double = 0.0,
    val totalBudgetedSavings: Double = 0.0,
    val totalBudgetedDebt: Double = 0.0,
    val categories: Map<CategoryType, List<BudgetItem>> = emptyMap(),
    val transactions: List<Transaction> = emptyList()
) {
    val totalExpensed: Double
        get() = totalBills + totalExpenses

    val totalBudgetedExpensed: Double
        get() = totalBudgetedBills + totalBudgetedExpenses

    val leftToSpend: Double
        get() = (totalIncome - totalExpensed).coerceAtLeast(0.0)

    val remainingBudget: Double
        get() = (totalBudgetedIncome - totalBudgetedExpensed).coerceAtLeast(0.0)

    val isOverBudget: Boolean
        get() = totalExpensed > totalBudgetedExpensed

    val budgetedExpensePercentage: Float
        get() = if (totalBudgetedIncome > 0) {
            (totalBudgetedExpensed / totalBudgetedIncome * 100f).coerceIn(0f, 100f)
        } else {
            0f
        }

    val actualExpensePercentage: Float
        get() = if (totalIncome > 0) {
            (totalExpensed / totalIncome * 100f).coerceIn(0f, 100f)
        } else {
            0f
        }
}

// ============================================
// Budget vs Actual Item
// ============================================
data class BudgetVsActualItem(
    val categoryName: String,
    val budgetedAmount: Double,
    val actualAmount: Double,
    val difference: Double,
    val percentageSpent: Float
) {
    val isOverBudget: Boolean
        get() = actualAmount > budgetedAmount
}

// ============================================
// Sync State
// ============================================
data class SyncState(
    val status: SyncStatus = SyncStatus.SYNCED,
    val lastSyncTime: Long? = null,
    val pendingChangesCount: Int = 0,
    val failedChangesCount: Int = 0,
    val errorMessage: String? = null
)

// ============================================
// Dashboard UI State
// ============================================
data class DashboardUIState(
    val isLoading: Boolean = true,
    val budgetSummary: BudgetSummary? = null,
    val currentMonth: YearMonth = YearMonth.now(),
    val syncState: SyncState = SyncState(),
    val error: String? = null
) {
    val hasData: Boolean
        get() = budgetSummary != null && !isLoading
}

// ============================================
// Result Wrapper for API Calls
// ============================================
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val exception: Exception, val message: String? = null) : Result<Nothing>()
    object Loading : Result<Nothing>()

    fun getOrNull(): T? = when (this) {
        is Success -> data
        else -> null
    }

    suspend fun onSuccess(action: suspend (T) -> Unit): Result<T> {
        if (this is Success) action(data)
        return this
    }

    suspend fun onError(action: suspend (Exception) -> Unit): Result<T> {
        if (this is Error) action(exception)
        return this
    }
}
