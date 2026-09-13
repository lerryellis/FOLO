// ============================================
// VIEWMODELS
// ============================================
// Location: app/src/main/java/com/budgetplanner/ui/viewmodel/

package com.budgetplanner.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.budgetplanner.data.repository.*
import com.budgetplanner.domain.models.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.YearMonth

// ============================================
// Auth ViewModel
// ============================================

data class AuthUiState(
    val isLoading: Boolean = false,
    val isAuthenticated: Boolean = false,
    val currentUser: User? = null,
    val error: String? = null
)

class AuthViewModel(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    init {
        // Check if user is already authenticated
        viewModelScope.launch {
            authRepository.getCurrentUser().collect { user ->
                _uiState.value = _uiState.value.copy(
                    isAuthenticated = user != null,
                    currentUser = user
                )
            }
        }
    }

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            when (val result = authRepository.login(email, password)) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isAuthenticated = true,
                        currentUser = result.data
                    )
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = result.message ?: "Login failed"
                    )
                }
                else -> {}
            }
        }
    }

    fun signUp(email: String, password: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            when (val result = authRepository.signUp(email, password)) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isAuthenticated = true,
                        currentUser = result.data
                    )
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = result.message ?: "Sign up failed"
                    )
                }
                else -> {}
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            when (authRepository.logout()) {
                is Result.Success -> {
                    _uiState.value = AuthUiState()
                }
                else -> {}
            }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}

// ============================================
// Dashboard ViewModel
// ============================================

data class DashboardUiState(
    val isLoading: Boolean = true,
    val budgetSummary: BudgetSummary? = null,
    val currentMonth: YearMonth = YearMonth.now(),
    val syncState: SyncState = SyncState(),
    val error: String? = null
)

class DashboardViewModel(
    private val budgetRepository: BudgetRepository,
    private val syncRepository: SyncRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    init {
        loadDashboard()
        observeSyncState()
    }

    private fun loadDashboard() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                val currentMonth = _uiState.value.currentMonth
                budgetRepository.getBudgetPeriodForMonth(
                    currentMonth.monthValue,
                    currentMonth.year
                ).flatMapLatest { budgetPeriod ->
                    if (budgetPeriod != null) {
                        budgetRepository.getBudgetSummary(budgetPeriod.id)
                            .map { it ?: BudgetSummary(budgetPeriod) }
                    } else {
                        // Create default budget period if doesn't exist
                        flow { emit(BudgetSummary(
                            budgetPeriod = BudgetPeriod(
                                userId = "",
                                startDate = currentMonth.atDay(1),
                                endDate = currentMonth.atEndOfMonth()
                            )
                        )) }
                    }
                }.collect { summary ->
                    _uiState.value = _uiState.value.copy(
                        budgetSummary = summary,
                        isLoading = false
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = "Failed to load dashboard: ${e.message}",
                    isLoading = false
                )
            }
        }
    }

    private fun observeSyncState() {
        viewModelScope.launch {
            syncRepository.getSyncState().collect { syncState ->
                _uiState.value = _uiState.value.copy(syncState = syncState)
            }
        }
    }

    fun changeMonth(yearMonth: YearMonth) {
        _uiState.value = _uiState.value.copy(currentMonth = yearMonth)
        loadDashboard()
    }

    fun refreshData() {
        viewModelScope.launch {
            syncRepository.syncAllData()
            loadDashboard()
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}

// ============================================
// Transaction ViewModel
// ============================================

data class AddTransactionUiState(
    val isLoading: Boolean = false,
    val categoryType: CategoryType = CategoryType.EXPENSES,
    val categories: List<Category> = emptyList(),
    val amount: String = "",
    val description: String = "",
    val selectedDate: LocalDate = LocalDate.now(),
    val selectedCategory: Category? = null,
    val error: String? = null,
    val success: Boolean = false
)

class AddTransactionViewModel(
    private val transactionRepository: TransactionRepository,
    private val categoryRepository: CategoryRepository,
    private val budgetRepository: BudgetRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AddTransactionUiState())
    val uiState: StateFlow<AddTransactionUiState> = _uiState.asStateFlow()

    private var currentBudgetPeriodId: String? = null

    init {
        loadCategories()
        loadCurrentBudgetPeriod()
    }

    private fun loadCurrentBudgetPeriod() {
        viewModelScope.launch {
            val now = YearMonth.now()
            budgetRepository.getBudgetPeriodForMonth(now.monthValue, now.year)
                .first()?.let { period ->
                    currentBudgetPeriodId = period.id
                }
        }
    }

    private fun loadCategories() {
        viewModelScope.launch {
            try {
                categoryRepository.getCategoriesByType(_uiState.value.categoryType)
                    .collect { categories ->
                        _uiState.value = _uiState.value.copy(categories = categories)
                    }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(error = e.message)
            }
        }
    }

    fun setCategoryType(type: CategoryType) {
        _uiState.value = _uiState.value.copy(
            categoryType = type,
            selectedCategory = null,
            amount = ""
        )
        loadCategories()
    }

    fun setAmount(amount: String) {
        _uiState.value = _uiState.value.copy(amount = amount)
    }

    fun setDescription(description: String) {
        _uiState.value = _uiState.value.copy(description = description)
    }

    fun setDate(date: LocalDate) {
        _uiState.value = _uiState.value.copy(selectedDate = date)
    }

    fun selectCategory(category: Category) {
        _uiState.value = _uiState.value.copy(selectedCategory = category)
    }

    fun addTransaction() {
        viewModelScope.launch {
            val state = _uiState.value
            if (state.amount.isEmpty() || state.selectedCategory == null || currentBudgetPeriodId == null) {
                _uiState.value = _uiState.value.copy(error = "Please fill all required fields")
                return@launch
            }

            _uiState.value = _uiState.value.copy(isLoading = true, error = null)

            val transaction = Transaction(
                userId = "", // Get from auth repository
                budgetPeriodId = currentBudgetPeriodId!!,
                categoryType = state.categoryType,
                categoryName = state.selectedCategory!!.name,
                amount = state.amount.toDoubleOrNull() ?: 0.0,
                transactionDate = state.selectedDate,
                notes = state.description.takeIf { it.isNotEmpty() }
            )

            when (val result = transactionRepository.addTransaction(transaction)) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        success = true
                    )
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = result.message ?: "Failed to add transaction"
                    )
                }
                else -> {}
            }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}

// ============================================
// Goals ViewModel
// ============================================

data class GoalsUiState(
    val isLoading: Boolean = true,
    val savingsGoals: List<FinancialGoal> = emptyList(),
    val debtGoals: List<FinancialGoal> = emptyList(),
    val error: String? = null
)

class GoalsViewModel(
    private val goalRepository: GoalRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(GoalsUiState())
    val uiState: StateFlow<GoalsUiState> = _uiState.asStateFlow()

    init {
        loadGoals()
    }

    private fun loadGoals() {
        viewModelScope.launch {
            try {
                goalRepository.getGoals(GoalType.SAVINGS).zip(
                    goalRepository.getGoals(GoalType.DEBT)
                ) { savings, debt ->
                    _uiState.value = _uiState.value.copy(
                        savingsGoals = savings,
                        debtGoals = debt,
                        isLoading = false
                    )
                }.collect()
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = e.message,
                    isLoading = false
                )
            }
        }
    }

    fun refreshGoals() {
        _uiState.value = _uiState.value.copy(isLoading = true)
        loadGoals()
    }
}

// ============================================
// COMPOSE SCREENS
// ============================================
// Location: app/src/main/java/com/budgetplanner/ui/screens/

package com.budgetplanner.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.budgetplanner.domain.models.BudgetSummary
import com.budgetplanner.ui.viewmodel.DashboardUiState
import com.budgetplanner.ui.viewmodel.DashboardViewModel
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.*

// ============================================
// Dashboard Screen
// ============================================

@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel,
    onNavigateToAddTransaction: () -> Unit,
    onNavigateToGoals: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        DashboardHeader(uiState)
        Spacer(modifier = Modifier.height(24.dp))

        if (uiState.isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else if (uiState.error != null) {
            ErrorCard(uiState.error!!) { uiState.let { } }
        } else {
            uiState.budgetSummary?.let { summary ->
                BudgetOverviewCards(summary)
                Spacer(modifier = Modifier.height(24.dp))

                QuickActionButtons(
                    onAddTransaction = onNavigateToAddTransaction,
                    onViewGoals = onNavigateToGoals
                )
                Spacer(modifier = Modifier.height(24.dp))

                BudgetBreakdownCard(summary)
            }
        }
    }
}

@Composable
private fun DashboardHeader(uiState: DashboardUiState) {
    val monthName = uiState.currentMonth.month
        .getDisplayName(TextStyle.FULL, Locale.getDefault())
    val year = uiState.currentMonth.year

    Column {
        Text(
            text = "$monthName $year",
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold
        )

        if (uiState.budgetSummary != null) {
            Text(
                text = "Days remaining: ${uiState.budgetSummary.budgetPeriod.daysRemaining}",
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun BudgetOverviewCards(summary: BudgetSummary) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(120.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        OverviewCard(
            title = "Income",
            amount = summary.totalIncome,
            modifier = Modifier.weight(1f)
        )
        OverviewCard(
            title = "Spent",
            amount = summary.totalExpensed,
            modifier = Modifier.weight(1f),
            isExpense = true
        )
        OverviewCard(
            title = "Left",
            amount = summary.leftToSpend,
            modifier = Modifier.weight(1f),
            isPositive = summary.leftToSpend > 0
        )
    }
}

@Composable
private fun OverviewCard(
    title: String,
    amount: Double,
    modifier: Modifier = Modifier,
    isExpense: Boolean = false,
    isPositive: Boolean = true
) {
    Card(
        modifier = modifier.fillMaxHeight(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = title,
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = "$${String.format("%.2f", amount)}",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = when {
                    isExpense && amount > 0 -> MaterialTheme.colorScheme.error
                    isPositive && amount > 0 -> MaterialTheme.colorScheme.primary
                    else -> MaterialTheme.colorScheme.onSurfaceVariant
                }
            )
        }
    }
}

@Composable
private fun QuickActionButtons(
    onAddTransaction: () -> Unit,
    onViewGoals: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(48.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Button(
            onClick = onAddTransaction,
            modifier = Modifier.weight(1f)
        ) {
            Text("+ Transaction")
        }
        Button(
            onClick = onViewGoals,
            modifier = Modifier.weight(1f),
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.secondary
            )
        ) {
            Text("Goals")
        }
    }
}

@Composable
private fun BudgetBreakdownCard(summary: BudgetSummary) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Budget Breakdown",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(12.dp))

            BudgetBreakdownRow("Bills", summary.totalBills, summary.totalBudgetedBills)
            BudgetBreakdownRow("Expenses", summary.totalExpenses, summary.totalBudgetedExpenses)
            BudgetBreakdownRow("Savings", summary.totalSavings, summary.totalBudgetedSavings)
            BudgetBreakdownRow("Debt", summary.totalDebt, summary.totalBudgetedDebt)

            Divider(modifier = Modifier.padding(vertical = 8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Progress", fontWeight = FontWeight.Bold)
                LinearProgressIndicator(
                    progress = summary.budgetedExpensePercentage / 100f,
                    modifier = Modifier
                        .weight(1f)
                        .padding(horizontal = 8.dp)
                )
                Text("${summary.budgetedExpensePercentage.toInt()}%")
            }
        }
    }
}

@Composable
private fun BudgetBreakdownRow(
    label: String,
    actual: Double,
    budgeted: Double
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, fontSize = 12.sp)
        Text(
            text = "$${"%.2f".format(actual)} / $${"%.2f".format(budgeted)}",
            fontSize = 12.sp,
            color = if (actual > budgeted) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun ErrorCard(error: String, onDismiss: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = error,
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.weight(1f)
            )
            Button(onClick = onDismiss) {
                Text("Dismiss")
            }
        }
    }
}
